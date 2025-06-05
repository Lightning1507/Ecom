const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const auth = require('../middleware/auth');
const sellerAuth = require('../middleware/sellerAuth');

// Seller dashboard routes
router.get('/seller/stats', auth, sellerAuth, dashboardController.getSellerDashboardStats);
router.get('/seller/activity', auth, sellerAuth, dashboardController.getSellerRecentActivity);

// Seller profile routes
router.get('/seller/profile', auth, sellerAuth, dashboardController.getSellerProfile);
router.put('/seller/profile', auth, sellerAuth, dashboardController.updateSellerProfile);

// User profile routes (for regular users)
router.get('/user/profile', auth, dashboardController.getUserProfile);
router.put('/user/profile', auth, dashboardController.updateUserProfile);

// Debug route
router.get('/debug', (req, res) => {
  res.json({ 
    message: 'Dashboard routes are working',
    endpoints: [
      'GET /api/dashboard/seller/stats',
      'GET /api/dashboard/seller/activity',
      'GET /api/dashboard/seller/profile',
      'PUT /api/dashboard/seller/profile',
      'GET /api/dashboard/user/profile',
      'PUT /api/dashboard/user/profile'
    ]
  });
});

module.exports = router; 