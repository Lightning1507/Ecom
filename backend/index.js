const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const pool = require('./db');
const bcrypt = require('bcryptjs');
const productController = require('./controllers/product.controller');
const categoryController = require('./controllers/category.controller');

// Load environment variables
require('dotenv').config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Configure middleware
app.use(express.json());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
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

// Simple authentication middleware (temporary)
const authenticateUser = (req, res, next) => {
  // For testing purposes, set a default user ID
  // In a real app, you would verify the token from Authorization header
  req.user = {
    id: 1, // Default user ID for testing
    role: 'seller'
  };
  next();
};

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

// Login route
app.post('/api/users/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log('Login attempt:', { username, password: '****' });

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ message: 'Please provide username and password' });
    }

    // Query database for user
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    // Check if user exists
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Use bcrypt to compare the entered password to the stored hash
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Success - send user data
    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      token: 'dummy-token-for-now'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Root route
app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

// Product routes
app.post('/api/products', authenticateUser, upload.single('image'), productController.createProduct);
app.get('/api/products', productController.getAllProducts);
app.get('/api/products/:id', productController.getProductById);
app.put('/api/products/:id', authenticateUser, upload.single('image'), productController.updateProduct);
app.delete('/api/products/:id', authenticateUser, productController.deleteProduct);
app.get('/api/products/seller/my-products', authenticateUser, productController.getSellerProducts);

// Category routes
app.get('/api/categories', categoryController.getAllCategories);
app.post('/api/categories', categoryController.createCategory);
app.get('/api/products/categories/all', productController.getAllCategories);

// Debug route for categories
app.get('/api/debug/categories', async (req, res) => {
  try {
    console.log('Checking if Categories table exists...');
    
    // First check if the table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'categories'
      )
    `);
    
    const tableExists = tableCheck.rows[0].exists;
    
    if (!tableExists) {
      // If table doesn't exist, create it
      console.log('Categories table does not exist, creating it...');
      await pool.query(`
        CREATE TABLE Categories (
          category_id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL UNIQUE
        )
      `);
      
      // Insert some sample categories
      await pool.query(`
        INSERT INTO Categories (name) VALUES 
        ('Electronics'), 
        ('Clothing'), 
        ('Books'), 
        ('Home & Kitchen')
      `);
      
      res.json({
        message: 'Categories table created with sample data',
        categories: [
          { category_id: 1, name: 'Electronics' },
          { category_id: 2, name: 'Clothing' },
          { category_id: 3, name: 'Books' },
          { category_id: 4, name: 'Home & Kitchen' }
        ]
      });
    } else {
      // If table exists, fetch categories
      const result = await pool.query('SELECT * FROM Categories ORDER BY name');
      res.json({
        message: 'Categories table exists',
        count: result.rows.length,
        categories: result.rows
      });
    }
  } catch (error) {
    console.error('Categories debug error:', error);
    res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
});

// Middleware and routes setup

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});