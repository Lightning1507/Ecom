const pool = require('../db');

// Create order and process payment
exports.processCheckout = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const userId = req.user.id;
    const { paymentMethod, shippingAddress, selectedItems } = req.body;

    // Validate payment method
    if (!paymentMethod || !['cod', 'bank_transfer'].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method. Must be "cod" or "bank_transfer"'
      });
    }

    await client.query('BEGIN');

    let cartItems;

    if (selectedItems && selectedItems.length > 0) {
      // Use selected items for checkout
      const productIds = selectedItems.map(item => item.product_id);
      
      const cartItemsResult = await client.query(`
        SELECT 
          c.cart_id,
          c.seller_id,
          s.store_name,
          ci.product_id,
          ci.quantity,
          p.name,
          p.price,
          p.stock
        FROM Carts c
        JOIN Sellers s ON c.seller_id = s.seller_id
        JOIN Cart_items ci ON c.cart_id = ci.cart_id
        JOIN Products p ON ci.product_id = p.product_id
        WHERE c.user_id = $1 AND p.visible = true AND ci.product_id = ANY($2)
      `, [userId, productIds]);

      cartItems = cartItemsResult.rows;
    } else {
      // Get all user's carts and their items
      const cartItemsResult = await client.query(`
        SELECT 
          c.cart_id,
          c.seller_id,
          s.store_name,
          ci.product_id,
          ci.quantity,
          p.name,
          p.price,
          p.stock
        FROM Carts c
        JOIN Sellers s ON c.seller_id = s.seller_id
        JOIN Cart_items ci ON c.cart_id = ci.cart_id
        JOIN Products p ON ci.product_id = p.product_id
        WHERE c.user_id = $1 AND p.visible = true
      `, [userId]);

      cartItems = cartItemsResult.rows;
    }

    if (cartItems.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    // Validate stock availability
    for (const item of cartItems) {
      if (item.stock < item.quantity) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${item.name}. Available: ${item.stock}, Requested: ${item.quantity}`
        });
      }
    }

    // Group items by seller
    const ordersBySeller = {};
    cartItems.forEach(item => {
      if (!ordersBySeller[item.seller_id]) {
        ordersBySeller[item.seller_id] = {
          seller_id: item.seller_id,
          store_name: item.store_name,
          items: []
        };
      }
      ordersBySeller[item.seller_id].items.push(item);
    });

    const createdOrders = [];

    // Create separate orders for each seller
    for (const [sellerId, orderData] of Object.entries(ordersBySeller)) {
      // Create order
      const orderResult = await client.query(
        'INSERT INTO Orders (user_id, seller_id, status) VALUES ($1, $2, $3) RETURNING order_id',
        [userId, sellerId, 'pending']
      );

      const orderId = orderResult.rows[0].order_id;

      // Calculate order total
      let orderTotal = 0;

      // Add order items
      for (const item of orderData.items) {
        await client.query(
          'INSERT INTO Order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
          [orderId, item.product_id, item.quantity, item.price]
        );

        // Update product stock
        await client.query(
          'UPDATE Products SET stock = stock - $1 WHERE product_id = $2',
          [item.quantity, item.product_id]
        );

        orderTotal += item.price * item.quantity;
      }

      // Create payment record
      const paymentStatus = paymentMethod === 'cod' ? 'pending' : 'pending';
      
      await client.query(
        'INSERT INTO Payments (order_id, payment_method, amount, status) VALUES ($1, $2, $3, $4)',
        [orderId, paymentMethod, orderTotal, paymentStatus]
      );

      createdOrders.push({
        orderId,
        sellerId,
        storeName: orderData.store_name,
        total: orderTotal,
        itemCount: orderData.items.length
      });
    }

    // Clear processed carts
    if (selectedItems && selectedItems.length > 0) {
      // Only clear selected items
      const productIds = selectedItems.map(item => item.product_id);
      await client.query(
        'DELETE FROM Cart_items WHERE cart_id IN (SELECT cart_id FROM Carts WHERE user_id = $1) AND product_id = ANY($2)',
        [userId, productIds]
      );
      
      // Clean up empty carts
      await client.query(`
        DELETE FROM Carts 
        WHERE user_id = $1 
        AND cart_id NOT IN (
          SELECT DISTINCT cart_id FROM Cart_items 
          WHERE cart_id IN (SELECT cart_id FROM Carts WHERE user_id = $1)
        )
      `, [userId]);
    } else {
      // Clear all user's carts
      const cartIds = [...new Set(cartItems.map(item => item.cart_id))];
      await client.query('DELETE FROM Cart_items WHERE cart_id = ANY($1)', [cartIds]);
      await client.query('DELETE FROM Carts WHERE user_id = $1', [userId]);
    }

    // Update user address if provided
    if (shippingAddress) {
      await client.query(
        'UPDATE Users SET address = $1 WHERE user_id = $2',
        [shippingAddress, userId]
      );
    }

    await client.query('COMMIT');

    const totalAmount = createdOrders.reduce((sum, order) => sum + order.total, 0);

    res.json({
      success: true,
      message: 'Order(s) created successfully',
      orders: createdOrders,
      totalAmount,
      paymentMethod,
      orderCount: createdOrders.length
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error processing checkout:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while processing checkout'
    });
  } finally {
    client.release();
  }
};

// Get checkout summary (before payment)
exports.getCheckoutSummary = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all user's carts and their items
    const cartItemsResult = await pool.query(`
      SELECT 
        c.cart_id,
        c.seller_id,
        s.store_name,
        ci.product_id,
        ci.quantity,
        p.name,
        p.price,
        p.img_path,
        p.stock
      FROM Carts c
      JOIN Sellers s ON c.seller_id = s.seller_id
      JOIN Cart_items ci ON c.cart_id = ci.cart_id
      JOIN Products p ON ci.product_id = p.product_id
      WHERE c.user_id = $1 AND p.visible = true
      ORDER BY s.store_name, p.name
    `, [userId]);

    if (cartItemsResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    const cartItems = cartItemsResult.rows;

    // Group items by seller
    const ordersBySeller = {};
    let totalAmount = 0;

    cartItems.forEach(item => {
      const itemTotal = item.price * item.quantity;
      totalAmount += itemTotal;

      if (!ordersBySeller[item.seller_id]) {
        ordersBySeller[item.seller_id] = {
          seller_id: item.seller_id,
          store_name: item.store_name,
          items: [],
          subtotal: 0
        };
      }
      
      ordersBySeller[item.seller_id].items.push({
        product_id: item.product_id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        img_path: item.img_path,
        stock: item.stock,
        total: itemTotal
      });
      
      ordersBySeller[item.seller_id].subtotal += itemTotal;
    });

    // Get user information
    const userResult = await pool.query(
      'SELECT full_name, email, phone, address FROM Users WHERE user_id = $1',
      [userId]
    );

    const user = userResult.rows[0];

    // Calculate tax (10%)
    const tax = totalAmount * 0.1;
    const grandTotal = totalAmount + tax;

    res.json({
      success: true,
      user: user,
      ordersBySeller: Object.values(ordersBySeller),
      summary: {
        subtotal: totalAmount,
        tax: tax,
        total: grandTotal,
        itemCount: cartItems.length
      }
    });

  } catch (error) {
    console.error('Error getting checkout summary:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while getting checkout summary'
    });
  }
};

// Get user's orders
exports.getUserOrders = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    
    const userId = req.user.id;

    const ordersQuery = `
      SELECT 
        o.order_id,
        o.order_date,
        o.status,
        o.seller_id
      FROM Orders o
      WHERE o.user_id = $1
      ORDER BY o.order_date DESC
    `;

    const ordersResult = await pool.query(ordersQuery, [userId]);

    // Get order items for each order
    const ordersWithItems = [];
    for (const order of ordersResult.rows) {
      // Get seller info
      const sellerQuery = `
        SELECT store_name FROM Sellers WHERE seller_id = $1
      `;
      const sellerResult = await pool.query(sellerQuery, [order.seller_id]);
      
      // Get payment info
      const paymentQuery = `
        SELECT payment_method, amount, status FROM Payments WHERE order_id = $1
      `;
      const paymentResult = await pool.query(paymentQuery, [order.order_id]);
      
      // Get order items
      const itemsQuery = `
        SELECT 
          oi.quantity,
          oi.price,
          pr.name as product_name,
          pr.img_path as product_image
        FROM Order_items oi
        JOIN Products pr ON oi.product_id = pr.product_id
        WHERE oi.order_id = $1
      `;
      const itemsResult = await pool.query(itemsQuery, [order.order_id]);

      const payment = paymentResult.rows[0] || {};
      const seller = sellerResult.rows[0] || {};

      ordersWithItems.push({
        id: order.order_id,
        date: order.order_date,
        status: order.status,
        storeName: seller.store_name || 'Unknown Store',
        items: itemsResult.rows.map(item => ({
          name: item.product_name,
          quantity: item.quantity,
          price: parseInt(item.price),
          image: item.product_image
        })),
        payment: {
          method: payment.payment_method || 'Unknown',
          amount: parseInt(payment.amount || 0),
          status: payment.status || 'Unknown'
        }
      });
    }

    res.json({
      success: true,
      orders: ordersWithItems
    });

  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching orders'
    });
  }
}; 