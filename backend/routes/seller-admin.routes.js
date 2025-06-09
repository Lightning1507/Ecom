const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// Middleware to check if user is admin
const adminAuth = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin role required.'
    });
  }
  next();
};

// Get all sellers with their store information
router.get('/sellers', auth, adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '', verification = '' } = req.query;
    const offset = (page - 1) * limit;

    let whereConditions = ['u.role = $1'];
    let params = ['seller'];
    let paramIndex = 2;

    // Add search filter
    if (search) {
      whereConditions.push(`(u.full_name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex} OR u.username ILIKE $${paramIndex} OR s.store_name ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Add status filter (locked/active)
    if (status && status !== 'all') {
      const isLocked = status === 'suspended';
      whereConditions.push(`u.locked = $${paramIndex}`);
      params.push(isLocked);
      paramIndex++;
    }

    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

    // Get total count
    const countQuery = `
      SELECT COUNT(*) 
      FROM Users u 
      LEFT JOIN Sellers s ON u.user_id = s.seller_id 
      ${whereClause}
    `;
    const totalResult = await pool.query(countQuery, params);
    const total = parseInt(totalResult.rows[0].count);

    // Get sellers with their store information
    const sellersQuery = `
      SELECT 
        u.user_id,
        u.username,
        u.full_name,
        u.email,
        u.phone,
        u.address,
        u.locked,
        s.store_name,
        s.description,
        COALESCE((
          SELECT COUNT(*) 
          FROM Products p 
          WHERE p.seller_id = s.seller_id AND p.visible = true
        ), 0) as products_count,
        COALESCE((
          SELECT SUM(oi.price * oi.quantity) 
          FROM Order_items oi
          JOIN Orders o ON oi.order_id = o.order_id
          WHERE o.seller_id = s.seller_id AND o.status = 'delivered'
        ), 0) as total_sales
      FROM Users u 
      LEFT JOIN Sellers s ON u.user_id = s.seller_id 
      ${whereClause}
      ORDER BY u.user_id DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    params.push(limit, offset);
    const sellersResult = await pool.query(sellersQuery, params);

    // Format the data to match frontend expectations
    const sellers = sellersResult.rows.map(seller => ({
      id: seller.user_id,
      name: seller.store_name || 'No Store Name',
      ownerName: seller.full_name,
      email: seller.email,
      phone: seller.phone,
      status: seller.locked ? 'suspended' : 'active',
      productsCount: parseInt(seller.products_count) || 0,
      totalSales: parseInt(seller.total_sales) || 0,
      rating: 4.0, // Default rating - you can calculate this from reviews later
      verificationStatus: seller.store_name ? 'verified' : 'pending',
      description: seller.description
    }));

    res.json({
      success: true,
      sellers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching sellers:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching sellers'
    });
  }
});

// Update seller status (lock/unlock)
router.put('/sellers/:sellerId/status', auth, adminAuth, async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { locked } = req.body;

    // Check if the user is a seller
    const sellerCheck = await pool.query(
      'SELECT role FROM Users WHERE user_id = $1 AND role = $2',
      [sellerId, 'seller']
    );

    if (sellerCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    const result = await pool.query(
      'UPDATE Users SET locked = $1 WHERE user_id = $2 AND role = $3 RETURNING *',
      [locked, sellerId, 'seller']
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    res.json({
      success: true,
      message: `Seller ${locked ? 'suspended' : 'activated'} successfully`,
      seller: {
        id: result.rows[0].user_id,
        status: result.rows[0].locked ? 'suspended' : 'active'
      }
    });

  } catch (error) {
    console.error('Error updating seller status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating seller status'
    });
  }
});

// Delete seller
router.delete('/sellers/:sellerId', auth, adminAuth, async (req, res) => {
  try {
    const { sellerId } = req.params;

    // Check if the user is a seller
    const sellerCheck = await pool.query(
      'SELECT role FROM Users WHERE user_id = $1 AND role = $2',
      [sellerId, 'seller']
    );

    if (sellerCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    // Delete the user (this will cascade to seller profile due to foreign key)
    const result = await pool.query(
      'DELETE FROM Users WHERE user_id = $1 AND role = $2 RETURNING *',
      [sellerId, 'seller']
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    res.json({
      success: true,
      message: 'Seller deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting seller:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting seller'
    });
  }
});

// Update seller
router.put('/sellers/:sellerId', auth, adminAuth, async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { full_name, email, phone, address, store_name, description } = req.body;

    // Validate input
    if (!full_name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Name and email are required'
      });
    }

    // Check if email is already taken by another user
    const emailCheck = await pool.query(
      'SELECT user_id FROM Users WHERE email = $1 AND user_id != $2',
      [email, sellerId]
    );

    if (emailCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email is already taken by another user'
      });
    }

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update user information
      const userResult = await client.query(
        `UPDATE Users 
         SET full_name = $1, email = $2, phone = $3, address = $4
         WHERE user_id = $5 AND role = 'seller'
         RETURNING user_id, username, full_name, email, phone, address, locked`,
        [full_name, email, phone || null, address || '', sellerId]
      );

      if (userResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'Seller not found'
        });
      }

      // Update or create seller profile
      let sellerResult;
      if (store_name) {
        // Check if seller profile exists
        const existingProfile = await client.query(
          'SELECT seller_id FROM Sellers WHERE seller_id = $1',
          [sellerId]
        );

        if (existingProfile.rows.length > 0) {
          // Update existing profile
          sellerResult = await client.query(
            `UPDATE Sellers 
             SET store_name = $1, description = $2
             WHERE seller_id = $3
             RETURNING *`,
            [store_name, description || '', sellerId]
          );
        } else {
          // Create new profile
          sellerResult = await client.query(
            `INSERT INTO Sellers (seller_id, store_name, description)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [sellerId, store_name, description || '']
          );
        }
      }

      await client.query('COMMIT');

      const user = userResult.rows[0];
      const seller = sellerResult ? sellerResult.rows[0] : null;

      res.json({
        success: true,
        message: 'Seller updated successfully',
        seller: {
          id: user.user_id,
          name: seller?.store_name || 'No Store Name',
          ownerName: user.full_name,
          email: user.email,
          phone: user.phone,
          address: user.address,
          status: user.locked ? 'suspended' : 'active',
          description: seller?.description || '',
          verificationStatus: seller ? 'verified' : 'pending'
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error updating seller:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating seller'
    });
  }
});

// Get seller details by ID
router.get('/sellers/:sellerId', auth, adminAuth, async (req, res) => {
  try {
    const { sellerId } = req.params;

    const result = await pool.query(
      `SELECT 
        u.user_id,
        u.username,
        u.full_name,
        u.email,
        u.phone,
        u.address,
        u.locked,
        s.store_name,
        s.description,
        COALESCE((
          SELECT COUNT(*) 
          FROM Products p 
          WHERE p.seller_id = s.seller_id AND p.visible = true
        ), 0) as products_count,
        COALESCE((
          SELECT SUM(oi.price * oi.quantity) 
          FROM Order_items oi
          JOIN Orders o ON oi.order_id = o.order_id
          WHERE o.seller_id = s.seller_id AND o.status = 'delivered'
        ), 0) as total_sales
      FROM Users u 
      LEFT JOIN Sellers s ON u.user_id = s.seller_id 
      WHERE u.user_id = $1 AND u.role = $2`,
      [sellerId, 'seller']
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    const seller = result.rows[0];
    res.json({
      success: true,
      seller: {
        id: seller.user_id,
        name: seller.store_name || 'No Store Name',
        ownerName: seller.full_name,
        email: seller.email,
        phone: seller.phone,
        address: seller.address,
        status: seller.locked ? 'suspended' : 'active',
        productsCount: parseInt(seller.products_count) || 0,
        totalSales: parseInt(seller.total_sales) || 0,
        rating: 4.0,
        verificationStatus: seller.store_name ? 'verified' : 'pending',
        description: seller.description
      }
    });

  } catch (error) {
    console.error('Error fetching seller details:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching seller details'
    });
  }
});

// ====================
// ADMIN PRODUCT MANAGEMENT ROUTES
// ====================

// Get all products (admin view)
router.get('/products', auth, adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', category = '', status = '', seller = '' } = req.query;
    const offset = (page - 1) * limit;

    let whereConditions = ['1=1'];
    let params = [];
    let paramIndex = 1;

    // Add search filter
    if (search) {
      whereConditions.push(`(p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex} OR s.store_name ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Add category filter (this would require category implementation)
    if (category && category !== 'all') {
      whereConditions.push(`c.name = $${paramIndex}`);
      params.push(category);
      paramIndex++;
    }

    // Add status filter
    if (status && status !== 'all') {
      const isVisible = status === 'active';
      whereConditions.push(`p.visible = $${paramIndex}`);
      params.push(isVisible);
      paramIndex++;
    }

    // Add seller filter
    if (seller && seller !== 'all') {
      whereConditions.push(`s.seller_id = $${paramIndex}`);
      params.push(seller);
      paramIndex++;
    }

    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

    // Get total count
    const countQuery = `
      SELECT COUNT(DISTINCT p.product_id) 
      FROM Products p 
      LEFT JOIN Sellers s ON p.seller_id = s.seller_id 
      LEFT JOIN Product_categories pc ON p.product_id = pc.product_id
      LEFT JOIN Categories c ON pc.category_id = c.category_id
      ${whereClause}
    `;
    const totalResult = await pool.query(countQuery, params);
    const total = parseInt(totalResult.rows[0].count);

    // Get products with seller information
    const productsQuery = `
      SELECT DISTINCT
        p.product_id,
        p.name,
        p.description,
        p.price,
        p.stock,
        p.visible,
        p.img_path,
        s.store_name as seller_name,
        s.seller_id,
        u.full_name as seller_owner,
        COALESCE((
          SELECT COUNT(*) 
          FROM Order_items oi
          JOIN Orders o ON oi.order_id = o.order_id
          WHERE oi.product_id = p.product_id AND o.status = 'delivered'
        ), 0) as total_sales,
        COALESCE((
          SELECT AVG(rating) 
          FROM Reviews r 
          WHERE r.product_id = p.product_id
        ), 0) as avg_rating
      FROM Products p 
      LEFT JOIN Sellers s ON p.seller_id = s.seller_id 
      LEFT JOIN Users u ON s.seller_id = u.user_id
      LEFT JOIN Product_categories pc ON p.product_id = pc.product_id
      LEFT JOIN Categories c ON pc.category_id = c.category_id
      ${whereClause}
      ORDER BY p.product_id DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    params.push(limit, offset);
    const productsResult = await pool.query(productsQuery, params);

    // Get categories for all products
    const productIds = productsResult.rows.map(p => p.product_id);
    let categoriesMap = {};
    if (productIds.length > 0) {
      const categoriesResult = await pool.query(
        `SELECT pc.product_id, c.name 
         FROM Product_categories pc
         JOIN Categories c ON pc.category_id = c.category_id
         WHERE pc.product_id = ANY($1)`,
        [productIds]
      );
      categoriesResult.rows.forEach(row => {
        if (!categoriesMap[row.product_id]) categoriesMap[row.product_id] = [];
        categoriesMap[row.product_id].push(row.name);
      });
    }

    // Format the data to match frontend expectations
    const products = productsResult.rows.map(product => ({
      id: product.product_id,
      name: product.name,
      description: product.description,
      price: parseFloat(product.price),
      stock: parseInt(product.stock),
      status: product.visible ? 'active' : 'inactive',
      seller: {
        id: product.seller_id,
        name: product.seller_name || 'No Store',
        owner: product.seller_owner || 'Unknown'
      },
      categories: categoriesMap[product.product_id] || ['Uncategorized'],
      category: (categoriesMap[product.product_id] && categoriesMap[product.product_id][0]) || 'Uncategorized',
      totalSales: parseInt(product.total_sales) || 0,
      rating: parseFloat(product.avg_rating) || 0,
      image: product.img_path
    }));

    res.json({
      success: true,
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching products'
    });
  }
});

// Update product status (admin)
router.put('/products/:productId/status', auth, adminAuth, async (req, res) => {
  try {
    const { productId } = req.params;
    const { visible } = req.body;

    const result = await pool.query(
      'UPDATE Products SET visible = $1 WHERE product_id = $2 RETURNING *',
      [visible, productId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: `Product ${visible ? 'activated' : 'deactivated'} successfully`,
      product: {
        id: result.rows[0].product_id,
        status: result.rows[0].visible ? 'active' : 'inactive'
      }
    });

  } catch (error) {
    console.error('Error updating product status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating product status'
    });
  }
});

// Delete product (admin)
router.delete('/products/:productId', auth, adminAuth, async (req, res) => {
  try {
    const { productId } = req.params;

    // Check if product exists
    const productCheck = await pool.query(
      'SELECT * FROM Products WHERE product_id = $1',
      [productId]
    );

    if (productCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Delete the product (this will cascade to related tables)
    const result = await pool.query(
      'DELETE FROM Products WHERE product_id = $1 RETURNING *',
      [productId]
    );

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting product'
    });
  }
});

// Get product details (admin)
router.get('/products/:productId', auth, adminAuth, async (req, res) => {
  try {
    const { productId } = req.params;

    const result = await pool.query(
      `SELECT 
        p.*,
        s.store_name as seller_name,
        s.seller_id,
        u.full_name as seller_owner,
        u.email as seller_email,
        u.phone as seller_phone
      FROM Products p 
      LEFT JOIN Sellers s ON p.seller_id = s.seller_id 
      LEFT JOIN Users u ON s.seller_id = u.user_id
      WHERE p.product_id = $1`,
      [productId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Get categories for the product
    const categoriesResult = await pool.query(
      `SELECT c.name 
       FROM Product_categories pc
       JOIN Categories c ON pc.category_id = c.category_id
       WHERE pc.product_id = $1`,
      [productId]
    );

    const product = result.rows[0];
    res.json({
      success: true,
      product: {
        id: product.product_id,
        name: product.name,
        description: product.description,
        price: parseFloat(product.price),
        stock: parseInt(product.stock),
        status: product.visible ? 'active' : 'inactive',
        seller: {
          id: product.seller_id,
          name: product.seller_name || 'No Store',
          owner: product.seller_owner || 'Unknown',
          email: product.seller_email,
          phone: product.seller_phone
        },
        categories: categoriesResult.rows.map(cat => cat.name),
        image: product.img_path
      }
    });

  } catch (error) {
    console.error('Error fetching product details:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching product details'
    });
  }
});

// ====================
// ADMIN ORDERS MANAGEMENT ROUTES
// ====================

// Get all orders (admin view)
router.get('/orders', auth, adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '', date = '', sort = 'date-desc' } = req.query;
    const offset = (page - 1) * limit;

    let whereConditions = ['1=1'];
    let params = [];
    let paramIndex = 1;

    // Add search filter
    if (search) {
      whereConditions.push(`(
        CAST(o.order_id AS TEXT) ILIKE $${paramIndex} OR 
        u.full_name ILIKE $${paramIndex} OR 
        u.username ILIKE $${paramIndex} OR 
        o.tracking_number ILIKE $${paramIndex}
      )`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Add status filter
    if (status && status !== 'all') {
      whereConditions.push(`o.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    // Add date filter
    if (date && date !== 'all') {
      let dateCondition = '';
      switch (date) {
        case 'today':
          dateCondition = `DATE(o.order_date) = CURRENT_DATE`;
          break;
        case 'yesterday':
          dateCondition = `DATE(o.order_date) = CURRENT_DATE - INTERVAL '1 day'`;
          break;
        case 'week':
          dateCondition = `o.order_date >= CURRENT_DATE - INTERVAL '7 days'`;
          break;
        case 'month':
          dateCondition = `o.order_date >= CURRENT_DATE - INTERVAL '30 days'`;
          break;
      }
      if (dateCondition) {
        whereConditions.push(dateCondition);
      }
    }

    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

    // Determine sort order
    const [sortBy, sortOrder] = sort.split('-');
    let orderByClause = '';
    switch (sortBy) {
      case 'date':
        orderByClause = `ORDER BY o.order_date ${sortOrder.toUpperCase()}`;
        break;
      case 'total':
        orderByClause = `ORDER BY p.amount ${sortOrder.toUpperCase()}`;
        break;
      case 'items':
        orderByClause = `ORDER BY item_count ${sortOrder.toUpperCase()}`;
        break;
      default:
        orderByClause = 'ORDER BY o.order_date DESC';
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(DISTINCT o.order_id) 
      FROM Orders o
      LEFT JOIN Users u ON o.user_id = u.user_id
      LEFT JOIN Sellers sel ON o.seller_id = sel.seller_id
      LEFT JOIN Payments p ON o.order_id = p.order_id
      ${whereClause}
    `;
    const totalResult = await pool.query(countQuery, params);
    const total = parseInt(totalResult.rows[0].count);

    // Get orders with all related information
    const ordersQuery = `
      SELECT DISTINCT
        o.order_id,
        o.order_date,
        o.status as order_status,
        o.tracking_number,
        o.shipping_status,
        o.estimated_delivery,
        u.full_name as customer_name,
        u.username as customer_username,
        u.email as customer_email,
        u.address as customer_address,
        sel.store_name as seller_name,
        p.amount as total_amount,
        p.status as payment_status,
        p.payment_method,
        (
          SELECT COUNT(*) 
          FROM Order_items oi 
          WHERE oi.order_id = o.order_id
        ) as item_count,
        (
          SELECT SUM(oi.quantity) 
          FROM Order_items oi 
          WHERE oi.order_id = o.order_id
        ) as total_quantity
      FROM Orders o
      LEFT JOIN Users u ON o.user_id = u.user_id
      LEFT JOIN Sellers sel ON o.seller_id = sel.seller_id
      LEFT JOIN Payments p ON o.order_id = p.order_id
      ${whereClause}
      ${orderByClause}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    params.push(limit, offset);
    const ordersResult = await pool.query(ordersQuery, params);

    // Format the data to match frontend expectations
    const orders = ordersResult.rows.map(order => ({
      id: `ORD-${order.order_id}`,
      orderId: order.order_id,
      customer: order.customer_name || order.customer_username || 'Unknown Customer',
      customerEmail: order.customer_email,
      date: order.order_date,
      total: parseFloat(order.total_amount) || 0,
      items: parseInt(order.total_quantity) || 0,
      itemCount: parseInt(order.item_count) || 0,
      status: order.order_status,
      paymentStatus: order.payment_status || 'pending',
      paymentMethod: order.payment_method,
      shippingAddress: order.customer_address || 'No address provided',
      trackingNumber: order.tracking_number,
      shippingStatus: order.shipping_status,
      seller: order.seller_name || 'Unknown Seller'
    }));

    res.json({
      success: true,
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching orders'
    });
  }
});

// Update order status (admin)
router.put('/orders/:orderId/status', auth, adminAuth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
      });
    }

    const result = await pool.query(
      'UPDATE Orders SET status = $1 WHERE order_id = $2 RETURNING *',
      [status, orderId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      message: `Order status updated to ${status}`,
      order: {
        id: result.rows[0].order_id,
        status: result.rows[0].status
      }
    });

  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating order status'
    });
  }
});

// Get order details (admin)
router.get('/orders/:orderId', auth, adminAuth, async (req, res) => {
  try {
    const { orderId } = req.params;

    // Get order with customer, seller, payment, and shipping info
    const orderQuery = `
      SELECT 
        o.*,
        u.full_name as customer_name,
        u.username as customer_username,
        u.email as customer_email,
        u.phone as customer_phone,
        u.address as customer_address,
        sel.store_name as seller_name,
        seller_user.full_name as seller_owner,
        seller_user.email as seller_email,
        p.amount as total_amount,
        p.status as payment_status,
        p.payment_method,
        p.payment_date,
        ship_unit.company_name as shipping_company,
        ship_user.full_name as shipper_name
      FROM Orders o
      LEFT JOIN Users u ON o.user_id = u.user_id
      LEFT JOIN Sellers sel ON o.seller_id = sel.seller_id
      LEFT JOIN Users seller_user ON sel.seller_id = seller_user.user_id
      LEFT JOIN Payments p ON o.order_id = p.order_id
      LEFT JOIN Shipping_units ship_unit ON o.Shipping_units_id = ship_unit.Shipping_units_id
      LEFT JOIN Users ship_user ON ship_unit.Shipping_units_id = ship_user.user_id
      WHERE o.order_id = $1
    `;

    const orderResult = await pool.query(orderQuery, [orderId]);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Get order items
    const itemsQuery = `
      SELECT 
        oi.*,
        p.name as product_name,
        p.description as product_description,
        p.img_path as product_image
      FROM Order_items oi
      LEFT JOIN Products p ON oi.product_id = p.product_id
      WHERE oi.order_id = $1
    `;

    const itemsResult = await pool.query(itemsQuery, [orderId]);

    const order = orderResult.rows[0];
    res.json({
      success: true,
      order: {
        id: `ORD-${order.order_id}`,
        orderId: order.order_id,
        date: order.order_date,
        status: order.status,
        customer: {
          name: order.customer_name || order.customer_username,
          email: order.customer_email,
          phone: order.customer_phone,
          address: order.customer_address
        },
        seller: {
          storeName: order.seller_name,
          owner: order.seller_owner,
          email: order.seller_email
        },
        payment: {
          amount: parseFloat(order.total_amount) || 0,
          status: order.payment_status,
          method: order.payment_method,
          date: order.payment_date
        },
        shipping: {
          trackingNumber: order.tracking_number,
          status: order.shipping_status,
          estimatedDelivery: order.estimated_delivery,
          company: order.shipping_company,
          shipper: order.shipper_name
        },
        items: itemsResult.rows.map(item => ({
          productId: item.product_id,
          name: item.product_name,
          description: item.product_description,
          image: item.product_image,
          quantity: item.quantity,
          price: parseFloat(item.price),
          total: parseFloat(item.price) * item.quantity
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching order details'
    });
  }
});

module.exports = router; 