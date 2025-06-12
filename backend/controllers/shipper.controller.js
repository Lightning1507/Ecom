const pool = require('../db');

// Get shipper dashboard statistics
exports.getShipperDashboard = async (req, res) => {
  try {
    const shipperId = req.user.id;

    // Get dashboard stats for this shipper
    const statsQuery = `
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN shipping_status = 'preparing' OR shipping_status = 'in_transit' THEN 1 END) as pending_deliveries,
        COUNT(CASE WHEN shipping_status = 'delivered' THEN 1 END) as completed_deliveries,
        COALESCE(SUM(CASE WHEN shipping_status = 'delivered' THEN 50 ELSE 0 END), 0) as earnings,
        COALESCE(AVG(CASE WHEN shipping_status = 'delivered' THEN 45 ELSE NULL END), 0) as avg_delivery_time
      FROM Orders 
      WHERE Shipping_units_id = $1
    `;

    const statsResult = await pool.query(statsQuery, [shipperId]);
    const stats = statsResult.rows[0];

    // Calculate total distance (mock calculation - 10km average per delivery)
    const totalDistance = (parseInt(stats.completed_deliveries) || 0) * 10;

    // Get recent orders for this shipper
    const recentOrdersQuery = `
      SELECT 
        o.order_id,
        o.tracking_number,
        o.shipping_status,
        o.order_date,
        o.estimated_delivery,
        u.address as customer_address,
        u.full_name as customer_name,
        u.phone as customer_phone
      FROM Orders o
      JOIN Users u ON o.user_id = u.user_id
      WHERE o.Shipping_units_id = $1
      ORDER BY o.order_date DESC
      LIMIT 10
    `;

    const ordersResult = await pool.query(recentOrdersQuery, [shipperId]);

    const dashboardData = {
      stats: {
        totalOrders: parseInt(stats.total_orders) || 0,
        pendingDeliveries: parseInt(stats.pending_deliveries) || 0,
        completedDeliveries: parseInt(stats.completed_deliveries) || 0,
        totalDistance: totalDistance,
        earnings: parseInt(stats.earnings) || 0,
        averageDeliveryTime: Math.round(parseFloat(stats.avg_delivery_time)) || 0
      },
      recentOrders: ordersResult.rows
    };

    res.json({
      success: true,
      ...dashboardData
    });

  } catch (error) {
    console.error('Error fetching shipper dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard data'
    });
  }
};

// Get orders assigned to shipper
exports.getShipperOrders = async (req, res) => {
  try {
    const shipperId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    console.log('Fetching orders for shipper ID:', shipperId);
    console.log('Filter status:', status);
    console.log('Pagination:', { page, limit, offset });

    // First check if the user exists and has shipper role
    const userCheck = await pool.query(
      'SELECT user_id, role FROM Users WHERE user_id = $1',
      [shipperId]
    );

    if (userCheck.rows.length === 0) {
      console.log('User not found:', shipperId);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (userCheck.rows[0].role !== 'shipper') {
      console.log('User is not a shipper:', userCheck.rows[0]);
      return res.status(403).json({
        success: false,
        message: 'Access denied. User is not a shipper.'
      });
    }

    // Check if shipper exists in Shipping_units table
    const shipperCheck = await pool.query(
      'SELECT Shipping_units_id FROM Shipping_units WHERE Shipping_units_id = $1',
      [shipperId]
    );

    if (shipperCheck.rows.length === 0) {
      console.log('Shipper not found in Shipping_units table, creating entry...');
      // Create shipper entry if it doesn't exist
      await pool.query(
        'INSERT INTO Shipping_units (Shipping_units_id, company_name) VALUES ($1, $2) ON CONFLICT (Shipping_units_id) DO NOTHING',
        [shipperId, 'Default Shipping Company']
      );
    }

    let whereCondition = 'WHERE o.Shipping_units_id = $1';
    let params = [shipperId];
    
    if (status && status !== 'all') {
      whereCondition += ' AND o.shipping_status = $2';
      params.push(status);
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM Orders o
      ${whereCondition}
    `;
    console.log('Count query:', countQuery);
    console.log('Count params:', params);
    
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);
    console.log('Total orders found:', total);

    // Get orders with pagination
    const ordersQuery = `
      SELECT 
        o.order_id,
        o.tracking_number,
        o.shipping_status,
        o.order_date,
        o.estimated_delivery,
        o.status as order_status,
        u.address as customer_address,
        u.full_name as customer_name,
        u.phone as customer_phone,
        u.email as customer_email,
        s.store_name,
        COALESCE((
          SELECT SUM(oi.price * oi.quantity)
          FROM Order_items oi
          WHERE oi.order_id = o.order_id
        ), 0) as total_amount
      FROM Orders o
      JOIN Users u ON o.user_id = u.user_id
      JOIN Sellers s ON o.seller_id = s.seller_id
      ${whereCondition}
      ORDER BY o.order_date DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    params.push(limit, offset);
    console.log('Orders query:', ordersQuery);
    console.log('Orders params:', params);
    
    const ordersResult = await pool.query(ordersQuery, params);
    console.log('Orders found:', ordersResult.rows.length);

    res.json({
      success: true,
      orders: ordersResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching shipper orders:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching orders',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update order shipping status
exports.updateShippingStatus = async (req, res) => {
  try {
    const shipperId = req.user.id;
    const { orderId } = req.params;
    const { shipping_status, tracking_number, estimated_delivery } = req.body;

    // Verify the order belongs to this shipper
    const verifyQuery = `
      SELECT order_id FROM Orders 
      WHERE order_id = $1 AND Shipping_units_id = $2
    `;
    const verifyResult = await pool.query(verifyQuery, [orderId, shipperId]);

    if (verifyResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Order not assigned to you or does not exist'
      });
    }

    // Update shipping status
    let updateQuery = 'UPDATE Orders SET ';
    let updateFields = [];
    let params = [];
    let paramIndex = 1;

    if (shipping_status) {
      updateFields.push(`shipping_status = $${paramIndex}`);
      params.push(shipping_status);
      paramIndex++;
    }

    if (tracking_number) {
      updateFields.push(`tracking_number = $${paramIndex}`);
      params.push(tracking_number);
      paramIndex++;
    }

    if (estimated_delivery) {
      updateFields.push(`estimated_delivery = $${paramIndex}`);
      params.push(estimated_delivery);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    updateQuery += updateFields.join(', ');
    updateQuery += ` WHERE order_id = $${paramIndex}`;
    params.push(orderId);

    await pool.query(updateQuery, params);

    res.json({
      success: true,
      message: 'Order status updated successfully'
    });

  } catch (error) {
    console.error('Error updating shipping status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating order status'
    });
  }
};

// Get shipper profile
exports.getShipperProfile = async (req, res) => {
  try {
    const shipperId = req.user.id;

    const profileQuery = `
      SELECT 
        u.user_id,
        u.username,
        u.full_name,
        u.email,
        u.phone,
        u.address,
        su.company_name
      FROM Users u
      LEFT JOIN Shipping_units su ON u.user_id = su.Shipping_units_id
      WHERE u.user_id = $1 AND u.role = 'shipper'
    `;

    const result = await pool.query(profileQuery, [shipperId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Shipper profile not found'
      });
    }

    res.json({
      success: true,
      profile: result.rows[0]
    });

  } catch (error) {
    console.error('Error fetching shipper profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile'
    });
  }
};

// Update shipper profile
exports.updateShipperProfile = async (req, res) => {
  try {
    const shipperId = req.user.id;
    const { full_name, email, phone, address, company_name } = req.body;

    // Update user information
    const updateUserQuery = `
      UPDATE Users 
      SET full_name = $1, email = $2, phone = $3, address = $4
      WHERE user_id = $5 AND role = 'shipper'
    `;
    await pool.query(updateUserQuery, [full_name, email, phone, address, shipperId]);

    // Update or insert shipping unit information
    const checkShippingUnit = await pool.query(
      'SELECT Shipping_units_id FROM Shipping_units WHERE Shipping_units_id = $1',
      [shipperId]
    );

    if (checkShippingUnit.rows.length > 0) {
      // Update existing shipping unit
      await pool.query(
        'UPDATE Shipping_units SET company_name = $1 WHERE Shipping_units_id = $2',
        [company_name, shipperId]
      );
    } else {
      // Insert new shipping unit
      await pool.query(
        'INSERT INTO Shipping_units (Shipping_units_id, company_name) VALUES ($1, $2)',
        [shipperId, company_name]
      );
    }

    res.json({
      success: true,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Error updating shipper profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating profile'
    });
  }
}; 