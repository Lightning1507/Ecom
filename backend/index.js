const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const pool = require('./db');
const jwt = require('jsonwebtoken');
const productController = require('./controllers/product.controller');
const categoryController = require('./controllers/category.controller');
const authController = require('./controllers/auth.controller');
const shopController = require('./controllers/shop.controller');
const productRoutes = require('./routes/product.routes');
const orderRoutes = require('./routes/order.routes');
const dashboardRoutes = require('./routes/dashboard.routes');

// Load environment variables
require('dotenv').config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Configure CORS
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// Configure middleware
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
const productsDir = path.join(uploadsDir, 'products');
if (!fs.existsSync(productsDir)) {
  fs.mkdirSync(productsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, productsDir);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'product-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function(req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files (jpg, jpeg, png, webp) are allowed!'));
  }
});

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Authentication middleware
const authenticateUser = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false, 
      message: 'No token provided' 
    });
  }

  const token = authHeader.split(' ')[1];
  
  try {
    // Verify the token and extract user data
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ 
      success: false, 
      message: 'Invalid token' 
    });
  }
};

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: 'File upload error',
      error: err.message
    });
  }
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message
  });
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend API is working!' });
});

// Database test route
app.get('/api/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({
      message: 'Database connection successful!',
      time: result.rows[0].now
    });
  } catch (error) {
    console.error('Database query error:', error);
    res.status(500).json({
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// Auth routes
app.post('/api/users/login', authController.login);
app.post('/api/users/register', authController.register);

// Root route
app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

// Category routes
app.get('/api/categories', categoryController.getAllCategories);
app.get('/api/categories/with-counts', categoryController.getCategoriesWithProductCounts);
app.post('/api/categories', categoryController.createCategory);

// Shop routes
app.get('/api/shops', shopController.getAllShops);
app.get('/api/shops/:id', shopController.getShopDetails);
app.post('/api/sellers/profile', authenticateUser, shopController.createSellerProfile);

// Mount product routes
app.use('/api/products', productRoutes);

// Mount order routes
app.use('/api/orders', orderRoutes);

// Mount dashboard routes
app.use('/api/dashboard', dashboardRoutes);

// Mount cart routes
const cartRoutes = require('./routes/cart.routes');
app.use('/api/cart', cartRoutes);

// Mount payment routes
const paymentRoutes = require('./routes/payment.routes');
app.use('/api/payment', paymentRoutes);

// Mount admin routes
const adminRoutes = require('./routes/admin.routes');
app.use('/api/admin', adminRoutes);

// Mount seller admin routes
const sellerAdminRoutes = require('./routes/seller-admin.routes');
app.use('/api/admin', sellerAdminRoutes);

// Mount customer routes
const customerRoutes = require('./routes/customer.routes');
app.use('/api/customer', customerRoutes);

// Mount test routes (development only)
if (process.env.NODE_ENV !== 'production') {
  const testRoutes = require('./routes/test.routes');
  app.use('/api/test', testRoutes);
}

// Import shipper dependencies
const shipperAuth = require('./middleware/shipperAuth');
const shipperController = require('./controllers/shipper.controller');

// Shipper routes
app.get('/api/shipper/dashboard', authenticateUser, shipperAuth, shipperController.getShipperDashboard);
app.get('/api/shipper/orders', authenticateUser, shipperAuth, shipperController.getShipperOrders);
app.put('/api/shipper/orders/:orderId/status', authenticateUser, shipperAuth, shipperController.updateShippingStatus);
app.get('/api/shipper/profile', authenticateUser, shipperAuth, shipperController.getShipperProfile);
app.put('/api/shipper/profile', authenticateUser, shipperAuth, shipperController.updateShipperProfile);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});