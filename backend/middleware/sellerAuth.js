// middleware/sellerAuth.js
module.exports = function(req, res, next) {
  // Check if user has seller role
  if (req.user.role !== 'seller') {
    return res.status(403).json({ message: 'Access denied. Seller permission required.' });
  }
  
  next();
};