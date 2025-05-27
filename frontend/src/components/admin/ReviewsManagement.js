import React, { useState } from 'react';
import {
  FiCheck,
  FiX,
  FiTrash2,
  FiStar,
  FiFilter,
  FiSearch
} from 'react-icons/fi';
import './ReviewsManagement.css';

const ReviewsManagement = () => {
  // State for filters and search
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRating, setSelectedRating] = useState('all');

  // Mock reviews data - replace with API call
  const [reviews, setReviews] = useState([
    {
      id: 1,
      productId: 'P123',
      productName: 'Wireless Headphones',
      customerName: 'John Doe',
      rating: 4,
      review: 'Great sound quality and comfortable to wear for long periods.',
      date: '2024-03-15',
      status: 'pending',
      helpful: 12
    },
    {
      id: 2,
      productId: 'P456',
      productName: 'Smart Watch',
      customerName: 'Jane Smith',
      rating: 5,
      review: 'Amazing features and battery life exceeds expectations!',
      date: '2024-03-14',
      status: 'approved',
      helpful: 8
    },
    // Add more mock reviews as needed
  ]);

  // Filter reviews based on current filters
  const filteredReviews = reviews.filter(review => {
    const matchesStatus = filterStatus === 'all' || review.status === filterStatus;
    const matchesRating = selectedRating === 'all' || review.rating === parseInt(selectedRating);
    const matchesSearch = 
      review.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.review.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesRating && matchesSearch;
  });

  // Sort reviews based on current sort option
  const sortedReviews = [...filteredReviews].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.date) - new Date(a.date);
      case 'oldest':
        return new Date(a.date) - new Date(b.date);
      case 'highest':
        return b.rating - a.rating;
      case 'lowest':
        return a.rating - b.rating;
      case 'mostHelpful':
        return b.helpful - a.helpful;
      default:
        return 0;
    }
  });

  // Review actions
  const handleApprove = (reviewId) => {
    setReviews(reviews.map(review =>
      review.id === reviewId ? { ...review, status: 'approved' } : review
    ));
  };

  const handleReject = (reviewId) => {
    setReviews(reviews.map(review =>
      review.id === reviewId ? { ...review, status: 'rejected' } : review
    ));
  };

  const handleDelete = (reviewId) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      setReviews(reviews.filter(review => review.id !== reviewId));
    }
  };

  // Render stars for rating
  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <FiStar
        key={index}
        className={index < rating ? 'star-filled' : 'star-empty'}
      />
    ));
  };

  return (
    <div className="reviews-management">
      <div className="reviews-header">
        <h1>Reviews Management</h1>
        <div className="reviews-stats">
          <div className="stat-item">
            <span className="stat-value">{reviews.length}</span>
            <span className="stat-label">Total Reviews</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">
              {reviews.filter(r => r.status === 'pending').length}
            </span>
            <span className="stat-label">Pending</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">
              {(reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)}
            </span>
            <span className="stat-label">Avg Rating</span>
          </div>
        </div>
      </div>

      <div className="reviews-filters">
        <div className="search-box">
          <FiSearch />
          <input
            type="text"
            placeholder="Search reviews..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <div className="filter-item">
            <FiFilter />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="filter-item">
            <select
              value={selectedRating}
              onChange={(e) => setSelectedRating(e.target.value)}
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>

          <div className="filter-item">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Rated</option>
              <option value="lowest">Lowest Rated</option>
              <option value="mostHelpful">Most Helpful</option>
            </select>
          </div>
        </div>
      </div>

      <div className="reviews-list">
        {sortedReviews.map(review => (
          <div key={review.id} className={`review-card ${review.status}`}>
            <div className="review-header">
              <div className="review-product">
                <h3>{review.productName}</h3>
                <span className="product-id">ID: {review.productId}</span>
              </div>
              <div className="review-status">
                <span className={`status-badge ${review.status}`}>
                  {review.status.charAt(0).toUpperCase() + review.status.slice(1)}
                </span>
              </div>
            </div>

            <div className="review-content">
              <div className="review-info">
                <div className="review-rating">
                  {renderStars(review.rating)}
                </div>
                <p className="review-text">{review.review}</p>
              </div>

              <div className="review-meta">
                <span className="review-author">{review.customerName}</span>
                <span className="review-date">
                  {new Date(review.date).toLocaleDateString()}
                </span>
                <span className="review-helpful">
                  {review.helpful} found helpful
                </span>
              </div>
            </div>

            <div className="review-actions">
              {review.status === 'pending' && (
                <>
                  <button
                    className="btn-approve"
                    onClick={() => handleApprove(review.id)}
                    title="Approve Review"
                  >
                    <FiCheck />
                  </button>
                  <button
                    className="btn-reject"
                    onClick={() => handleReject(review.id)}
                    title="Reject Review"
                  >
                    <FiX />
                  </button>
                </>
              )}
              <button
                className="btn-delete"
                onClick={() => handleDelete(review.id)}
                title="Delete Review"
              >
                <FiTrash2 />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReviewsManagement; 