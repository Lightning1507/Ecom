import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiFilter, FiX } from 'react-icons/fi';
import './ProductFilter.css';

const ProductFilter = ({ filters, setFilters, isOpen, onToggle }) => {
  const [customPriceRange, setCustomPriceRange] = useState({
    min: '',
    max: ''
  });

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleCustomPriceChange = (type, value) => {
    setCustomPriceRange(prev => ({
      ...prev,
      [type]: value
    }));
  };

  const applyCustomPriceRange = () => {
    const min = Number(customPriceRange.min) || 0;
    const max = Number(customPriceRange.max) || Infinity;
    handleFilterChange('priceRange', `${min}-${max}`);
  };

  const clearFilters = () => {
    setFilters({
      category: 'all',
      priceRange: 'all',
      rating: 'all',
      sortBy: 'popular',
      brand: 'all',
      availability: 'all'
    });
    setCustomPriceRange({ min: '', max: '' });
  };

  return (
    <div className="product-filter">
      <div className="filter-buttons">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="filter-toggle-button"
          onClick={onToggle}
        >
          {isOpen ? <FiX /> : <FiFilter />}
          {isOpen ? 'Close Filters' : 'Filters'}
        </motion.button>
      </div>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="filter-panel"
        >
          <div className="filter-section">
            <h3>Categories</h3>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              <option value="all">All Categories</option>
              <option value="electronics">Electronics</option>
              <option value="fashion">Fashion</option>
              <option value="home">Home & Garden</option>
              <option value="sports">Sports</option>
              <option value="books">Books</option>
              <option value="beauty">Beauty</option>
            </select>
          </div>

          <div className="filter-section">
            <h3>Price Range</h3>
            <div className="price-range-inputs">
              <div className="price-input-group">
                <input
                  type="number"
                  placeholder="Min"
                  value={customPriceRange.min}
                  onChange={(e) => handleCustomPriceChange('min', e.target.value)}
                  min="0"
                />
                <span>to</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={customPriceRange.max}
                  onChange={(e) => handleCustomPriceChange('max', e.target.value)}
                  min="0"
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="apply-price-button"
                onClick={applyCustomPriceRange}
              >
                Apply
              </motion.button>
            </div>
            <select
              value={filters.priceRange}
              onChange={(e) => handleFilterChange('priceRange', e.target.value)}
            >
              <option value="all">All Prices</option>
              <option value="0-50">Under $50</option>
              <option value="51-100">$51 - $100</option>
              <option value="101-200">$101 - $200</option>
              <option value="201-500">$201 - $500</option>
              <option value="501+">Over $500</option>
            </select>
          </div>

          <div className="filter-section">
            <h3>Rating</h3>
            <select
              value={filters.rating}
              onChange={(e) => handleFilterChange('rating', e.target.value)}
            >
              <option value="all">All Ratings</option>
              <option value="4+">4+ Stars</option>
              <option value="3+">3+ Stars</option>
              <option value="2+">2+ Stars</option>
              <option value="1+">1+ Stars</option>
            </select>
          </div>

          <div className="filter-section">
            <h3>Brand</h3>
            <select
              value={filters.brand}
              onChange={(e) => handleFilterChange('brand', e.target.value)}
            >
              <option value="all">All Brands</option>
              <option value="apple">Apple</option>
              <option value="samsung">Samsung</option>
              <option value="nike">Nike</option>
              <option value="adidas">Adidas</option>
              <option value="sony">Sony</option>
            </select>
          </div>

          <div className="filter-section">
            <h3>Availability</h3>
            <select
              value={filters.availability}
              onChange={(e) => handleFilterChange('availability', e.target.value)}
            >
              <option value="all">All</option>
              <option value="in-stock">In Stock</option>
              <option value="out-of-stock">Out of Stock</option>
            </select>
          </div>

          <div className="filter-section">
            <h3>Sort By</h3>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            >
              <option value="popular">Most Popular</option>
              <option value="newest">Newest First</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating-desc">Highest Rated</option>
            </select>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="clear-filters-button"
            onClick={clearFilters}
          >
            Clear All Filters
          </motion.button>
        </motion.div>
      )}
    </div>
  );
};

export default ProductFilter; 