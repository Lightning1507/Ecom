const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const { upload } = require('../config/cloudinary');
const { deleteImage } = require('../utils/cloudinary');

// Get customer's completed orders with reviewable products
router.get('/orders/completed', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const ordersQuery = `
      SELECT DISTINCT
        o.order_id,
        o.order_date,
        o.status,
        s.store_name as seller_name,
        p.amount as total_amount,
        p.payment_method
      FROM Orders o
      JOIN Payments p ON o.order_id = p.order_id
      JOIN Sellers s ON o.seller_id = s.seller_id
      WHERE o.user_id = $1 AND o.status = 'delivered'
      ORDER BY o.order_date DESC
    `;

    const ordersResult = await pool.query(ordersQuery, [userId]);

    // Get items for each order with review status
    const ordersWithItems = [];
    for (const order of ordersResult.rows) {
      const itemsQuery = `
        SELECT 
          oi.product_id,
          oi.quantity,
          oi.price,
          pr.name as product_name,
          pr.description as product_description,
          pr.img_path as product_image,
          CASE 
            WHEN r.review_id IS NOT NULL THEN true 
            ELSE false 
          END as has_review,
          r.rating,
          r.comment,
          r.review_id
        FROM Order_items oi
        JOIN Products pr ON oi.product_id = pr.product_id
        LEFT JOIN Reviews r ON r.order_id = oi.order_id AND r.product_id = oi.product_id AND r.user_id = $2
        WHERE oi.order_id = $1
      `;

      const itemsResult = await pool.query(itemsQuery, [order.order_id, userId]);

      ordersWithItems.push({
        orderId: order.order_id,
        orderDate: order.order_date,
        status: order.status,
        sellerName: order.seller_name,
        totalAmount: parseFloat(order.total_amount) || 0,
        paymentMethod: order.payment_method,
        items: itemsResult.rows.map(item => ({
          productId: item.product_id,
          productName: item.product_name,
          productDescription: item.product_description,
          productImage: item.product_image,
          quantity: item.quantity,
          price: parseFloat(item.price),
          hasReview: item.has_review,
          existingReview: item.has_review ? {
            reviewId: item.review_id,
            rating: item.rating,
            comment: item.comment
          } : null
        }))
      });
    }

    res.json({
      success: true,
      orders: ordersWithItems
    });

  } catch (error) {
    console.error('Error fetching completed orders:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching completed orders'
    });
  }
});

// Submit a review for a product
router.post('/reviews', auth, (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    next();
  });
}, async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId, productId, rating, comment } = req.body;
    const imageUrl = req.file ? req.file.path : null; // Cloudinary returns the full URL in path

    // Validate input
    if (!orderId || !productId || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Order ID, Product ID, and rating are required'
      });
    }

    // Validate rating range
    const ratingNum = parseInt(rating);
    if (ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Check if order belongs to user and is delivered
    const orderCheck = await pool.query(`
      SELECT o.order_id, o.status
      FROM Orders o
      JOIN Order_items oi ON o.order_id = oi.order_id
      WHERE o.order_id = $1 AND o.user_id = $2 AND oi.product_id = $3 AND o.status = 'delivered'
    `, [orderId, userId, productId]);

    if (orderCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found, not delivered, or product not in order'
      });
    }

    // Check if review already exists
    const existingReview = await pool.query(`
      SELECT review_id FROM Reviews 
      WHERE order_id = $1 AND product_id = $2 AND user_id = $3
    `, [orderId, productId, userId]);

    if (existingReview.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product'
      });
    }

    // Insert review
    const insertResult = await pool.query(`
      INSERT INTO Reviews (order_id, product_id, user_id, rating, comment, img_path)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING review_id, rating, comment, img_path
    `, [orderId, productId, userId, ratingNum, comment || null, imageUrl]);

    const newReview = insertResult.rows[0];

    res.json({
      success: true,
      message: 'Review submitted successfully',
      review: {
        reviewId: newReview.review_id,
        rating: newReview.rating,
        comment: newReview.comment,
        image: newReview.img_path
      }
    });

  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while submitting review'
    });
  }
});

// Update an existing review
router.put('/reviews/:reviewId', auth, (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    next();
  });
}, async (req, res) => {
  try {
    const userId = req.user.id;
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    const imageUrl = req.file ? req.file.path : null; // Cloudinary returns the full URL in path

    // Validate rating if provided
    if (rating) {
      const ratingNum = parseInt(rating);
      if (ratingNum < 1 || ratingNum > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be between 1 and 5'
        });
      }
    }

    // Check if review belongs to user and get current image
    const reviewCheck = await pool.query(`
      SELECT review_id, img_path FROM Reviews 
      WHERE review_id = $1 AND user_id = $2
    `, [reviewId, userId]);

    if (reviewCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or you don\'t have permission to update it'
      });
    }

    const currentImageUrl = reviewCheck.rows[0].img_path;

    // Build update query dynamically
    let updateFields = [];
    let params = [];
    let paramIndex = 1;

    if (rating) {
      updateFields.push(`rating = $${paramIndex}`);
      params.push(parseInt(rating));
      paramIndex++;
    }

    if (comment !== undefined) {
      updateFields.push(`comment = $${paramIndex}`);
      params.push(comment || null);
      paramIndex++;
    }

    if (imageUrl) {
      updateFields.push(`img_path = $${paramIndex}`);
      params.push(imageUrl);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    params.push(reviewId);
    const updateQuery = `
      UPDATE Reviews 
      SET ${updateFields.join(', ')}
      WHERE review_id = $${paramIndex}
      RETURNING review_id, rating, comment, img_path
    `;

    const updateResult = await pool.query(updateQuery, params);
    const updatedReview = updateResult.rows[0];

    // If a new image was uploaded and there was an old image, delete the old one
    if (imageUrl && currentImageUrl && currentImageUrl !== imageUrl) {
      try {
        await deleteImage(currentImageUrl);
      } catch (error) {
        console.error('Failed to delete old review image:', error);
        // Don't fail the request if image cleanup fails
      }
    }

    res.json({
      success: true,
      message: 'Review updated successfully',
      review: {
        reviewId: updatedReview.review_id,
        rating: updatedReview.rating,
        comment: updatedReview.comment,
        image: updatedReview.img_path
      }
    });

  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating review'
    });
  }
});

// Get reviews for a product
router.get('/products/:productId/reviews', async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Get reviews with user info
    const reviewsQuery = `
      SELECT 
        r.review_id,
        r.rating,
        r.comment,
        r.img_path,
        u.full_name as reviewer_name,
        u.username as reviewer_username,
        o.order_date
      FROM Reviews r
      JOIN Users u ON r.user_id = u.user_id
      JOIN Orders o ON r.order_id = o.order_id
      WHERE r.product_id = $1
      ORDER BY o.order_date DESC
      LIMIT $2 OFFSET $3
    `;

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM Reviews 
      WHERE product_id = $1
    `;

    const [reviewsResult, countResult] = await Promise.all([
      pool.query(reviewsQuery, [productId, limit, offset]),
      pool.query(countQuery, [productId])
    ]);

    const total = parseInt(countResult.rows[0].total);
    const reviews = reviewsResult.rows.map(review => ({
      reviewId: review.review_id,
      rating: review.rating,
      comment: review.comment,
      image: review.img_path,
      reviewerName: review.reviewer_name || review.reviewer_username,
      orderDate: review.order_date
    }));

    res.json({
      success: true,
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching product reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching reviews'
    });
  }
});

// Get review statistics for a product
router.get('/products/:productId/reviews/stats', async (req, res) => {
  try {
    const { productId } = req.params;

    const statsQuery = `
      SELECT 
        COUNT(*) as total_reviews,
        AVG(rating) as average_rating,
        COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star,
        COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
        COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
        COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
        COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star
      FROM Reviews
      WHERE product_id = $1
    `;

    const result = await pool.query(statsQuery, [productId]);
    const stats = result.rows[0];

    res.json({
      success: true,
      stats: {
        totalReviews: parseInt(stats.total_reviews),
        averageRating: parseFloat(stats.average_rating) || 0,
        ratingDistribution: {
          5: parseInt(stats.five_star),
          4: parseInt(stats.four_star),
          3: parseInt(stats.three_star),
          2: parseInt(stats.two_star),
          1: parseInt(stats.one_star)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching review stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching review statistics'
    });
  }
});

module.exports = router; 