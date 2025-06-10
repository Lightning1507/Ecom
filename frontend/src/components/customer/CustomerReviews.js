import React, { useState, useEffect, useCallback } from 'react';
import { 
  FiStar, 
  FiEdit3, 
  FiShoppingBag,
  FiCalendar
} from 'react-icons/fi';
import './CustomerReviews.css';

const StarRating = ({ rating, onRatingChange, disabled = false }) => {
  const [hover, setHover] = useState(0);

  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`star ${star <= (hover || rating) ? 'filled' : ''}`}
          onClick={() => !disabled && onRatingChange && onRatingChange(star)}
          onMouseEnter={() => !disabled && setHover(star)}
          onMouseLeave={() => !disabled && setHover(0)}
          disabled={disabled}
        >
          <FiStar />
        </button>
      ))}
    </div>
  );
};

const ReviewModal = ({ isOpen, onClose, product, orderId, existingReview, onReviewSubmitted }) => {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const getAuthToken = () => {
    try {
      let token = localStorage.getItem('token');
      if (token) return token;

      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.token) return user.token;
      }
      return null;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    setLoading(true);
    try {
      const token = getAuthToken();
      if (!token) {
        alert('Please log in to submit a review');
        return;
      }

      const formData = new FormData();
      formData.append('orderId', orderId);
      formData.append('productId', product.productId);
      formData.append('rating', rating);
      if (comment) {
        formData.append('comment', comment);
      }
      if (image) {
        formData.append('image', image);
      }

      const url = existingReview 
        ? `http://localhost:5000/api/customer/reviews/${existingReview.reviewId}`
        : 'http://localhost:5000/api/customer/reviews';
      
      const method = existingReview ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        alert(existingReview ? 'Review updated successfully!' : 'Review submitted successfully!');
        onReviewSubmitted();
        onClose();
      } else {
        alert(data.message || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal review-modal">
        <div className="modal-header">
          <h2>{existingReview ? 'Update Review' : 'Write a Review'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="product-info">
            <img src={product.productImage || '/placeholder-image.jpg'} alt={product.productName} />
            <div>
              <h3>{product.productName}</h3>
              <p>{product.productDescription}</p>
            </div>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Rating *</label>
              <StarRating rating={rating} onRatingChange={setRating} />
            </div>

            <div className="form-group">
              <label>Comment (Optional)</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience with this product..."
                rows={4}
              />
            </div>

            <div className="form-group">
              <label>Add Photo (Optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImage(e.target.files[0])}
              />
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Submitting...' : (existingReview ? 'Update Review' : 'Submit Review')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const CustomerReviews = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [existingReview, setExistingReview] = useState(null);

  const getAuthToken = () => {
    try {
      let token = localStorage.getItem('token');
      if (token) return token;

      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.token) return user.token;
      }
      return null;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  };

  const fetchCompletedOrders = useCallback(async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      
      if (!token) {
        setError('Please log in to view your orders');
        return;
      }

      const response = await fetch('http://localhost:5000/api/customer/orders/completed', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setOrders(data.orders);
        setError(null);
      } else {
        setError(data.message || 'Failed to fetch orders');
      }
    } catch (err) {
      console.error('Error fetching completed orders:', err);
      setError('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompletedOrders();
  }, [fetchCompletedOrders]);

  const handleReviewProduct = (product, orderId) => {
    setSelectedProduct(product);
    setSelectedOrderId(orderId);
    setExistingReview(product.existingReview);
    setShowReviewModal(true);
  };

  const handleReviewSubmitted = () => {
    fetchCompletedOrders(); // Refresh orders to show updated review status
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="customer-reviews">
        <div className="loading-state">
          <h2>Loading your orders...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="customer-reviews">
        <div className="error-state">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={fetchCompletedOrders} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="customer-reviews">
      <div className="page-header">
        <h1>My Reviews</h1>
        <p>Review products from your completed orders</p>
      </div>

      {orders.length === 0 ? (
        <div className="no-orders">
          <FiShoppingBag size={48} />
          <h3>No completed orders yet</h3>
          <p>Once you complete an order, you'll be able to review the products here.</p>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order.orderId} className="order-card">
              <div className="order-header">
                <div className="order-info">
                  <h3>Order #{order.orderId}</h3>
                  <div className="order-meta">
                    <span className="order-date">
                      <FiCalendar size={16} />
                      {formatDate(order.orderDate)}
                    </span>
                    <span className="seller-name">{order.sellerName}</span>
                    <span className="order-total">{formatCurrency(order.totalAmount)}</span>
                  </div>
                </div>
              </div>

              <div className="order-items">
                {order.items.map((item) => (
                  <div key={item.productId} className="order-item">
                    <div className="item-image">
                      <img 
                        src={item.productImage || '/placeholder-image.jpg'} 
                        alt={item.productName}
                      />
                    </div>
                    <div className="item-details">
                      <h4>{item.productName}</h4>
                      <p className="item-price">
                        {formatCurrency(item.price)} × {item.quantity}
                      </p>
                      {item.hasReview && (
                        <div className="existing-review">
                          <StarRating rating={item.existingReview.rating} disabled />
                          {item.existingReview.comment && (
                            <p className="review-comment">"{item.existingReview.comment}"</p>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="item-actions">
                      {item.hasReview ? (
                        <button 
                          className="btn-secondary"
                          onClick={() => handleReviewProduct(item, order.orderId)}
                        >
                          <FiEdit3 size={16} />
                          Edit Review
                        </button>
                      ) : (
                        <button 
                          className="btn-primary"
                          onClick={() => handleReviewProduct(item, order.orderId)}
                        >
                          <FiStar size={16} />
                          Write Review
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        product={selectedProduct}
        orderId={selectedOrderId}
        existingReview={existingReview}
        onReviewSubmitted={handleReviewSubmitted}
      />
    </div>
  );
};

export default CustomerReviews; 