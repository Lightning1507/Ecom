const express = require('express');
const cors = require('cors');
const pool = require('./db');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'E-commerce API is running' });
});

// Products routes
app.get('/api/products', async (req, res) => {
  try {
    const products = await pool.query('SELECT * FROM products');
    res.json(products.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const product = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    
    if (product.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(product.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Server start
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// User routes
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Register a new user
app.post('/api/users/register', async (req, res) => {
  try {
    const { username, password, full_name, email, phone, address, role } = req.body;

    // Check if username or email already exists
    const userExists = await pool.query(
        'SELECT * FROM Users WHERE username = $1 OR email = $2',
        [username, email]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user
    const newUser = await pool.query(
        'INSERT INTO Users (username, password, full_name, email, phone, address, role) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [username, hashedPassword, full_name, email, phone, address, role || 'customer']
    );

    // Create cart for user
    await pool.query(
        'INSERT INTO Carts (user_id) VALUES ($1)',
        [newUser.rows[0].user_id]
    );

    // If role is seller, create seller profile
    if (role === 'seller') {
      await pool.query(
          'INSERT INTO Sellers (seller_id, store_name, description) VALUES ($1, $2, $3)',
          [newUser.rows[0].user_id, `${username}'s Store`, 'New seller store']
      );
    }

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        user_id: newUser.rows[0].user_id,
        username: newUser.rows[0].username,
        email: newUser.rows[0].email,
        role: newUser.rows[0].role
      }
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login user
app.post('/api/users/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if user exists
    const user = await pool.query(
        'SELECT * FROM Users WHERE username = $1',
        [username]
    );

    if (user.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if account is locked
    if (user.rows[0].locked) {
      return res.status(400).json({ message: 'Account is locked. Please contact support.' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.rows[0].password);

    if (!validPassword) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign(
        { id: user.rows[0].user_id, role: user.rows[0].role },
        process.env.JWT_SECRET || 'yourSecretKey',
        { expiresIn: '1d' }
    );

    res.json({
      token,
      user_id: user.rows[0].user_id,
      username: user.rows[0].username,
      email: user.rows[0].email,
      full_name: user.rows[0].full_name,
      role: user.rows[0].role
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});