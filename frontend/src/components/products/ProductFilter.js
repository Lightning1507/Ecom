import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiFilter, FiX } from 'react-icons/fi';
import './ProductFilter.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const ProductFilter = ({ filters, setFilters, isOpen, onToggle }) => {
  const [customPriceRange, setCustomPriceRange] = useState({
    min: '',
    max: ''
  });
  const [filterData, setFilterData] = useState({
    categories: [],
    brands: [],
    priceRange: { min: 0, max: 0 }
  });
  const [loading, setLoading] = useState(true);

  // Fetch filter data from the database
  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/products/filters/data`);
        if (response.ok) {
          const data = await response.json();
          setFilterData(data);
        } else {
          console.error('Failed to fetch filter data');
        }
      } catch (error) {
        console.error('Error fetching filter data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFilterData();
  }, []);

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

  // Generate price range options dynamically
  const generatePriceRangeOptions = () => {
    const { min, max } = filterData.priceRange;
    if (min === 0 && max === 0) return [];
    
    const ranges = [
      { label: 'All Prices', value: 'all' },
      { label: `Under ${formatPrice(1000000)}`, value: '0-1000000' },
      { label: `${formatPrice(1000000)} - ${formatPrice(5000000)}`, value: '1000000-5000000' },
      { label: `${formatPrice(5000000)} - ${formatPrice(10000000)}`, value: '5000000-10000000' },
      { label: `${formatPrice(10000000)} - ${formatPrice(50000000)}`, value: '10000000-50000000' },
      { label: `Over ${formatPrice(50000000)}`, value: '50000000+' }
    ];
    
    return ranges;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price) + '₫';
  };

  if (loading) {
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
          <div className="filter-panel">
            <p>Loading filters...</p>
          </div>
        )}
      </div>
    );
  }

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
          {/* First Row Filters */}
          <div className="filter-section">
            <h3>Categories</h3>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              <option value="all">All Categories</option>
              {filterData.categories.map(category => (
                <option key={category.category_id} value={category.name}>
                  {category.name}
                </option>
              ))}
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
              {generatePriceRangeOptions().map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
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
              {filterData.brands.map(brand => (
                <option key={brand.value} value={brand.value}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>

          {/* Second Row Filters */}
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