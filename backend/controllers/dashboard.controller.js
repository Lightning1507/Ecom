const pool = require('../db');

// Get seller dashboard statistics
exports.getSellerDashboardStats = async (req, res) => {
  try {
    const sellerId = req.user.id;

    // Check if seller exists
    const sellerResult = await pool.query(
      'SELECT seller_id, store_name FROM Sellers WHERE seller_id = $1',
      [sellerId]
    );

    if (sellerResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Seller profile not found'
      });
    }

    // Get total revenue from completed orders
    const revenueQuery = `
      SELECT COALESCE(SUM(oi.quantity * oi.price), 0) as total_revenue
      FROM Orders o
      JOIN Order_items oi ON o.order_id = oi.order_id
      JOIN Payments p ON o.order_id = p.order_id
      WHERE o.seller_id = $1 AND p.status = 'completed'
    `;

    // Get total orders count
    const ordersQuery = `
      SELECT COUNT(DISTINCT o.order_id) as total_orders
      FROM Orders o
      JOIN Order_items oi ON o.order_id = oi.order_id
      JOIN Products pr ON oi.product_id = pr.product_id
      WHERE pr.seller_id = $1
    `;

    // Get total products count
    const productsQuery = `
      SELECT COUNT(*) as total_products
      FROM Products
      WHERE seller_id = $1
    `;

    // Get revenue from last month and current month for growth calculation
    const growthQuery = `
      SELECT 
          COALESCE(SUM(CASE 
          WHEN DATE_TRUNC('month', o.order_date) = DATE_TRUNC('month', CURRENT_DATE) 
          THEN oi.quantity * oi.price 
          ELSE 0 
          END), 0) as current_month_revenue,
          COALESCE(SUM(CASE 
          WHEN DATE_TRUNC('month', o.order_date) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') 
          THEN oi.quantity * oi.price 
          ELSE 0 
          END), 0) as last_month_revenue
      FROM Orders o
      JOIN Order_items oi ON o.order_id = oi.order_id
      JOIN Products pr ON oi.product_id = pr.product_id
      JOIN Payments p ON o.order_id = p.order_id
      WHERE pr.seller_id = $1 AND p.status = 'completed'
    `;

    // Get sales data for last 6 months
    const salesDataQuery = `
      SELECT 
        TO_CHAR(DATE_TRUNC('month', o.order_date), 'Mon') as month,
        COALESCE(SUM(oi.quantity * oi.price), 0) as sales
      FROM Orders o
      JOIN Order_items oi ON o.order_id = oi.order_id
      JOIN Products pr ON oi.product_id = pr.product_id
      JOIN Payments p ON o.order_id = p.order_id
      WHERE pr.seller_id = $1 
        AND p.status = 'completed'
        AND o.order_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '5 months')
      GROUP BY DATE_TRUNC('month', o.order_date)
      ORDER BY DATE_TRUNC('month', o.order_date)
    `;

    // Execute all queries
    const [revenueResult, ordersResult, productsResult, growthResult, salesDataResult] = await Promise.all([
      pool.query(revenueQuery, [sellerId]),
      pool.query(ordersQuery, [sellerId]),
      pool.query(productsQuery, [sellerId]),
      pool.query(growthQuery, [sellerId]),
      pool.query(salesDataQuery, [sellerId])
    ]);

    // Calculate growth percentage
    const currentMonthRevenue = parseFloat(growthResult.rows[0].current_month_revenue) || 0;
    const lastMonthRevenue = parseFloat(growthResult.rows[0].last_month_revenue) || 0;
    let growth = 0;
    if (lastMonthRevenue > 0) {
      growth = ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;
    } else if (currentMonthRevenue > 0) {
      growth = 100; // 100% growth if we had no sales last month but have sales this month
    }

    // Prepare sales data with default values for missing months
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const salesData = [];
    const currentDate = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = monthNames[targetDate.getMonth()];
      
      const existingData = salesDataResult.rows.find(row => row.month === monthName);
      salesData.push({
        month: monthName,
        sales: existingData ? parseFloat(existingData.sales) : 0
      });
    }

    const stats = {
      revenue: parseFloat(revenueResult.rows[0].total_revenue) || 0,
      orders: parseInt(ordersResult.rows[0].total_orders) || 0,
      products: parseInt(productsResult.rows[0].total_products) || 0,
      growth: Math.round(growth * 10) / 10 // Round to 1 decimal place
    };

    res.json({
      success: true,
      stats,
      salesData
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard statistics'
    });
  }
};

// Get recent activity for seller
exports.getSellerRecentActivity = async (req, res) => {
  try {
    const sellerId = req.user.id;

    // Get recent orders (last 10)
    const recentOrdersQuery = `
      SELECT DISTINCT
        o.order_id,
        o.order_date,
        u.full_name as customer_name,
        u.username as customer_username,
        COUNT(oi.product_id) as item_count,
        SUM(oi.quantity * oi.price) as total_amount
      FROM Orders o
      JOIN Order_items oi ON o.order_id = oi.order_id
      JOIN Products pr ON oi.product_id = pr.product_id
      JOIN Users u ON o.user_id = u.user_id
      WHERE pr.seller_id = $1
      GROUP BY o.order_id, o.order_date, u.full_name, u.username
      ORDER BY o.order_date DESC
      LIMIT 5
    `;

    // Get recent product updates (last 5)
    const recentProductsQuery = `
      SELECT 
        product_id,
        name,
        stock,
        price
      FROM Products
      WHERE seller_id = $1
      ORDER BY product_id DESC
      LIMIT 5
    `;

    const [ordersResult, productsResult] = await Promise.all([
      pool.query(recentOrdersQuery, [sellerId]),
      pool.query(recentProductsQuery, [sellerId])
    ]);

    const recentActivity = [];

    // Add recent orders to activity
    ordersResult.rows.forEach(order => {
      recentActivity.push({
        type: 'order',
        icon: 'order',
        title: `New Order #${order.order_id}`,
        description: `${order.item_count} item(s) • $${parseFloat(order.total_amount).toFixed(2)}`,
        time: formatTimeAgo(order.order_date),
        customer: order.customer_name || order.customer_username
      });
    });

    // Add recent products to activity
    productsResult.rows.forEach(product => {
      recentActivity.push({
        type: 'product',
        icon: 'product',
        title: 'Product Stock Update',
        description: `${product.name} • ${product.stock} units`,
        time: 'Recently added',
        productId: product.product_id
      });
    });

    // Sort by time (orders will have actual timestamps, products will be at the end)
    recentActivity.sort((a, b) => {
      if (a.type === 'order' && b.type === 'product') return -1;
      if (a.type === 'product' && b.type === 'order') return 1;
      return 0;
    });

    res.json({
      success: true,
      recentActivity: recentActivity.slice(0, 10) // Limit to 10 items
    });

  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching recent activity'
    });
  }
};

// Get seller profile data
exports.getSellerProfile = async (req, res) => {
  try {
    const sellerId = req.user.id;

    // Get user data and seller profile data
    const profileQuery = `
      SELECT 
        u.user_id,
        u.username,
        u.full_name,
        u.email,
        u.phone,
        u.address,
        s.store_name,
        s.description,
        s.qr_img_path
      FROM Users u
      LEFT JOIN Sellers s ON u.user_id = s.seller_id
      WHERE u.user_id = $1 AND u.role = 'seller'
    `;

    const result = await pool.query(profileQuery, [sellerId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    const profile = result.rows[0];

    res.json({
      success: true,
      profile: {
        profile: {
          name: profile.full_name || '',
          email: profile.email || '',
          phone: profile.phone || '',
          address: profile.address || '',
          avatar: null
        },
        store: {
          name: profile.store_name || '',
          description: profile.description || '',
          address: profile.address || '',
          businessHours: '9:00 AM - 6:00 PM', // Default value, can be added to DB later
          category: 'Electronics' // Default value, can be added to DB later
        },
        notifications: {
          orderUpdates: true,
          newMessages: true,
          promotionalEmails: false,
          stockAlerts: true
        },
        shipping: {
          freeShippingThreshold: 50,
          defaultShippingMethod: 'standard',
          processingTime: '1-2 business days'
        },
        payment: {
          acceptedMethods: ['credit_card', 'paypal'],
          autoPayouts: true,
          payoutSchedule: 'weekly'
        }
      }
    });

  } catch (error) {
    console.error('Error fetching seller profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching seller profile'
    });
  }
};

// Update seller profile data
exports.updateSellerProfile = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { section, data } = req.body;

    if (section === 'profile') {
      // Update user profile information
      const updateQuery = `
        UPDATE Users 
        SET full_name = $1, email = $2, phone = $3, address = $4
        WHERE user_id = $5 AND role = 'seller'
        RETURNING *
      `;

      const result = await pool.query(updateQuery, [
        data.name,
        data.email,
        data.phone,
        data.address,
        sellerId
      ]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Seller not found'
        });
      }

    } else if (section === 'store') {
      // Check if seller profile exists
      const checkQuery = 'SELECT * FROM Sellers WHERE seller_id = $1';
      const checkResult = await pool.query(checkQuery, [sellerId]);

      if (checkResult.rows.length === 0) {
        // Create seller profile if it doesn't exist
        const insertQuery = `
          INSERT INTO Sellers (seller_id, store_name, description)
          VALUES ($1, $2, $3)
          RETURNING *
        `;

        await pool.query(insertQuery, [
          sellerId,
          data.name,
          data.description
        ]);
      } else {
        // Update existing seller profile
        const updateQuery = `
          UPDATE Sellers 
          SET store_name = $1, description = $2
          WHERE seller_id = $3
          RETURNING *
        `;

        await pool.query(updateQuery, [
          data.name,
          data.description,
          sellerId
        ]);
      }

      // Also update address in Users table if provided
      if (data.address) {
        await pool.query(
          'UPDATE Users SET address = $1 WHERE user_id = $2',
          [data.address, sellerId]
        );
      }
    }

    res.json({
      success: true,
      message: `${section} updated successfully`
    });

  } catch (error) {
    console.error('Error updating seller profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating seller profile'
    });
  }
};

// Get user profile data (for regular users, not sellers)
exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user data
    const profileQuery = `
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
      WHERE user_id = $1
    `;

    const result = await pool.query(profileQuery, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const profile = result.rows[0];

    res.json({
      success: true,
      profile: {
        name: profile.full_name || '',
        username: profile.username || '',
        email: profile.email || '',
        phone: profile.phone || '',
        location: profile.address || '',
        role: profile.role || '',
        accountStatus: profile.locked ? 'Locked' : 'Active'
      }
    });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user profile'
    });
  }
};

// Update user profile data (for regular users, not sellers)
exports.updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, phone, location } = req.body;

    // Update user profile information (excluding username and role which shouldn't be changed)
    const updateQuery = `
      UPDATE Users 
      SET full_name = $1, email = $2, phone = $3, address = $4
      WHERE user_id = $5
      RETURNING *
    `;

    const result = await pool.query(updateQuery, [
      name,
      email,
      phone,
      location, // Using location as address
      userId
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating user profile'
    });
  }
};

// Helper function to format time ago
function formatTimeAgo(date) {
  const now = new Date();
  const diffInMs = now - new Date(date);
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) {
    return 'Just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} min ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  } else {
    return new Date(date).toLocaleDateString();
  }
}

// Get seller analytics data
exports.getSellerAnalytics = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { timeRange = '6m' } = req.query;

    // Define time range intervals
    const timeRanges = {
      '1m': { months: 1, label: 'month' },
      '3m': { months: 3, label: 'months' },
      '6m': { months: 6, label: 'months' },
      '1y': { months: 12, label: 'year' }
    };

    const range = timeRanges[timeRange] || timeRanges['6m'];

    // Check if seller exists
    const sellerResult = await pool.query(
      'SELECT seller_id, store_name FROM Sellers WHERE seller_id = $1',
      [sellerId]
    );

    if (sellerResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Seller profile not found'
      });
    }

    // 1. Revenue data over time
    const revenueDataQuery = `
      SELECT 
        TO_CHAR(DATE_TRUNC('month', o.order_date), 'Mon') as month,
        COALESCE(SUM(oi.quantity * oi.price), 0) as revenue
      FROM Orders o
      JOIN Order_items oi ON o.order_id = oi.order_id
      JOIN Products pr ON oi.product_id = pr.product_id
      JOIN Payments p ON o.order_id = p.order_id
      WHERE pr.seller_id = $1 
        AND p.status = 'completed'
        AND o.order_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '${range.months - 1} months')
      GROUP BY DATE_TRUNC('month', o.order_date)
      ORDER BY DATE_TRUNC('month', o.order_date)
    `;

    // 2. Orders data over time
    const orderDataQuery = `
      SELECT 
        TO_CHAR(DATE_TRUNC('month', o.order_date), 'Mon') as month,
        COUNT(DISTINCT o.order_id) as orders
      FROM Orders o
      JOIN Order_items oi ON o.order_id = oi.order_id
      JOIN Products pr ON oi.product_id = pr.product_id
      WHERE pr.seller_id = $1
        AND o.order_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '${range.months - 1} months')
      GROUP BY DATE_TRUNC('month', o.order_date)
      ORDER BY DATE_TRUNC('month', o.order_date)
    `;

    // 3. Category distribution data
    const categoryDataQuery = `
      SELECT 
        c.name,
        COUNT(DISTINCT o.order_id) as value
      FROM Orders o
      JOIN Order_items oi ON o.order_id = oi.order_id
      JOIN Products pr ON oi.product_id = pr.product_id
      JOIN Product_categories pc ON pr.product_id = pc.product_id
      JOIN Categories c ON pc.category_id = c.category_id
      WHERE pr.seller_id = $1
        AND o.order_date >= CURRENT_DATE - INTERVAL '${range.months} months'
      GROUP BY c.category_id, c.name
      ORDER BY value DESC
      LIMIT 5
    `;

    // 4. Top products data
    const topProductsQuery = `
      SELECT 
        pr.name,
        SUM(oi.quantity) as sales,
        SUM(oi.quantity * oi.price) as revenue
      FROM Orders o
      JOIN Order_items oi ON o.order_id = oi.order_id
      JOIN Products pr ON oi.product_id = pr.product_id
      JOIN Payments p ON o.order_id = p.order_id
      WHERE pr.seller_id = $1 
        AND p.status = 'completed'
        AND o.order_date >= CURRENT_DATE - INTERVAL '${range.months} months'
      GROUP BY pr.product_id, pr.name
      ORDER BY revenue DESC
      LIMIT 5
    `;

    // 5. Summary metrics
    const summaryQuery = `
      SELECT 
        COALESCE(SUM(oi.quantity * oi.price), 0) as total_revenue,
        COUNT(DISTINCT o.order_id) as total_orders,
        COUNT(DISTINCT o.user_id) as total_customers,
        COALESCE(AVG(oi.quantity * oi.price), 0) as avg_order_value
      FROM Orders o
      JOIN Order_items oi ON o.order_id = oi.order_id
      JOIN Products pr ON oi.product_id = pr.product_id
      JOIN Payments p ON o.order_id = p.order_id
      WHERE pr.seller_id = $1 
        AND p.status = 'completed'
        AND o.order_date >= CURRENT_DATE - INTERVAL '${range.months} months'
    `;

    // 6. Growth calculation (current vs previous period)
    const growthQuery = `
      SELECT 
        COALESCE(SUM(CASE 
          WHEN o.order_date >= CURRENT_DATE - INTERVAL '${range.months} months' 
          THEN oi.quantity * oi.price 
          ELSE 0 
        END), 0) as current_period_revenue,
        COALESCE(SUM(CASE 
          WHEN o.order_date >= CURRENT_DATE - INTERVAL '${range.months * 2} months' 
            AND o.order_date < CURRENT_DATE - INTERVAL '${range.months} months'
          THEN oi.quantity * oi.price 
          ELSE 0 
        END), 0) as previous_period_revenue,
        COUNT(DISTINCT CASE 
          WHEN o.order_date >= CURRENT_DATE - INTERVAL '${range.months} months' 
          THEN o.order_id 
        END) as current_period_orders,
        COUNT(DISTINCT CASE 
          WHEN o.order_date >= CURRENT_DATE - INTERVAL '${range.months * 2} months' 
            AND o.order_date < CURRENT_DATE - INTERVAL '${range.months} months'
          THEN o.order_id 
        END) as previous_period_orders,
        COUNT(DISTINCT CASE 
          WHEN o.order_date >= CURRENT_DATE - INTERVAL '${range.months} months' 
          THEN o.user_id 
        END) as current_period_customers,
        COUNT(DISTINCT CASE 
          WHEN o.order_date >= CURRENT_DATE - INTERVAL '${range.months * 2} months' 
            AND o.order_date < CURRENT_DATE - INTERVAL '${range.months} months'
          THEN o.user_id 
        END) as previous_period_customers
      FROM Orders o
      JOIN Order_items oi ON o.order_id = oi.order_id
      JOIN Products pr ON oi.product_id = pr.product_id
      JOIN Payments p ON o.order_id = p.order_id
      WHERE pr.seller_id = $1 AND p.status = 'completed'
    `;

    // Execute all queries
    const [
      revenueDataResult,
      orderDataResult, 
      categoryDataResult,
      topProductsResult,
      summaryResult,
      growthResult
    ] = await Promise.all([
      pool.query(revenueDataQuery, [sellerId]),
      pool.query(orderDataQuery, [sellerId]),
      pool.query(categoryDataQuery, [sellerId]),
      pool.query(topProductsQuery, [sellerId]),
      pool.query(summaryQuery, [sellerId]),
      pool.query(growthQuery, [sellerId])
    ]);

    // Process growth calculations
    const growth = growthResult.rows[0];
    const currentRevenue = parseFloat(growth.current_period_revenue) || 0;
    const previousRevenue = parseFloat(growth.previous_period_revenue) || 0;
    const currentOrders = parseInt(growth.current_period_orders) || 0;
    const previousOrders = parseInt(growth.previous_period_orders) || 0;
    const currentCustomers = parseInt(growth.current_period_customers) || 0;
    const previousCustomers = parseInt(growth.previous_period_customers) || 0;

    const revenueGrowth = previousRevenue > 0 ? 
      ((currentRevenue - previousRevenue) / previousRevenue * 100) : 0;
    const ordersGrowth = previousOrders > 0 ? 
      ((currentOrders - previousOrders) / previousOrders * 100) : 0;
    const customersGrowth = previousCustomers > 0 ? 
      ((currentCustomers - previousCustomers) / previousCustomers * 100) : 0;

    // Format response data
    const summary = summaryResult.rows[0];
    const avgOrderValue = parseFloat(summary.avg_order_value) || 0;
    const previousAvgOrderValue = previousOrders > 0 ? previousRevenue / previousOrders : 0;
    const avgOrderValueGrowth = previousAvgOrderValue > 0 ? 
      ((avgOrderValue - previousAvgOrderValue) / previousAvgOrderValue * 100) : 0;

    // Fill missing months with zero values
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentDate = new Date();
    const months = [];
    
    for (let i = range.months - 1; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      months.push(monthNames[date.getMonth()]);
    }

    const revenueData = months.map(month => {
      const data = revenueDataResult.rows.find(row => row.month === month);
      return {
        month,
        revenue: data ? parseFloat(data.revenue) : 0
      };
    });

    const orderData = months.map(month => {
      const data = orderDataResult.rows.find(row => row.month === month);
      return {
        month,
        orders: data ? parseInt(data.orders) : 0
      };
    });

    res.json({
      success: true,
      analytics: {
        revenueData,
        orderData,
        categoryData: categoryDataResult.rows.map(row => ({
          name: row.name,
          value: parseInt(row.value)
        })),
        topProducts: topProductsResult.rows.map(row => ({
          name: row.name,
          sales: parseInt(row.sales),
          revenue: parseFloat(row.revenue)
        })),
        summary: {
          totalRevenue: parseFloat(summary.total_revenue),
          totalOrders: parseInt(summary.total_orders),
          totalCustomers: parseInt(summary.total_customers),
          averageOrderValue: avgOrderValue,
          revenueGrowth: revenueGrowth.toFixed(1),
          ordersGrowth: ordersGrowth.toFixed(1),
          customersGrowth: customersGrowth.toFixed(1),
          avgOrderValueGrowth: avgOrderValueGrowth.toFixed(1)
        },
        timeRange
      }
    });

  } catch (error) {
    console.error('Error fetching seller analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics data',
      error: error.message
    });
  }
}; 