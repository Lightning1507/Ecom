const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./db'); // Import your database connection
const bcrypt = require('bcryptjs');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// Create Express app
const app = express();

// Configure middleware
app.use(express.json());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

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

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Test the API at http://localhost:${PORT}/api/test`);
  console.log(`Test the database at http://localhost:${PORT}/api/db-test`);
});