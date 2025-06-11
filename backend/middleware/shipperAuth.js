const pool = require('../db');

const shipperAuth = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Check if user has shipper role
    const result = await pool.query(
      'SELECT role FROM Users WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = result.rows[0];
    
    if (user.role !== 'shipper') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Shipper role required.'
      });
    }

    next();
  } catch (error) {
    console.error('Shipper auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during authentication'
    });
  }
};

module.exports = shipperAuth; 