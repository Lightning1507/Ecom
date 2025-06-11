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

// Public route to get all shops/sellers
app.get('/api/shops', async (req, res) => {
  try {
    const { page = 1, limit = 12, search = '' } = req.query;
    const offset = (page - 1) * limit;

    let whereConditions = ['u.role = $1', 'u.locked = $2', 's.store_name IS NOT NULL'];
    let params = ['seller', false];
    let paramIndex = 3;

    // Add search filter
    if (search) {
      whereConditions.push(`(s.store_name ILIKE $${paramIndex} OR s.description ILIKE $${paramIndex} OR u.full_name ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

    // Get total count
    const countQuery = `
      SELECT COUNT(*) 
      FROM Users u 
      JOIN Sellers s ON u.user_id = s.seller_id 
      ${whereClause}
    `;
    const totalResult = await pool.query(countQuery, params);
    const total = parseInt(totalResult.rows[0].count);

    // Get sellers with their store information
    const sellersQuery = `
      SELECT 
        u.user_id,
        u.full_name,
        s.store_name,
        s.description,
        COALESCE((
          SELECT COUNT(*) 
          FROM Products p 
          WHERE p.seller_id = s.seller_id AND p.visible = true
        ), 0) as products_count,
        COALESCE((
          SELECT AVG(r.rating)::NUMERIC(3,2)
          FROM Reviews r
          JOIN Products p ON r.product_id = p.product_id
          WHERE p.seller_id = s.seller_id
        ), 0) as avg_rating,
        COALESCE((
          SELECT SUM(oi.quantity) 
          FROM Order_items oi
          JOIN Orders o ON oi.order_id = o.order_id
          JOIN Products p ON oi.product_id = p.product_id
          WHERE p.seller_id = s.seller_id AND o.status = 'delivered'
        ), 0) as total_sold
      FROM Users u 
      JOIN Sellers s ON u.user_id = s.seller_id 
      ${whereClause}
      ORDER BY products_count DESC, avg_rating DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    params.push(limit, offset);
    const sellersResult = await pool.query(sellersQuery, params);

    // Format the data
    const shops = sellersResult.rows.map(seller => ({
      id: seller.user_id,
      name: seller.store_name,
      owner: seller.full_name,
      description: seller.description || 'Welcome to our store!',
      productsCount: parseInt(seller.products_count) || 0,
      rating: parseFloat(seller.avg_rating) || 0,
      totalSold: parseInt(seller.total_sold) || 0,
      status: 'active'
    }));

    res.json({
      success: true,
      shops,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching shops:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching shops'
    });
  }
});

// Get individual shop details
app.get('/api/shops/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get shop details with comprehensive information
    const shopQuery = `
      SELECT 
        u.user_id,
        u.full_name,
        u.email,
        u.phone,
        u.address,
        s.store_name,
        s.description,
        COALESCE((
          SELECT COUNT(*) 
          FROM Products p 
          WHERE p.seller_id = s.seller_id AND p.visible = true
        ), 0) as products_count,
        COALESCE((
          SELECT AVG(r.rating)::NUMERIC(3,2)
          FROM Reviews r
          JOIN Products p ON r.product_id = p.product_id
          WHERE p.seller_id = s.seller_id
        ), 0) as avg_rating,
        COALESCE((
          SELECT COUNT(DISTINCT r.review_id)
          FROM Reviews r
          JOIN Products p ON r.product_id = p.product_id
          WHERE p.seller_id = s.seller_id
        ), 0) as total_reviews,
        COALESCE((
          SELECT SUM(oi.quantity) 
          FROM Order_items oi
          JOIN Orders o ON oi.order_id = o.order_id
          JOIN Products p ON oi.product_id = p.product_id
          WHERE p.seller_id = s.seller_id AND o.status = 'delivered'
        ), 0) as total_sold
      FROM Users u 
      JOIN Sellers s ON u.user_id = s.seller_id 
      WHERE u.user_id = $1 AND u.role = 'seller' AND u.locked = false AND s.store_name IS NOT NULL
    `;

    const shopResult = await pool.query(shopQuery, [id]);

    if (shopResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found'
      });
    }

    const shop = shopResult.rows[0];

    // Get shop categories (categories of products they sell)
    const categoriesQuery = `
      SELECT DISTINCT c.name, COUNT(p.product_id) as product_count
      FROM Categories c
      JOIN Product_categories pc ON c.category_id = pc.category_id
      JOIN Products p ON pc.product_id = p.product_id
      WHERE p.seller_id = $1 AND p.visible = true
      GROUP BY c.category_id, c.name
      ORDER BY product_count DESC
      LIMIT 10
    `;

    const categoriesResult = await pool.query(categoriesQuery, [id]);

    // Get recent products (top 6 products)
    const recentProductsQuery = `
      SELECT 
        p.product_id,
        p.name,
        p.price,
        p.img_path,
        COALESCE((
          SELECT AVG(rating)::NUMERIC(3,2)
          FROM Reviews r 
          WHERE r.product_id = p.product_id
        ), 0) as rating,
        COALESCE((
          SELECT SUM(oi.quantity)
          FROM Order_items oi
          JOIN Orders o ON oi.order_id = o.order_id
          WHERE oi.product_id = p.product_id AND o.status = 'delivered'
        ), 0) as total_sold
      FROM Products p
      WHERE p.seller_id = $1 AND p.visible = true
      ORDER BY p.product_id DESC
      LIMIT 6
    `;

    const productsResult = await pool.query(recentProductsQuery, [id]);

    // Format the response
    const shopDetails = {
      id: shop.user_id,
      name: shop.store_name,
      owner: shop.full_name,
      email: shop.email,
      phone: shop.phone,
      address: shop.address,
      description: shop.description || 'Welcome to our store!',
      productsCount: parseInt(shop.products_count) || 0,
      rating: parseFloat(shop.avg_rating) || 0,
      totalReviews: parseInt(shop.total_reviews) || 0,
      totalSold: parseInt(shop.total_sold) || 0,
      categories: categoriesResult.rows,
      recentProducts: productsResult.rows.map(product => ({
        id: product.product_id,
        name: product.name,
        price: parseFloat(product.price),
        image: product.img_path,
        rating: parseFloat(product.rating) || 0,
        totalSold: parseInt(product.total_sold) || 0
      })),
      status: 'active'
    };

    res.json({
      success: true,
      shop: shopDetails
    });

  } catch (error) {
    console.error('Error fetching shop details:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching shop details'
    });
  }
});

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

// Import shipper dependencies
const shipperAuth = require('./middleware/shipperAuth');
const shipperController = require('./controllers/shipper.controller');

// Shipper routes
app.get('/api/shipper/dashboard', authenticateUser, shipperAuth, shipperController.getShipperDashboard);
app.get('/api/shipper/orders', authenticateUser, shipperAuth, shipperController.getShipperOrders);
app.put('/api/shipper/orders/:orderId/status', authenticateUser, shipperAuth, shipperController.updateShippingStatus);
app.get('/api/shipper/profile', authenticateUser, shipperAuth, shipperController.getShipperProfile);
app.put('/api/shipper/profile', authenticateUser, shipperAuth, shipperController.updateShipperProfile);

// Middleware and routes setup

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});