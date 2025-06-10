import React, { useState, useEffect } from 'react';
import { FiStar, FiUser } from 'react-icons/fi';
import './ProductReviews.css';

const StarRating = ({ rating, size = 16 }) => {
  return (
    <div className="star-rating" style={{ fontSize: size }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`star ${star <= rating ? 'filled' : ''}`}
        >
          <FiStar />
        </span>
      ))}
    </div>
  );
};

const ProductReviews = ({ productId }) => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        
        // Fetch reviews and stats in parallel
        const [reviewsResponse, statsResponse] = await Promise.all([
          fetch(`http://localhost:5000/api/customer/products/${productId}/reviews?page=${currentPage}&limit=10`),
          fetch(`http://localhost:5000/api/customer/products/${productId}/reviews/stats`)
        ]);

        const reviewsData = await reviewsResponse.json();
        const statsData = await statsResponse.json();

        if (reviewsData.success) {
          setReviews(reviewsData.reviews);
          setTotalPages(reviewsData.pagination.pages);
          setError(null);
        } else {
          setError(reviewsData.message || 'Failed to fetch reviews');
        }

        if (statsData.success) {
          setStats(statsData.stats);
        }

      } catch (err) {
        console.error('Error fetching reviews:', err);
        setError('Failed to load reviews');
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchReviews();
    }
  }, [productId, currentPage]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getPercentage = (count, total) => {
    return total > 0 ? Math.round((count / total) * 100) : 0;
  };

  if (loading) {
    return (
      <div className="product-reviews">
        <div className="reviews-loading">
          <p>Loading reviews...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="product-reviews">
        <div className="reviews-error">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="product-reviews">
      <h3>Customer Reviews</h3>
      
      {stats && (
        <div className="reviews-summary">
          <div className="rating-overview">
            <div className="average-rating">
              <span className="rating-number">{stats.averageRating.toFixed(1)}</span>
              <StarRating rating={Math.round(stats.averageRating)} size={20} />
              <span className="review-count">({stats.totalReviews} reviews)</span>
            </div>
            
            <div className="rating-breakdown">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="rating-bar">
                  <span className="rating-label">{rating}</span>
                  <FiStar className="star-icon" />
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ 
                        width: `${getPercentage(stats.ratingDistribution[rating], stats.totalReviews)}%` 
                      }}
                    ></div>
                  </div>
                  <span className="rating-count">
                    {stats.ratingDistribution[rating]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="reviews-list">
        {reviews.length === 0 ? (
          <div className="no-reviews">
            <p>No reviews yet. Be the first to review this product!</p>
          </div>
        ) : (
          <>
            {reviews.map((review) => (
              <div key={review.reviewId} className="review-item">
                <div className="review-header">
                  <div className="reviewer-info">
                    <FiUser className="user-icon" />
                    <span className="reviewer-name">{review.reviewerName}</span>
                  </div>
                  <div className="review-meta">
                    <StarRating rating={review.rating} />
                    <span className="review-date">{formatDate(review.orderDate)}</span>
                  </div>
                </div>
                
                {review.comment && (
                  <div className="review-content">
                    <p>{review.comment}</p>
                  </div>
                )}
                
                {review.image && (
                  <div className="review-image">
                    <img 
                      src={review.image} 
                      alt="Review" 
                      onClick={() => window.open(review.image, '_blank')}
                    />
                  </div>
                )}
              </div>
            ))}

            {totalPages > 1 && (
              <div className="pagination">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="pagination-btn"
                >
                  Previous
                </button>
                
                <span className="pagination-info">
                  Page {currentPage} of {totalPages}
                </span>
                
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="pagination-btn"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ProductReviews; 