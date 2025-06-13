const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
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
};

const register = async (req, res) => {
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
};

module.exports = {
  login,
  register
}; 