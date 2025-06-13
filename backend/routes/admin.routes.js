const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminController = require('../controllers/admin.controller');

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

// User management routes
router.get('/users', auth, adminAuth, adminController.getAllUsers);
router.put('/users/:userId/status', auth, adminAuth, adminController.updateUserStatus);
router.delete('/users/:userId', auth, adminAuth, adminController.deleteUser);
router.put('/users/:userId', auth, adminAuth, adminController.updateUser);
router.get('/users/:userId', auth, adminAuth, adminController.getUserDetails);

// Dashboard routes
router.get('/dashboard/stats', auth, adminAuth, adminController.getDashboardStats);

// Order management routes
router.get('/orders', auth, adminAuth, adminController.getAllOrders);
router.get('/orders/:orderId', auth, adminAuth, adminController.getOrderDetails);
router.put('/orders/:orderId/status', auth, adminAuth, adminController.updateOrderStatus);
router.put('/orders/:orderId/payment-status', auth, adminAuth, adminController.updatePaymentStatus);

// Analytics routes
router.get('/analytics', auth, adminAuth, adminController.getAnalytics);

module.exports = router; 