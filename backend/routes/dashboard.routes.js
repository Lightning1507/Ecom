const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const auth = require('../middleware/auth');
const sellerAuth = require('../middleware/sellerAuth');

// Seller dashboard routes
router.get('/seller/stats', auth, sellerAuth, dashboardController.getSellerDashboardStats);
router.get('/seller/activity', auth, sellerAuth, dashboardController.getSellerRecentActivity);

// Debug route
router.get('/debug', (req, res) => {
  res.json({ 
    message: 'Dashboard routes are working',
    endpoints: [
      'GET /api/dashboard/seller/stats',
      'GET /api/dashboard/seller/activity'
    ]
  });
});

module.exports = router; 