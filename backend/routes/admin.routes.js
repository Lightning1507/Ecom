const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// Middleware to check if user is admin
const adminAuth = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin role required.'
    });
  }
  next();
};

// Get all users with pagination and filtering
router.get('/users', auth, adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role = '', status = '' } = req.query;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let params = [];
    let paramIndex = 1;

    // Add search filter
    if (search) {
      whereConditions.push(`(full_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR username ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Add role filter
    if (role && role !== 'all') {
      whereConditions.push(`role = $${paramIndex}`);
      params.push(role);
      paramIndex++;
    }

    // Add status filter (locked/active)
    if (status && status !== 'all') {
      const isLocked = status === 'suspended';
      whereConditions.push(`locked = $${paramIndex}`);
      params.push(isLocked);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM Users ${whereClause}`;
    const totalResult = await pool.query(countQuery, params);
    const total = parseInt(totalResult.rows[0].count);

    // Get users with pagination
    const usersQuery = `
      SELECT 
        user_id,
        username,
        full_name,
        email,
        phone,
        address,
        role,
        locked
      FROM Users 
      ${whereClause}
      ORDER BY user_id DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    params.push(limit, offset);
    const usersResult = await pool.query(usersQuery, params);

    // Format the data to match frontend expectations
    const users = usersResult.rows.map(user => ({
      id: user.user_id,
      name: user.full_name,
      email: user.email,
      username: user.username,
      phone: user.phone,
      address: user.address,
      role: user.role,
      status: user.locked ? 'suspended' : 'active'
    }));

    res.json({
      success: true,
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching users'
    });
  }
});

// Update user status (lock/unlock)
router.put('/users/:userId/status', auth, adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { locked } = req.body;

    // Don't allow admin to lock themselves
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot change your own status'
      });
    }

    const result = await pool.query(
      'UPDATE Users SET locked = $1 WHERE user_id = $2 RETURNING *',
      [locked, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: `User ${locked ? 'suspended' : 'activated'} successfully`,
      user: {
        id: result.rows[0].user_id,
        status: result.rows[0].locked ? 'suspended' : 'active'
      }
    });

  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating user status'
    });
  }
});

// Delete user
router.delete('/users/:userId', auth, adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    // Don't allow admin to delete themselves
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    const result = await pool.query(
      'DELETE FROM Users WHERE user_id = $1 RETURNING *',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting user'
    });
  }
});

// Get user details by ID
router.get('/users/:userId', auth, adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      `SELECT 
        user_id,
        username,
        full_name,
        email,
        phone,
        address,
        role,
        locked
      FROM Users 
      WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = result.rows[0];
    res.json({
      success: true,
      user: {
        id: user.user_id,
        name: user.full_name,
        email: user.email,
        username: user.username,
        phone: user.phone,
        address: user.address,
        role: user.role,
        status: user.locked ? 'suspended' : 'active'
      }
    });

  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user details'
    });
  }
});

module.exports = router; 