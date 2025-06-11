import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FiStar, 
  FiShoppingBag, 
  FiMapPin, 
  FiPhone,
  FiMail,
  FiTrendingUp,
  FiPackage,
  FiArrowLeft,
  FiExternalLink
} from 'react-icons/fi';
import './ShopDetail.css';

const ShopDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const CLOUDINARY_CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;

  const getCloudinaryUrl = (imagePath) => {
    if (!imagePath) {
      return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/v1/default-product-image`;
    }
    
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${imagePath}`;
  };

  useEffect(() => {
    const fetchShopDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE_URL}/api/shops/${id}`, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();

        if (data.success) {
          setShop(data.shop);
        } else {
          setError(data.message || 'Failed to fetch shop details');
        }
      } catch (error) {
        console.error('Error fetching shop details:', error);
        setError('Failed to load shop details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchShopDetails();
    }
  }, [id, API_BASE_URL]);

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<FiStar key={i} className="star filled" />);
    }
    if (hasHalfStar) {
      stars.push(<FiStar key="half" className="star half" />);
    }
    for (let i = stars.length; i < 5; i++) {
      stars.push(<FiStar key={i} className="star empty" />);
    }
    return stars;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="shop-detail-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading shop details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="shop-detail-page">
        <div className="error-container">
          <FiShoppingBag className="error-icon" />
          <h2>Shop Not Found</h2>
          <p>{error}</p>
          <div className="error-actions">
            <button onClick={() => navigate('/shops')} className="back-to-shops-btn">
              <FiArrowLeft /> Back to Shops
            </button>
            <button onClick={() => window.location.reload()} className="retry-button">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="shop-detail-page">
        <div className="error-container">
          <FiShoppingBag className="error-icon" />
          <h2>Shop Not Found</h2>
          <p>The shop you're looking for doesn't exist or has been removed.</p>
          <button onClick={() => navigate('/shops')} className="back-to-shops-btn">
            <FiArrowLeft /> Back to Shops
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="shop-detail-page">
      {/* Back Button */}
      <motion.button
        className="back-button"
        onClick={() => navigate('/shops')}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ x: -5 }}
      >
        <FiArrowLeft /> Back to Shops
      </motion.button>

      {/* Shop Header */}
      <motion.div
        className="shop-header"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="shop-avatar-large">
          <FiShoppingBag className="shop-icon-large" />
        </div>
        <div className="shop-main-info">
          <h1 className="shop-name">{shop.name}</h1>
          <p className="shop-owner">Owned by {shop.owner}</p>
          <div className="shop-rating-large">
            <div className="stars">
              {renderStars(shop.rating)}
            </div>
            <span className="rating-text">
              {shop.rating > 0 ? `${shop.rating.toFixed(1)} stars` : 'No ratings yet'}
              {shop.totalReviews > 0 && ` (${shop.totalReviews} reviews)`}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Shop Description */}
      {shop.description && (
        <motion.div
          className="shop-description-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2>About This Shop</h2>
          <p>{shop.description}</p>
        </motion.div>
      )}

      {/* Shop Statistics */}
      <motion.div
        className="shop-stats-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="stats-grid">
          <div className="stat-card">
            <FiPackage className="stat-icon" />
            <div className="stat-content">
              <span className="stat-number">{shop.productsCount}</span>
              <span className="stat-label">Products</span>
            </div>
          </div>
          <div className="stat-card">
            <FiTrendingUp className="stat-icon" />
            <div className="stat-content">
              <span className="stat-number">{shop.totalSold}</span>
              <span className="stat-label">Items Sold</span>
            </div>
          </div>

          <div className="stat-card">
            <FiStar className="stat-icon" />
            <div className="stat-content">
              <span className="stat-number">{shop.rating.toFixed(1)}</span>
              <span className="stat-label">Average Rating</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Contact Information */}
      <motion.div
        className="shop-contact-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h2>Contact Information</h2>
        <div className="contact-grid">
          {shop.email && (
            <div className="contact-item">
              <FiMail className="contact-icon" />
              <div className="contact-content">
                <span className="contact-label">Email</span>
                <span className="contact-value">{shop.email}</span>
              </div>
            </div>
          )}
          {shop.phone && (
            <div className="contact-item">
              <FiPhone className="contact-icon" />
              <div className="contact-content">
                <span className="contact-label">Phone</span>
                <span className="contact-value">{shop.phone}</span>
              </div>
            </div>
          )}
          {shop.address && (
            <div className="contact-item">
              <FiMapPin className="contact-icon" />
              <div className="contact-content">
                <span className="contact-label">Address</span>
                <span className="contact-value">{shop.address}</span>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Categories */}
      {shop.categories && shop.categories.length > 0 && (
        <motion.div
          className="shop-categories-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2>Product Categories</h2>
          <div className="categories-grid">
            {shop.categories.map((category, index) => (
              <motion.div
                key={category.name}
                className="category-badge"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                whileHover={{ scale: 1.05 }}
              >
                <span className="category-name">{category.name}</span>
                <span className="category-count">{category.product_count} products</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Recent Products */}
      {shop.recentProducts && shop.recentProducts.length > 0 && (
        <motion.div
          className="shop-products-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="section-header">
            <h2>Featured Products</h2>
            <Link 
              to={`/products?seller=${shop.id}`}
              className="view-all-products-btn"
            >
              View All Products <FiExternalLink />
            </Link>
          </div>
          <div className="products-grid">
            {shop.recentProducts.map((product, index) => (
              <motion.div
                key={product.id}
                className="product-card-mini"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <Link to={`/products/${product.id}`} className="product-link">
                  <div className="product-image-mini">
                    <img src={getCloudinaryUrl(product.image)} alt={product.name} />
                  </div>
                  <div className="product-info-mini">
                    <h4 className="product-name-mini">{product.name}</h4>
                    <div className="product-details-mini">
                      <span className="product-price-mini">
                        {formatCurrency(product.price)}
                      </span>
                      <div className="product-rating-mini">
                        <FiStar className="star-mini" />
                        <span>{product.rating.toFixed(1)}</span>
                      </div>
                    </div>
                    <span className="product-sold-mini">{product.totalSold} sold</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Action Buttons */}
      <motion.div
        className="shop-actions"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Link 
          to={`/products?seller=${shop.id}`}
          className="view-products-btn primary"
        >
          <FiShoppingBag />
          View All Products ({shop.productsCount})
        </Link>
      </motion.div>
    </div>
  );
};

export default ShopDetail; 