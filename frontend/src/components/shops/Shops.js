import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalShops, setTotalShops] = useState(0);
  const [shopsPerPage] = useState(9);
  const [loadingMore, setLoadingMore] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Debounce search to avoid too many API calls
  const debouncedSearchTerm = useMemo(() => {
    const timer = setTimeout(() => searchTerm, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchShops = useCallback(async (searchQuery = '', pageNum = 1, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      const queryParams = new URLSearchParams({
        page: pageNum,
        limit: shopsPerPage,
        search: searchQuery,
        simple: 'true' // Use simple mode for faster loading
      });

      const response = await fetch(`${API_BASE_URL}/api/shops?${queryParams}`);
      const data = await response.json();

      if (data.success) {
        if (append) {
          setShops(prev => [...prev, ...data.shops]);
        } else {
          setShops(data.shops);
        }
        setCurrentPage(data.pagination.page);
        setTotalPages(data.pagination.pages);
        setTotalShops(data.pagination.total);
      } else {
        setError(data.message || 'Failed to fetch shops');
      }
    } catch (error) {
      console.error('Error fetching shops:', error);
      setError('Failed to load shops. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [API_BASE_URL, shopsPerPage]);

  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchShops(searchTerm, 1);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
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

  if (loading && shops.length === 0) {
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
                    <span className="stat-value">-</span>
                    <span className="stat-label">Products</span>
                  </div>
                  <div className="stat">
                    <FiTrendingUp className="stat-icon" />
                    <span className="stat-value">-</span>
                    <span className="stat-label">Sold</span>
                  </div>
                </div>

                <div className="shop-rating">
                  <div className="stars">
                    {renderStars(0)}
                  </div>
                  <span className="rating-text">
                    View shop for details
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

      {/* Pagination Controls */}
      {!searchTerm && totalPages > 1 && (
        <div className="pagination-container">
          <div className="pagination-info">
            <p>
              Showing {shops.length} of {totalShops} shops
            </p>
          </div>
          
          {/* Load More Button */}
          {currentPage < totalPages && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="load-more-button"
              onClick={() => fetchShops(searchTerm, currentPage + 1, true)}
              disabled={loadingMore}
            >
              {loadingMore ? 'Loading...' : 'Load More Shops'}
            </motion.button>
          )}

          {/* Page Numbers */}
          <div className="pagination-numbers">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  className={`page-button ${currentPage === pageNum ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentPage(pageNum);
                    fetchShops(searchTerm, pageNum);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Simple pagination for search results */}
      {searchTerm && totalPages > 1 && (
        <div className="simple-pagination">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="pagination-btn"
          >
            Previous
          </button>
          
          <span className="page-info">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
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