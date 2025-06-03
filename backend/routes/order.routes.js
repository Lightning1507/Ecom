const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const auth = require('../middleware/auth');
const sellerAuth = require('../middleware/sellerAuth');

// Seller order management routes
router.get('/seller/orders', auth, sellerAuth, orderController.getSellerOrders);
router.get('/seller/orders/:orderId', auth, sellerAuth, orderController.getOrderDetails);
router.put('/seller/orders/:orderId/status', auth, sellerAuth, orderController.updateOrderStatus);

// Debug route
router.get('/debug', (req, res) => {
  res.json({ 
    message: 'Order routes are working',
    endpoints: [
      'GET /api/orders/seller/orders',
      'GET /api/orders/seller/orders/:orderId',
      'PUT /api/orders/seller/orders/:orderId/status'
    ]
  });
});

module.exports = router; 