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
      INNER JOIN Order_items oi ON o.order_id = oi.order_id
      INNER JOIN Products pr ON oi.product_id = pr.product_id
      INNER JOIN Payments p ON o.order_id = p.order_id
      WHERE pr.seller_id = $1 AND p.status = 'completed'
    `;

    // Get total orders count
    const ordersQuery = `
      SELECT COUNT(DISTINCT o.order_id) as total_orders
      FROM Orders o
      INNER JOIN Order_items oi ON o.order_id = oi.order_id
      INNER JOIN Products pr ON oi.product_id = pr.product_id
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
      INNER JOIN Order_items oi ON o.order_id = oi.order_id
      INNER JOIN Products pr ON oi.product_id = pr.product_id
      INNER JOIN Payments p ON o.order_id = p.order_id
      WHERE pr.seller_id = $1 AND p.status = 'completed'
    `;

    // Get sales data for last 6 months
    const salesDataQuery = `
      SELECT 
        TO_CHAR(DATE_TRUNC('month', o.order_date), 'Mon') as month,
        COALESCE(SUM(oi.quantity * oi.price), 0) as sales
      FROM Orders o
      INNER JOIN Order_items oi ON o.order_id = oi.order_id
      INNER JOIN Products pr ON oi.product_id = pr.product_id
      INNER JOIN Payments p ON o.order_id = p.order_id
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
      INNER JOIN Order_items oi ON o.order_id = oi.order_id
      INNER JOIN Products pr ON oi.product_id = pr.product_id
      INNER JOIN Users u ON o.user_id = u.user_id
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