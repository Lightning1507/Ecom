import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FiSearch, 
  FiStar, 
  FiShoppingBag, 
  FiGrid, 
  FiList,
  FiTrendingUp
} from 'react-icons/fi';
import './Shops.css';

const Shops = () => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const fetchShops = useCallback(async (searchQuery = '', pageNum = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams({
        page: pageNum,
        limit: 12,
        search: searchQuery
      });

      const response = await fetch(`${API_BASE_URL}/api/shops?${queryParams}`);
      const data = await response.json();

      if (data.success) {
        setShops(data.shops);
        setTotalPages(data.pagination.pages);
      } else {
        setError(data.message || 'Failed to fetch shops');
      }
    } catch (error) {
      console.error('Error fetching shops:', error);
      setError('Failed to load shops. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchShops(searchTerm, 1);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    fetchShops(searchTerm, newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

  if (loading) {
    return (
      <div className="shops-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading shops...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="shops-page">
        <div className="error-container">
          <FiShoppingBag className="error-icon" />
          <h2>Oops! Something went wrong</h2>
          <p>{error}</p>
          <button onClick={() => fetchShops()} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="shops-page">
      {/* Header Section */}
      <div className="shops-header">
        <motion.div
          className="header-content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1>
            <FiShoppingBag className="header-icon" />
            Discover Amazing Shops
          </h1>
          <p>Browse through our collection of verified sellers and find the perfect products</p>
        </motion.div>
      </div>

      {/* Search and Controls */}
      <div className="shops-controls">
        <form onSubmit={handleSearch} className="search-container">
          <div className="search-bar">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search shops by name, owner, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit" className="search-button">
              Search
            </button>
          </div>
        </form>

        <div className="view-controls">
          <button
            className={`view-button ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
          >
            <FiGrid /> Grid
          </button>
          <button
            className={`view-button ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            <FiList /> List
          </button>
        </div>
      </div>

      {/* Shops Grid/List */}
      <div className={`shops-container ${viewMode}`}>
        {shops.length > 0 ? (
          shops.map((shop, index) => (
            <motion.div
              key={shop.id}
              className="shop-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
                             <Link to={`/shops/${shop.id}`} className="shop-link">
                 <div className="shop-header">
                   <div className="shop-avatar">
                     <FiShoppingBag className="shop-icon" />
                   </div>
                  <div className="shop-basic-info">
                    <h3 className="shop-name">{shop.name}</h3>
                    <p className="shop-owner">by {shop.owner}</p>
                  </div>
                </div>

                <div className="shop-description">
                  <p>{shop.description}</p>
                </div>

                <div className="shop-stats">
                  <div className="stat">
                    <FiShoppingBag className="stat-icon" />
                    <span className="stat-value">{shop.productsCount}</span>
                    <span className="stat-label">Products</span>
                  </div>
                  <div className="stat">
                    <FiTrendingUp className="stat-icon" />
                    <span className="stat-value">{shop.totalSold}</span>
                    <span className="stat-label">Sold</span>
                  </div>
                </div>

                <div className="shop-rating">
                  <div className="stars">
                    {renderStars(shop.rating)}
                  </div>
                  <span className="rating-text">
                    {shop.rating > 0 ? `${shop.rating.toFixed(1)} stars` : 'No ratings yet'}
                  </span>
                </div>

                                 <div className="shop-footer">
                   <button className="visit-shop-btn">
                     View Shop <FiShoppingBag />
                   </button>
                 </div>
              </Link>
            </motion.div>
          ))
        ) : (
                     <motion.div
             className="no-shops"
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
           >
             <FiShoppingBag className="empty-icon" />
             <h3>No shops found</h3>
            <p>
              {searchTerm
                ? `No shops match your search for "${searchTerm}"`
                : 'No shops are available at the moment'
              }
            </p>
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  fetchShops('', 1);
                }}
                className="clear-search-btn"
              >
                Clear Search
              </button>
            )}
          </motion.div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            className="pagination-btn"
          >
            Previous
          </button>
          
          <div className="pagination-numbers">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`pagination-number ${page === pageNum ? 'active' : ''}`}
              >
                {pageNum}
              </button>
            ))}
          </div>

          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
            className="pagination-btn"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Shops; 