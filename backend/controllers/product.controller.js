const {Pool} = require('pg');
const pool = require('../db');


// Create a new product
exports.createProduct = async (req, res) => {
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
      // Handle categories[] format
      categories = Array.isArray(req.body['categories[]']) 
        ? req.body['categories[]'] 
        : [req.body['categories[]']];
    }
    
    const sellerId = req.user.id; // From auth middleware
    
    // Start a transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Get file path from multer
      const imgPath = req.file ? req.file.filename : null;
      
      // Insert the product
      const productResult = await client.query(
        'INSERT INTO Products (seller_id, name, description, img_path, price, stock) VALUES ($1, $2, $3, $4, $5, $6) RETURNING product_id',
        [sellerId, name, description, imgPath, price, stock]
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
          img_path: imgPath
        }
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Create product error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
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
    const sellerId = req.user.id;
    
    const result = await pool.query(
      'SELECT * FROM Products WHERE seller_id = $1 ORDER BY product_id DESC',
      [sellerId]
    );
    
    res.json({ products: result.rows });
  } catch (err) {
    console.error(err.message);
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

// Update your updateProduct function as well
exports.updateProduct = async (req, res) => {
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
    
    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Update product details
      await client.query(
        'UPDATE Products SET name = $1, description = $2, price = $3, stock = $4, visible = $5 WHERE product_id = $6',
        [name, description, price, stock, visible === 'true' || visible === true, id]
      );
      
      // Update image if provided
      if (req.file) {
        await client.query(
          'UPDATE Products SET img_path = $1 WHERE product_id = $2',
          [req.file.filename, id]
        );
      }
      
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
        message: 'Product updated successfully' 
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server error' });
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
    console.error(err.message);
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