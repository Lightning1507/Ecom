const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const pool = require('./db');
const bcrypt = require('bcryptjs');
const productController = require('./controllers/product.controller');
const categoryController = require('./controllers/category.controller');
const productRoutes = require('./routes/product.routes');
const orderRoutes = require('./routes/order.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const jwt = require('jsonwebtoken');

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

    // Generate JWT token
    const token = jwt.sign(
      { 
        user: {
          id: user.user_id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Success - send user data and token
    res.json({
      user: {
        id: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login', detail: error.message });
  }
});

// Register route
app.post('/api/users/register', async (req, res) => {
  try {
    const { username, full_name, email, phone, address, password, role } = req.body;

    console.log('Registration attempt:', { 
      username, 
      full_name, 
      email, 
      phone, 
      address, 
      role,
      password: '****'
    });

    // Validate required fields
    if (!username || !full_name || !email || !phone || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Check if username already exists
    const userExists = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Check if email already exists
    const emailExists = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (emailExists.rows.length > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    console.log('Attempting to insert new user...');

    // Insert new user
    const result = await pool.query(
      'INSERT INTO users (username, full_name, email, phone, address, password, role) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [username, full_name, email, phone, address || '', hashedPassword, role || 'customer']
    );

    console.log('User inserted successfully:', result.rows[0]);

    const user = result.rows[0];

    // Return success without password
    res.status(201).json({
      success: true,
      data: {
        id: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Registration error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      table: error.table,
      constraint: error.constraint,
      stack: error.stack
    });
    
    // Send more specific error messages based on the error type
    if (error.code === '23505') { // Unique violation
      res.status(400).json({ 
        message: 'This ' + (error.constraint.includes('email') ? 'email' : 'username') + ' is already taken' 
      });
    } else if (error.code === '23503') { // Foreign key violation
      res.status(400).json({ message: 'Invalid reference in the data provided' });
    } else {
      res.status(500).json({ 
        message: 'Server error during registration',
        detail: error.message 
      });
    }
  }
});

// Root route
app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

// Category routes
app.get('/api/categories', categoryController.getAllCategories);
app.get('/api/categories/with-counts', categoryController.getCategoriesWithProductCounts);
app.post('/api/categories', categoryController.createCategory);

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

// Mount product routes
app.use('/api/products', productRoutes);

// Mount order routes
app.use('/api/orders', orderRoutes);

// Mount dashboard routes
app.use('/api/dashboard', dashboardRoutes);

// Create seller profile
app.post('/api/sellers/profile', authenticateUser, async (req, res) => {
  try {
    const { store_name, description } = req.body;
    const userId = req.user.id;

    // Check if user has seller role
    const userResult = await pool.query(
      'SELECT role FROM Users WHERE user_id = $1',
      [userId]
    );

    if (userResult.rows.length === 0 || userResult.rows[0].role !== 'seller') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only users with seller role can create a seller profile' 
      });
    }

    // Check if seller profile already exists
    const existingProfile = await pool.query(
      'SELECT * FROM Sellers WHERE seller_id = $1',
      [userId]
    );

    if (existingProfile.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Seller profile already exists' 
      });
    }

    // Create seller profile
    const result = await pool.query(
      'INSERT INTO Sellers (seller_id, store_name, description) VALUES ($1, $2, $3) RETURNING *',
      [userId, store_name, description]
    );

    res.status(201).json({
      success: true,
      message: 'Seller profile created successfully',
      profile: result.rows[0]
    });

  } catch (error) {
    console.error('Create seller profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while creating seller profile' 
    });
  }
});

// Middleware and routes setup

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});