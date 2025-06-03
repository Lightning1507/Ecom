const {Pool} = require('pg');
const pool = require('../db');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');


// Create a new product
exports.createProduct = async (req, res) => {
  let cloudinaryResult = null;
  try {
    console.log('Request body:', req.body);
    console.log('Uploaded file:', req.file);
    
    const { name, description, price, stock } = req.body;
    let categories = req.body.categories;
    
    // Parse categories if it's an array in string format
    if (typeof categories === 'string' && categories.startsWith('[')) {
      try {
        categories = JSON.parse(categories);
      } catch (e) {
        console.error('Failed to parse categories:', e);
      }
    } else if (req.body['categories[]']) {
      categories = Array.isArray(req.body['categories[]']) 
        ? req.body['categories[]'] 
        : [req.body['categories[]']];
    }
    
    const userId = req.user.id; // From auth middleware
    
    // Start a transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Check if seller exists
      const sellerResult = await client.query(
        'SELECT seller_id FROM Sellers WHERE seller_id = $1',
        [userId]
      );
      
      if (sellerResult.rows.length === 0) {
        throw new Error('Seller profile not found. Please complete your seller profile first.');
      }
      
      const sellerId = sellerResult.rows[0].seller_id;
      
      // Upload image to Cloudinary if provided
      if (req.file) {
        try {
          cloudinaryResult = await uploadToCloudinary(req.file);
          console.log('Cloudinary upload result:', cloudinaryResult);
        } catch (uploadError) {
          console.error('Failed to upload image:', uploadError);
          throw new Error('Failed to upload image');
        }
      }
      
      // Insert the product
      const productResult = await client.query(
        'INSERT INTO Products (seller_id, name, description, img_path, price, stock) VALUES ($1, $2, $3, $4, $5, $6) RETURNING product_id',
        [
          sellerId,
          name,
          description,
          cloudinaryResult ? cloudinaryResult.url : null,
          price,
          stock
        ]
      );
      
      const productId = productResult.rows[0].product_id;
      
      // Add product categories if provided
      if (categories && categories.length > 0) {
        for (const categoryId of categories) {
          await client.query(
            'INSERT INTO Product_categories (product_id, category_id) VALUES ($1, $2)',
            [productId, categoryId]
          );
        }
      }
      
      await client.query('COMMIT');
      
      res.status(201).json({ 
        success: true, 
        message: 'Product created successfully',
        product: {
          product_id: productId,
          name,
          description,
          price,
          stock,
          img_path: cloudinaryResult ? cloudinaryResult.url : null
        }
      });
    } catch (err) {
      await client.query('ROLLBACK');
      // If upload succeeded but database failed, clean up the uploaded image
      if (cloudinaryResult && cloudinaryResult.public_id) {
        try {
          await deleteFromCloudinary(cloudinaryResult.public_id);
        } catch (deleteError) {
          console.error('Failed to delete image after rollback:', deleteError);
        }
      }
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Create product error:', err.message);
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products');
    res.json({ products: result.rows });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


// Get seller's products
exports.getSellerProducts = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // First check if seller exists
    const sellerResult = await pool.query(
      'SELECT seller_id, store_name FROM Sellers WHERE seller_id = $1',
      [userId]
    );
    
    if (sellerResult.rows.length === 0) {
      return res.json({ 
        products: [],
        message: 'Seller profile not found. Please complete your seller profile first.'
      });
    }
    
    const sellerId = sellerResult.rows[0].seller_id;
    const storeName = sellerResult.rows[0].store_name;
    
    const result = await pool.query(
      `SELECT 
        p.*,
        COALESCE(p.visible, true) as status,
        false as featured,
        0 as rating,
        0 as sales
      FROM Products p
      WHERE p.seller_id = $1
      ORDER BY p.product_id DESC`,
      [sellerId]
    );
    
    // Fetch categories for all products in one query
    const productIds = result.rows.map(product => product.product_id);
    let categoriesMap = {};
    if (productIds.length > 0) {
      const categoriesResult = await pool.query(
        `SELECT pc.product_id, c.category_id, c.name FROM Product_categories pc
         JOIN Categories c ON pc.category_id = c.category_id
         WHERE pc.product_id = ANY($1)`,
        [productIds]
      );
      // Map product_id to array of categories
      categoriesResult.rows.forEach(row => {
        if (!categoriesMap[row.product_id]) categoriesMap[row.product_id] = [];
        categoriesMap[row.product_id].push({ category_id: row.category_id, name: row.name });
      });
    }
    
    // Transform the data to match the frontend's expected format
    const products = result.rows.map(product => {
      const categories = categoriesMap[product.product_id] || [];
      return {
        id: product.product_id,
        name: product.name,
        description: product.description,
        price: parseFloat(product.price),
        stock: parseInt(product.stock),
        status: product.visible ? 'active' : 'inactive',
        featured: false,
        rating: 0,
        sales: 0,
        seller: storeName,
        img_path: product.img_path,
        categories: categories, // array of {category_id, name}
        category: categories.length > 0 ? categories[0].name : 'Uncategorized' // first category name or 'Uncategorized'
      };
    });
    
    res.json({ products });
  } catch (err) {
    console.error('Error in getSellerProducts:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get product by ID
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'SELECT p.*, u.username as seller_name, s.store_name FROM Products p JOIN Sellers s ON p.seller_id = s.seller_id JOIN Users u ON s.seller_id = u.user_id WHERE p.product_id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    // Get product categories
    const categoriesResult = await pool.query(
      'SELECT c.category_id, c.name FROM Categories c JOIN Product_categories pc ON c.category_id = pc.category_id WHERE pc.product_id = $1',
      [id]
    );
    
    const product = {
      ...result.rows[0],
      categories: categoriesResult.rows
    };
    
    res.json({ product });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update product
exports.updateProduct = async (req, res) => {
  let cloudinaryResult = null;
  try {
    const { id } = req.params;
    const { name, description, price, stock, visible } = req.body;
    let categories = req.body.categories;
    
    // Parse categories if needed
    if (typeof categories === 'string' && categories.startsWith('[')) {
      try {
        categories = JSON.parse(categories);
      } catch (e) {
        console.error('Failed to parse categories:', e);
      }
    } else if (req.body['categories[]']) {
      categories = Array.isArray(req.body['categories[]']) 
        ? req.body['categories[]'] 
        : [req.body['categories[]']];
    }
    
    const sellerId = req.user.id;
    
    // Check if product exists and belongs to seller
    const productCheck = await pool.query(
      'SELECT * FROM Products WHERE product_id = $1 AND seller_id = $2',
      [id, sellerId]
    );
    
    if (productCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found or you don\'t have permission to update it' 
      });
    }

    const existingProduct = productCheck.rows[0];
    
    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Upload new image to Cloudinary if provided
      if (req.file) {
        try {
          // Delete old image if it exists and has a public_id
          if (existingProduct.img_path && existingProduct.img_path.includes('cloudinary')) {
            try {
              const publicId = existingProduct.img_path.split('/').pop().split('.')[0];
              await deleteFromCloudinary(publicId);
            } catch (deleteError) {
              console.error('Failed to delete old image:', deleteError);
            }
          }
          
          // Upload new image
          cloudinaryResult = await uploadToCloudinary(req.file);
          console.log('Cloudinary upload result:', cloudinaryResult);
        } catch (uploadError) {
          console.error('Failed to upload/delete image:', uploadError);
          throw new Error('Failed to process image');
        }
      }
      
      // Update product details
      const updateQuery = `
        UPDATE Products 
        SET name = $1, description = $2, price = $3, stock = $4, visible = $5
        ${cloudinaryResult ? ', img_path = $6' : ''}
        WHERE product_id = $${cloudinaryResult ? '7' : '6'}
      `;
      
      const updateValues = [
        name,
        description,
        price,
        stock,
        visible === 'true' || visible === true,
        ...(cloudinaryResult ? [cloudinaryResult.url] : []),
        id
      ];
      
      await client.query(updateQuery, updateValues);
      
      // Update categories if provided
      if (categories) {
        // Delete existing categories
        await client.query(
          'DELETE FROM Product_categories WHERE product_id = $1',
          [id]
        );
        
        // Add new categories
        for (const categoryId of categories) {
          await client.query(
            'INSERT INTO Product_categories (product_id, category_id) VALUES ($1, $2)',
            [id, categoryId]
          );
        }
      }
      
      await client.query('COMMIT');
      
      res.json({ 
        success: true, 
        message: 'Product updated successfully',
        product: {
          ...existingProduct,
          name,
          description,
          price,
          stock,
          visible: visible === 'true' || visible === true,
          img_path: cloudinaryResult ? cloudinaryResult.url : existingProduct.img_path
        }
      });
    } catch (err) {
      await client.query('ROLLBACK');
      // If upload succeeded but database failed, clean up the uploaded image
      if (cloudinaryResult && cloudinaryResult.public_id) {
        try {
          await deleteFromCloudinary(cloudinaryResult.public_id);
        } catch (deleteError) {
          console.error('Failed to delete image after rollback:', deleteError);
        }
      }
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Update product error:', err.message);
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const sellerId = req.user.id;
    
    // Check if product exists and belongs to seller
    const productCheck = await pool.query(
      'SELECT * FROM Products WHERE product_id = $1 AND seller_id = $2',
      [id, sellerId]
    );
    
    if (productCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found or you don\'t have permission to delete it' 
      });
    }

    const product = productCheck.rows[0];
    
    // Delete image from Cloudinary if it exists
    if (product.img_path && product.img_path.includes('cloudinary')) {
      try {
        const publicId = product.img_path.split('/').pop().split('.')[0];
        await deleteFromCloudinary(publicId);
      } catch (deleteError) {
        console.error('Failed to delete image from Cloudinary:', deleteError);
        // Continue with product deletion even if image deletion fails
      }
    }
    
    // Delete product
    await pool.query(
      'DELETE FROM Products WHERE product_id = $1',
      [id]
    );
    
    res.json({ 
      success: true, 
      message: 'Product deleted successfully' 
    });
  } catch (err) {
    console.error('Delete product error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get all categories
exports.getAllCategories = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM Categories ORDER BY name');
    res.json({ categories: result.rows });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Toggle product status (active/inactive)
exports.toggleProductStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const sellerId = req.user.id;

    // Check if product exists and belongs to seller
    const productCheck = await pool.query(
      'SELECT * FROM Products WHERE product_id = $1 AND seller_id = $2',
      [id, sellerId]
    );

    if (productCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or you don\'t have permission to update it'
      });
    }

    // Toggle the visible status
    const result = await pool.query(
      'UPDATE Products SET visible = NOT visible WHERE product_id = $1 RETURNING *',
      [id]
    );

    res.json({
      success: true,
      message: 'Product status updated successfully',
      product: {
        ...result.rows[0],
        status: result.rows[0].visible ? 'active' : 'inactive'
      }
    });
  } catch (err) {
    console.error('Toggle product status error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Toggle product featured status (disabled since we don't have this field)
exports.toggleProductFeatured = async (req, res) => {
  res.status(400).json({
    success: false,
    message: 'Featured status is not supported in the current database schema'
  });
};