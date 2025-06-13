const pool = require('../db');

// Get seller's orders
exports.getSellerOrders = async (req, res) => {
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

    // Get orders for products sold by this seller
    const ordersQuery = `
      SELECT DISTINCT
        o.order_id,
        o.order_date,
        o.status,
        u.full_name as customer_name,
        u.username as customer_username,
        u.email as customer_email,
        p.payment_method,
        p.amount as payment_amount,
        p.status as payment_status
      FROM Orders o
      JOIN Order_items oi ON o.order_id = oi.order_id
      JOIN Products pr ON oi.product_id = pr.product_id
      JOIN Users u ON o.user_id = u.user_id
      LEFT JOIN Payments p ON o.order_id = p.order_id
      WHERE pr.seller_id = $1
      ORDER BY o.order_date DESC
    `;

    const ordersResult = await pool.query(ordersQuery, [sellerId]);

    // Get order items for each order
    const ordersWithItems = [];
    for (const order of ordersResult.rows) {
      const itemsQuery = `
        SELECT 
          oi.quantity,
          oi.price,
          pr.name as product_name,
          pr.img_path as product_image
        FROM Order_items oi
        JOIN Products pr ON oi.product_id = pr.product_id
        WHERE oi.order_id = $1 AND pr.seller_id = $2
      `;

      const itemsResult = await pool.query(itemsQuery, [order.order_id, sellerId]);

      // Calculate total for this seller's items in the order
      const sellerTotal = itemsResult.rows.reduce((sum, item) => {
        return sum + (item.quantity * item.price);
      }, 0);

      ordersWithItems.push({
        id: order.order_id,
        customer: order.customer_name || order.customer_username,
        customer_email: order.customer_email,
        items: itemsResult.rows.map(item => ({
          name: item.product_name,
          quantity: item.quantity,
          price: parseInt(item.price),
          image: item.product_image
        })),
        total: sellerTotal,
        status: order.status,
        date: order.order_date,
        payment_method: order.payment_method,
        payment_status: order.payment_status
      });
    }

    res.json({
      success: true,
      orders: ordersWithItems
    });

  } catch (error) {
    console.error('Error fetching seller orders:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching orders'
    });
  }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const sellerId = req.user.id;

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order status'
      });
    }

    // Check if the order contains products from this seller
    const orderCheckQuery = `
      SELECT DISTINCT o.order_id
      FROM Orders o
      JOIN Order_items oi ON o.order_id = oi.order_id
      JOIN Products pr ON oi.product_id = pr.product_id
      WHERE o.order_id = $1 AND pr.seller_id = $2
    `;

    const orderCheck = await pool.query(orderCheckQuery, [orderId, sellerId]);

    if (orderCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or you don\'t have permission to update it'
      });
    }

    // Update order status
    const updateResult = await pool.query(
      'UPDATE Orders SET status = $1 WHERE order_id = $2 RETURNING *',
      [status, orderId]
    );

    res.json({
      success: true,
      message: 'Order status updated successfully',
      order: updateResult.rows[0]
    });

  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating order status'
    });
  }
};

// Get order details
exports.getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    const sellerId = req.user.id;

    // Get order basic info and check if seller has access
    const orderQuery = `
      SELECT DISTINCT
        o.order_id,
        o.order_date,
        o.status,
        u.full_name as customer_name,
        u.username as customer_username,
        u.email as customer_email,
        u.phone as customer_phone,
        u.address as customer_address,
        p.payment_method,
        p.amount as payment_amount,
        p.status as payment_status,
        p.payment_date
      FROM Orders o
      JOIN Order_items oi ON o.order_id = oi.order_id
      JOIN Products pr ON oi.product_id = pr.product_id
      JOIN Users u ON o.user_id = u.user_id
      LEFT JOIN Payments p ON o.order_id = p.order_id
      WHERE o.order_id = $1 AND pr.seller_id = $2
    `;

    const orderResult = await pool.query(orderQuery, [orderId, sellerId]);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or you don\'t have permission to view it'
      });
    }

    const order = orderResult.rows[0];

    // Get order items for this seller
    const itemsQuery = `
      SELECT 
        oi.quantity,
        oi.price,
        pr.product_id,
        pr.name as product_name,
        pr.img_path as product_image,
        pr.description as product_description
      FROM Order_items oi
      JOIN Products pr ON oi.product_id = pr.product_id
      WHERE oi.order_id = $1 AND pr.seller_id = $2
    `;

    const itemsResult = await pool.query(itemsQuery, [orderId, sellerId]);

    // Calculate total for this seller's items
    const sellerTotal = itemsResult.rows.reduce((sum, item) => {
      return sum + (item.quantity * item.price);
    }, 0);

    // Get shipment info if exists
    const shipmentQuery = `
      SELECT 
        s.status as shipment_status,
        s.tracking_number,
        s.estimated_delivery,
        su.company_name as shipping_company
      FROM Shipments s
      LEFT JOIN Shipping_units su ON s.Shipping_units_id = su.Shipping_units_id
      WHERE s.order_id = $1
    `;

    const shipmentResult = await pool.query(shipmentQuery, [orderId]);

    const orderDetails = {
      id: order.order_id,
      customer: {
        name: order.customer_name || order.customer_username,
        email: order.customer_email,
        phone: order.customer_phone,
        address: order.customer_address
      },
      items: itemsResult.rows.map(item => ({
        id: item.product_id,
        name: item.product_name,
        description: item.product_description,
        quantity: item.quantity,
        price: parseInt(item.price),
        image: item.product_image,
        subtotal: item.quantity * parseInt(item.price)
      })),
      total: sellerTotal,
      status: order.status,
      date: order.order_date,
      payment: {
        method: order.payment_method,
        amount: parseInt(order.payment_amount || 0),
        status: order.payment_status,
        date: order.payment_date
      },
      shipment: shipmentResult.rows.length > 0 ? {
        status: shipmentResult.rows[0].shipment_status,
        tracking_number: shipmentResult.rows[0].tracking_number,
        estimated_delivery: shipmentResult.rows[0].estimated_delivery,
        shipping_company: shipmentResult.rows[0].shipping_company
      } : null
    };

    res.json({
      success: true,
      order: orderDetails
    });

  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching order details'
    });
  }
}; 