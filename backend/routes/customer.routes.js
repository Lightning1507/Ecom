const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { upload } = require('../config/cloudinary');
const customerController = require('../controllers/customer.controller');

// Get customer's completed orders with reviewable products
router.get('/orders/completed', auth, customerController.getCompletedOrders);

// Submit a review for a product
router.post('/reviews', auth, (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    next();
  });
}, customerController.submitReview);

// Update an existing review
router.put('/reviews/:reviewId', auth, (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    next();
  });
}, customerController.updateReview);

// Get reviews for a product
router.get('/products/:productId/reviews', customerController.getProductReviews);

// Get review statistics for a product
router.get('/products/:productId/reviews/stats', customerController.getReviewStats);

module.exports = router; 