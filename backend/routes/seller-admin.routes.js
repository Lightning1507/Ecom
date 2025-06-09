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

// Get all sellers with their store information
router.get('/sellers', auth, adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '', verification = '' } = req.query;
    const offset = (page - 1) * limit;

    let whereConditions = ['u.role = $1'];
    let params = ['seller'];
    let paramIndex = 2;

    // Add search filter
    if (search) {
      whereConditions.push(`(u.full_name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex} OR u.username ILIKE $${paramIndex} OR s.store_name ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Add status filter (locked/active)
    if (status && status !== 'all') {
      const isLocked = status === 'suspended';
      whereConditions.push(`u.locked = $${paramIndex}`);
      params.push(isLocked);
      paramIndex++;
    }

    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

    // Get total count
    const countQuery = `
      SELECT COUNT(*) 
      FROM Users u 
      LEFT JOIN Sellers s ON u.user_id = s.seller_id 
      ${whereClause}
    `;
    const totalResult = await pool.query(countQuery, params);
    const total = parseInt(totalResult.rows[0].count);

    // Get sellers with their store information
    const sellersQuery = `
      SELECT 
        u.user_id,
        u.username,
        u.full_name,
        u.email,
        u.phone,
        u.address,
        u.locked,
        s.store_name,
        s.description,
        COALESCE((
          SELECT COUNT(*) 
          FROM Products p 
          WHERE p.seller_id = s.seller_id AND p.visible = true
        ), 0) as products_count,
        COALESCE((
          SELECT SUM(oi.price * oi.quantity) 
          FROM Order_items oi
          JOIN Orders o ON oi.order_id = o.order_id
          WHERE o.seller_id = s.seller_id AND o.status = 'delivered'
        ), 0) as total_sales
      FROM Users u 
      LEFT JOIN Sellers s ON u.user_id = s.seller_id 
      ${whereClause}
      ORDER BY u.user_id DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    params.push(limit, offset);
    const sellersResult = await pool.query(sellersQuery, params);

    // Format the data to match frontend expectations
    const sellers = sellersResult.rows.map(seller => ({
      id: seller.user_id,
      name: seller.store_name || 'No Store Name',
      ownerName: seller.full_name,
      email: seller.email,
      phone: seller.phone,
      status: seller.locked ? 'suspended' : 'active',
      productsCount: parseInt(seller.products_count) || 0,
      totalSales: parseInt(seller.total_sales) || 0,
      rating: 4.0, // Default rating - you can calculate this from reviews later
      verificationStatus: seller.store_name ? 'verified' : 'pending',
      description: seller.description
    }));

    res.json({
      success: true,
      sellers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching sellers:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching sellers'
    });
  }
});

// Update seller status (lock/unlock)
router.put('/sellers/:sellerId/status', auth, adminAuth, async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { locked } = req.body;

    // Check if the user is a seller
    const sellerCheck = await pool.query(
      'SELECT role FROM Users WHERE user_id = $1 AND role = $2',
      [sellerId, 'seller']
    );

    if (sellerCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    const result = await pool.query(
      'UPDATE Users SET locked = $1 WHERE user_id = $2 AND role = $3 RETURNING *',
      [locked, sellerId, 'seller']
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    res.json({
      success: true,
      message: `Seller ${locked ? 'suspended' : 'activated'} successfully`,
      seller: {
        id: result.rows[0].user_id,
        status: result.rows[0].locked ? 'suspended' : 'active'
      }
    });

  } catch (error) {
    console.error('Error updating seller status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating seller status'
    });
  }
});

// Delete seller
router.delete('/sellers/:sellerId', auth, adminAuth, async (req, res) => {
  try {
    const { sellerId } = req.params;

    // Check if the user is a seller
    const sellerCheck = await pool.query(
      'SELECT role FROM Users WHERE user_id = $1 AND role = $2',
      [sellerId, 'seller']
    );

    if (sellerCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    // Delete the user (this will cascade to seller profile due to foreign key)
    const result = await pool.query(
      'DELETE FROM Users WHERE user_id = $1 AND role = $2 RETURNING *',
      [sellerId, 'seller']
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    res.json({
      success: true,
      message: 'Seller deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting seller:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting seller'
    });
  }
});

// Get seller details by ID
router.get('/sellers/:sellerId', auth, adminAuth, async (req, res) => {
  try {
    const { sellerId } = req.params;

    const result = await pool.query(
      `SELECT 
        u.user_id,
        u.username,
        u.full_name,
        u.email,
        u.phone,
        u.address,
        u.locked,
        s.store_name,
        s.description,
        COALESCE((
          SELECT COUNT(*) 
          FROM Products p 
          WHERE p.seller_id = s.seller_id AND p.visible = true
        ), 0) as products_count,
        COALESCE((
          SELECT SUM(oi.price * oi.quantity) 
          FROM Order_items oi
          JOIN Orders o ON oi.order_id = o.order_id
          WHERE o.seller_id = s.seller_id AND o.status = 'delivered'
        ), 0) as total_sales
      FROM Users u 
      LEFT JOIN Sellers s ON u.user_id = s.seller_id 
      WHERE u.user_id = $1 AND u.role = $2`,
      [sellerId, 'seller']
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    const seller = result.rows[0];
    res.json({
      success: true,
      seller: {
        id: seller.user_id,
        name: seller.store_name || 'No Store Name',
        ownerName: seller.full_name,
        email: seller.email,
        phone: seller.phone,
        address: seller.address,
        status: seller.locked ? 'suspended' : 'active',
        productsCount: parseInt(seller.products_count) || 0,
        totalSales: parseInt(seller.total_sales) || 0,
        rating: 4.0,
        verificationStatus: seller.store_name ? 'verified' : 'pending',
        description: seller.description
      }
    });

  } catch (error) {
    console.error('Error fetching seller details:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching seller details'
    });
  }
});

module.exports = router; 