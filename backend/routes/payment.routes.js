const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const auth = require('../middleware/auth');

// Debug route (no auth required)
router.get('/debug', async (req, res) => {
  try {
    const pool = require('../db');
    
    // Check if Orders table exists and has data
    const ordersCheck = await pool.query('SELECT COUNT(*) FROM Orders');
    const paymentsCheck = await pool.query('SELECT COUNT(*) FROM Payments');
    const usersCheck = await pool.query('SELECT COUNT(*) FROM Users');
    
    res.json({ 
      message: 'Payment routes are working',
      database: {
        orders: ordersCheck.rows[0].count,
        payments: paymentsCheck.rows[0].count,
        users: usersCheck.rows[0].count
      },
      endpoints: [
        'GET /api/payment/checkout/summary',
        'POST /api/payment/checkout',
        'GET /api/payment/orders'
      ]
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      message: 'Database connection issue'
    });
  }
});

// All other payment routes require authentication
router.use(auth);

// Get checkout summary (before payment)
router.get('/checkout/summary', paymentController.getCheckoutSummary);

// Process checkout and create order
router.post('/checkout', paymentController.processCheckout);

// Get user's orders
router.get('/orders', paymentController.getUserOrders);

module.exports = router; 