const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
const auth = require('../middleware/auth');

// All cart routes require authentication
router.use(auth);

// Get user's cart items
router.get('/', cartController.getCartItems);

// Get cart count
router.get('/count', cartController.getCartCount);

// Add item to cart
router.post('/add', cartController.addToCart);

// Update cart item quantity
router.put('/update', cartController.updateCartItemQuantity);

// Remove item from cart
router.delete('/remove/:productId', cartController.removeFromCart);

// Clear entire cart
router.delete('/clear', cartController.clearCart);

// Debug route
router.get('/debug', (req, res) => {
  res.json({ 
    message: 'Cart routes are working',
    endpoints: [
      'GET /api/cart',
      'POST /api/cart/add',
      'PUT /api/cart/update/:productId',
      'DELETE /api/cart/remove/:productId',
      'DELETE /api/cart/clear'
    ]
  });
});

module.exports = router; 