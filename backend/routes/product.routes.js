const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const auth = require('../middleware/auth');
const sellerAuth = require('../middleware/sellerAuth');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/products/');
  },
  filename: (req, file, cb) => {
    cb(null, `product-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only images (jpeg, jpg, png, webp) are allowed!'));
  }
});

// Public routes
router.get('/', productController.getAllProducts);
router.get('/search', productController.searchProducts);
router.get('/:id', productController.getProductById);
router.get('/categories/all', productController.getAllCategories);
router.get('/filters/data', productController.getFilterData);

// Protected routes (seller only)
router.post('/', auth, sellerAuth, upload.single('image'), productController.createProduct);
router.get('/seller/products', auth, sellerAuth, productController.getSellerProducts);
router.put('/:id', auth, sellerAuth, upload.single('image'), productController.updateProduct);
router.delete('/:id', auth, sellerAuth, productController.deleteProduct);

// New seller-specific routes
router.put('/seller/products/:id/toggle-status', auth, sellerAuth, productController.toggleProductStatus);
router.put('/seller/products/:id/toggle-featured', auth, sellerAuth, productController.toggleProductFeatured);

// Debug route - no authentication required
router.get('/debug', (req, res) => {
  res.json({ 
    message: 'Product routes are working',
    endpoints: [
      'GET /api/products',
      'GET /api/products/:id',
      'GET /api/products/categories/all',
      'GET /api/products/filters/data',
      'POST /api/products',
      'GET /api/products/seller/products',
      'PUT /api/products/:id',
      'DELETE /api/products/:id',
      'PUT /api/products/seller/products/:id/toggle-status',
      'PUT /api/products/seller/products/:id/toggle-featured'
    ]
  });
});

module.exports = router;