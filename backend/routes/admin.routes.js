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

// Get all users with pagination and filtering
router.get('/users', auth, adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role = '', status = '' } = req.query;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let params = [];
    let paramIndex = 1;

    // Add search filter
    if (search) {
      whereConditions.push(`(full_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR username ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Add role filter
    if (role && role !== 'all') {
      whereConditions.push(`role = $${paramIndex}`);
      params.push(role);
      paramIndex++;
    }

    // Add status filter (locked/active)
    if (status && status !== 'all') {
      const isLocked = status === 'suspended';
      whereConditions.push(`locked = $${paramIndex}`);
      params.push(isLocked);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM Users ${whereClause}`;
    const totalResult = await pool.query(countQuery, params);
    const total = parseInt(totalResult.rows[0].count);

    // Get users with pagination
    const usersQuery = `
      SELECT 
        user_id,
        username,
        full_name,
        email,
        phone,
        address,
        role,
        locked
      FROM Users 
      ${whereClause}
      ORDER BY user_id DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    params.push(limit, offset);
    const usersResult = await pool.query(usersQuery, params);

    // Format the data to match frontend expectations
    const users = usersResult.rows.map(user => ({
      id: user.user_id,
      name: user.full_name,
      email: user.email,
      username: user.username,
      phone: user.phone,
      address: user.address,
      role: user.role,
      status: user.locked ? 'suspended' : 'active'
    }));

    res.json({
      success: true,
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching users'
    });
  }
});

// Update user status (lock/unlock)
router.put('/users/:userId/status', auth, adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { locked } = req.body;

    // Don't allow admin to lock themselves
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot change your own status'
      });
    }

    const result = await pool.query(
      'UPDATE Users SET locked = $1 WHERE user_id = $2 RETURNING *',
      [locked, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: `User ${locked ? 'suspended' : 'activated'} successfully`,
      user: {
        id: result.rows[0].user_id,
        status: result.rows[0].locked ? 'suspended' : 'active'
      }
    });

  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating user status'
    });
  }
});

// Delete user
router.delete('/users/:userId', auth, adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    // Don't allow admin to delete themselves
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    const result = await pool.query(
      'DELETE FROM Users WHERE user_id = $1 RETURNING *',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting user'
    });
  }
});

// Update user
router.put('/users/:userId', auth, adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { full_name, email, phone, address, role } = req.body;

    // Don't allow admin to modify themselves
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot modify your own account'
      });
    }

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
      [email, userId]
    );

    if (emailCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email is already taken by another user'
      });
    }

    const result = await pool.query(
      `UPDATE Users 
       SET full_name = $1, email = $2, phone = $3, address = $4, role = $5
       WHERE user_id = $6 
       RETURNING user_id, username, full_name, email, phone, address, role, locked`,
      [full_name, email, phone || null, address || '', role, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = result.rows[0];
    res.json({
      success: true,
      message: 'User updated successfully',
      user: {
        id: user.user_id,
        name: user.full_name,
        email: user.email,
        username: user.username,
        phone: user.phone,
        address: user.address,
        role: user.role,
        status: user.locked ? 'suspended' : 'active'
      }
    });

  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating user'
    });
  }
});

// Get user details by ID
router.get('/users/:userId', auth, adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      `SELECT 
        user_id,
        username,
        full_name,
        email,
        phone,
        address,
        role,
        locked
      FROM Users 
      WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = result.rows[0];
    res.json({
      success: true,
      user: {
        id: user.user_id,
        name: user.full_name,
        email: user.email,
        username: user.username,
        phone: user.phone,
        address: user.address,
        role: user.role,
        status: user.locked ? 'suspended' : 'active'
      }
    });

  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user details'
    });
  }
});

// Get admin dashboard stats
router.get('/dashboard/stats', auth, adminAuth, async (req, res) => {
  try {
    // Execute all queries in parallel
    const [
      totalUsersResult,
      totalSellersResult,
      totalOrdersResult,
      totalRevenueResult,
      activeListingsResult,
      pendingReviewsResult,
      recentOrdersResult
    ] = await Promise.all([
      // Total users count
      pool.query('SELECT COUNT(*) FROM Users'),
      
      // Total sellers count
      pool.query(`
        SELECT COUNT(*) 
        FROM Users 
        WHERE role = 'seller' AND locked = false
      `),
      
      // Total orders count
      pool.query('SELECT COUNT(*) FROM Orders'),
      
      // Total revenue (sum of all completed payments)
      pool.query(`
        SELECT COALESCE(SUM(amount), 0) as total_revenue
        FROM Payments 
        WHERE status = 'completed'
      `),
      
      // Active listings count
      pool.query(`
        SELECT COUNT(*) 
        FROM Products 
        WHERE visible = true AND stock > 0
      `),
      
      // Pending reviews count (orders that are delivered but not reviewed)
      pool.query(`
        SELECT COUNT(DISTINCT o.order_id) 
        FROM Orders o
        LEFT JOIN Reviews r ON o.order_id = r.order_id
        WHERE o.status = 'delivered' AND r.review_id IS NULL
      `),
      
      // Recent orders
      pool.query(`
        SELECT 
          o.order_id,
          u.full_name as customer_name,
          p.amount,
          o.status,
          o.order_date
        FROM Orders o
        JOIN Users u ON o.user_id = u.user_id
        JOIN Payments p ON o.order_id = p.order_id
        ORDER BY o.order_date DESC
        LIMIT 10
      `)
    ]);

    // Extract the results
    const totalUsers = parseInt(totalUsersResult.rows[0].count);
    const totalSellers = parseInt(totalSellersResult.rows[0].count);
    const totalOrders = parseInt(totalOrdersResult.rows[0].count);
    const totalRevenue = parseFloat(totalRevenueResult.rows[0].total_revenue) || 0;
    const activeListings = parseInt(activeListingsResult.rows[0].count);
    const pendingReviews = parseInt(pendingReviewsResult.rows[0].count);
    
    // Format recent orders
    const recentOrders = recentOrdersResult.rows.map(order => ({
      id: order.order_id.toString(),
      customer: order.customer_name || 'Unknown Customer',
      amount: parseFloat(order.amount),
      status: order.status.charAt(0).toUpperCase() + order.status.slice(1),
      date: order.order_date
    }));

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalSellers,
        totalOrders,
        totalRevenue,
        activeListings,
        pendingReviews
      },
      recentOrders
    });

  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard statistics'
    });
  }
});

// Get all orders for admin
router.get('/orders', auth, adminAuth, async (req, res) => {
  try {
    const { search = '', status = 'all', paymentStatus = 'all', date = 'all', sort = 'date-desc', limit = '50' } = req.query;
    
    let whereConditions = [];
    let params = [];
    let paramIndex = 1;

    // Add search filter
    if (search) {
      whereConditions.push(`(
        o.order_id::text ILIKE $${paramIndex} OR 
        u.full_name ILIKE $${paramIndex} OR 
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

    // Add payment status filter
    if (paymentStatus && paymentStatus !== 'all') {
      whereConditions.push(`p.status = $${paramIndex}`);
      params.push(paymentStatus);
      paramIndex++;
    }

    // Add date filter
    if (date && date !== 'all') {
      let dateCondition = '';
      switch (date) {
        case 'today':
          dateCondition = `o.order_date >= CURRENT_DATE`;
          break;
        case 'yesterday':
          dateCondition = `o.order_date >= CURRENT_DATE - INTERVAL '1 day' AND o.order_date < CURRENT_DATE`;
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

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Sort logic
    let orderClause = 'ORDER BY o.order_date DESC';
    if (sort) {
      const [sortField, sortOrder] = sort.split('-');
      switch (sortField) {
        case 'date':
          orderClause = `ORDER BY o.order_date ${sortOrder.toUpperCase()}`;
          break;
        case 'total':
          orderClause = `ORDER BY p.amount ${sortOrder.toUpperCase()}`;
          break;
        case 'items':
          orderClause = `ORDER BY item_count ${sortOrder.toUpperCase()}`;
          break;
      }
    }

    const query = `
      SELECT 
        o.order_id,
        'ORD-' || o.order_id as id,
        u.full_name as customer,
        o.order_date as date,
        COUNT(oi.product_id) as items,
        p.amount as total,
        o.status,
        p.status as paymentStatus,
        o.tracking_number
      FROM Orders o
      JOIN Users u ON o.user_id = u.user_id
      LEFT JOIN Payments p ON o.order_id = p.order_id
      LEFT JOIN Order_items oi ON o.order_id = oi.order_id
      ${whereClause}
      GROUP BY o.order_id, u.full_name, o.order_date, p.amount, o.status, p.status, o.tracking_number
      ${orderClause}
      LIMIT $${paramIndex}
    `;

    params.push(parseInt(limit));
    const result = await pool.query(query, params);

    const orders = result.rows.map(row => ({
      orderId: row.order_id,
      id: row.id,
      customer: row.customer || 'Unknown Customer',
      date: row.date,
      items: parseInt(row.items) || 0,
      total: parseFloat(row.total) || 0,
      status: row.status || 'pending',
      paymentStatus: row.paymentstatus || 'pending',
      trackingNumber: row.tracking_number
    }));

    res.json({
      success: true,
      orders
    });

  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching orders'
    });
  }
});

// Get single order details for admin
router.get('/orders/:orderId', auth, adminAuth, async (req, res) => {
  try {
    const { orderId } = req.params;

    const orderQuery = `
      SELECT 
        o.order_id,
        'ORD-' || o.order_id as id,
        o.order_date as date,
        o.status,
        o.tracking_number,
        u.full_name as customer_name,
        u.email as customer_email,
        u.phone as customer_phone,
        u.address as customer_address,
        p.amount as payment_amount,
        p.status as payment_status,
        p.payment_method,
        su.company_name as shipping_company
      FROM Orders o
      JOIN Users u ON o.user_id = u.user_id
      LEFT JOIN Payments p ON o.order_id = p.order_id
      LEFT JOIN Shipping_units su ON o.shipping_units_id = su.shipping_units_id
      WHERE o.order_id = $1
    `;

    const itemsQuery = `
      SELECT 
        pr.name,
        oi.quantity,
        oi.price,
        (oi.quantity * oi.price) as total
      FROM Order_items oi
      JOIN Products pr ON oi.product_id = pr.product_id
      WHERE oi.order_id = $1
    `;

    const [orderResult, itemsResult] = await Promise.all([
      pool.query(orderQuery, [orderId]),
      pool.query(itemsQuery, [orderId])
    ]);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const orderData = orderResult.rows[0];
    const items = itemsResult.rows.map(item => ({
      name: item.name,
      quantity: item.quantity,
      price: parseFloat(item.price),
      total: parseFloat(item.total)
    }));

    const order = {
      id: orderData.id,
      date: orderData.date,
      status: orderData.status,
      customer: {
        name: orderData.customer_name,
        email: orderData.customer_email,
        phone: orderData.customer_phone,
        address: orderData.customer_address
      },
      payment: {
        amount: parseFloat(orderData.payment_amount) || 0,
        status: orderData.payment_status,
        method: orderData.payment_method
      },
      shipping: {
        trackingNumber: orderData.tracking_number,
        company: orderData.shipping_company,
        status: orderData.shipping_status
      },
      items
    };

    res.json({
      success: true,
      order
    });

  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching order details'
    });
  }
});

// Update order status
router.put('/orders/:orderId/status', auth, adminAuth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status provided'
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
      message: 'Order status updated successfully',
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

// Update payment status
router.put('/orders/:orderId/payment-status', auth, adminAuth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentStatus } = req.body;

    // Validate payment status
    const validStatuses = ['pending', 'completed', 'failed', 'refunded'];
    if (!validStatuses.includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment status provided'
      });
    }

    const result = await pool.query(
      'UPDATE Payments SET status = $1 WHERE order_id = $2 RETURNING *',
      [paymentStatus, orderId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found for this order'
      });
    }

    res.json({
      success: true,
      message: 'Payment status updated successfully',
      payment: {
        orderId: parseInt(orderId),
        status: result.rows[0].status
      }
    });

  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating payment status'
    });
  }
});

// Get analytics data
router.get('/analytics', auth, adminAuth, async (req, res) => {
  try {
    const { timeRange = '7days' } = req.query;
    
    // Calculate date range
    let dateCondition = '';
    let chartDateCondition = '';
    switch (timeRange) {
      case '7days':
        dateCondition = `AND o.order_date >= CURRENT_DATE - INTERVAL '7 days'`;
        chartDateCondition = `WHERE order_date >= CURRENT_DATE - INTERVAL '7 days'`;
        break;
      case '30days':
        dateCondition = `AND o.order_date >= CURRENT_DATE - INTERVAL '30 days'`;
        chartDateCondition = `WHERE order_date >= CURRENT_DATE - INTERVAL '30 days'`;
        break;
      case '90days':
        dateCondition = `AND o.order_date >= CURRENT_DATE - INTERVAL '90 days'`;
        chartDateCondition = `WHERE order_date >= CURRENT_DATE - INTERVAL '90 days'`;
        break;
      case 'year':
        dateCondition = `AND o.order_date >= CURRENT_DATE - INTERVAL '1 year'`;
        chartDateCondition = `WHERE order_date >= CURRENT_DATE - INTERVAL '1 year'`;
        break;
      default:
        dateCondition = `AND o.order_date >= CURRENT_DATE - INTERVAL '7 days'`;
        chartDateCondition = `WHERE order_date >= CURRENT_DATE - INTERVAL '7 days'`;
    }

    // Execute all analytics queries in parallel
    const [
      revenueResult,
      ordersResult,
      customersResult,
      avgOrderResult,
      pendingOrdersResult,
      completedOrdersResult,
      revenueChartResult,
      categoryOrdersResult,
      dailyOrdersResult
    ] = await Promise.all([
      // Total revenue for time period
      pool.query(`
        SELECT COALESCE(SUM(p.amount), 0) as total_revenue
        FROM Payments p
        JOIN Orders o ON p.order_id = o.order_id
        WHERE p.status = 'completed' ${dateCondition}
      `),
      
      // Total orders for time period
      pool.query(`
        SELECT COUNT(*) as total_orders
        FROM Orders o
        WHERE 1=1 ${dateCondition}
      `),
      
      // Total customers for time period (unique customers who placed orders)
      pool.query(`
        SELECT COUNT(DISTINCT o.user_id) as total_customers
        FROM Orders o
        WHERE 1=1 ${dateCondition}
      `),
      
      // Average order value for time period
      pool.query(`
        SELECT COALESCE(AVG(p.amount), 0) as avg_order_value
        FROM Payments p
        JOIN Orders o ON p.order_id = o.order_id
        WHERE p.status = 'completed' ${dateCondition}
      `),
      
      // Pending orders count
      pool.query(`
        SELECT COUNT(*) as pending_orders
        FROM Orders o
        WHERE o.status IN ('pending', 'confirmed') ${dateCondition}
      `),
      
      // Completed orders count
      pool.query(`
        SELECT COUNT(*) as completed_orders
        FROM Orders o
        WHERE o.status = 'delivered' ${dateCondition}
      `),
      
      // Revenue chart data (daily for last 7 days or weekly for longer periods)
      timeRange === '7days' ? 
        pool.query(`
          SELECT 
            DATE(o.order_date) as date,
            COALESCE(SUM(p.amount), 0) as revenue
          FROM Orders o
          LEFT JOIN Payments p ON o.order_id = p.order_id AND p.status = 'completed'
          ${chartDateCondition}
          GROUP BY DATE(o.order_date)
          ORDER BY DATE(o.order_date)
        `) :
        pool.query(`
          SELECT 
            DATE_TRUNC('week', o.order_date) as date,
            COALESCE(SUM(p.amount), 0) as revenue
          FROM Orders o
          LEFT JOIN Payments p ON o.order_id = p.order_id AND p.status = 'completed'
          ${chartDateCondition}
          GROUP BY DATE_TRUNC('week', o.order_date)
          ORDER BY DATE_TRUNC('week', o.order_date)
        `),
      
      // Orders by category
      pool.query(`
        SELECT 
          c.name as category_name,
          COUNT(DISTINCT o.order_id) as order_count
        FROM Orders o
        JOIN Order_items oi ON o.order_id = oi.order_id
        JOIN Products pr ON oi.product_id = pr.product_id
        JOIN Product_categories pc ON pr.product_id = pc.product_id
        JOIN Categories c ON pc.category_id = c.category_id
        WHERE 1=1 ${dateCondition}
        GROUP BY c.category_id, c.name
        ORDER BY order_count DESC
        LIMIT 6
      `),
      
      // Daily orders for chart
      timeRange === '7days' ?
        pool.query(`
          SELECT 
            DATE(o.order_date) as date,
            COUNT(*) as order_count
          FROM Orders o
          ${chartDateCondition}
          GROUP BY DATE(o.order_date)
          ORDER BY DATE(o.order_date)
        `) :
        pool.query(`
          SELECT 
            DATE_TRUNC('week', o.order_date) as date,
            COUNT(*) as order_count
          FROM Orders o
          ${chartDateCondition}
          GROUP BY DATE_TRUNC('week', o.order_date)
          ORDER BY DATE_TRUNC('week', o.order_date)
        `)
    ]);

    // Process results
    const totalRevenue = parseFloat(revenueResult.rows[0].total_revenue) || 0;
    const totalOrders = parseInt(ordersResult.rows[0].total_orders) || 0;
    const totalCustomers = parseInt(customersResult.rows[0].total_customers) || 0;
    const averageOrderValue = parseFloat(avgOrderResult.rows[0].avg_order_value) || 0;
    const pendingOrders = parseInt(pendingOrdersResult.rows[0].pending_orders) || 0;
    const completedOrders = parseInt(completedOrdersResult.rows[0].completed_orders) || 0;

    // Format chart data
    const revenueChartData = revenueChartResult.rows.map(row => ({
      date: row.date,
      revenue: parseFloat(row.revenue) || 0
    }));

    const categoryData = categoryOrdersResult.rows.map(row => ({
      category: row.category_name,
      orders: parseInt(row.order_count) || 0
    }));

    const dailyOrdersData = dailyOrdersResult.rows.map(row => ({
      date: row.date,
      orders: parseInt(row.order_count) || 0
    }));

    res.json({
      success: true,
      analytics: {
        metrics: {
          totalRevenue,
          totalOrders,
          totalCustomers,
          averageOrderValue,
          pendingOrders,
          completedOrders
        },
        charts: {
          revenueData: revenueChartData,
          categoryData,
          dailyOrdersData
        }
      }
    });

  } catch (error) {
    console.error('Error fetching analytics data:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching analytics data'
    });
  }
});

module.exports = router; 