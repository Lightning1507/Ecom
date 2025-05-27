import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiGrid, FiList, FiFilter, FiChevronDown } from 'react-icons/fi';
import './Category.css';

const Category = () => {
  const [viewMode, setViewMode] = useState('grid');
  const [selectedFilters, setSelectedFilters] = useState({
    priceRange: 'all',
    sortBy: 'popular',
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Sample categories data - in a real app, this would come from an API
  const categories = [
    {
      id: 1,
      name: 'Electronics',
      image: 'https://via.placeholder.com/300',
      productCount: 150,
      featured: true,
    },
    {
      id: 2,
      name: 'Fashion',
      image: 'https://via.placeholder.com/300',
      productCount: 320,
      featured: true,
    },
    {
      id: 3,
      name: 'Home & Garden',
      image: 'https://via.placeholder.com/300',
      productCount: 245,
      featured: false,
    },
    {
      id: 4,
      name: 'Sports',
      image: 'https://via.placeholder.com/300',
      productCount: 180,
      featured: true,
    },
    {
      id: 5,
      name: 'Books',
      image: 'https://via.placeholder.com/300',
      productCount: 420,
      featured: false,
    },
    {
      id: 6,
      name: 'Beauty',
      image: 'https://via.placeholder.com/300',
      productCount: 195,
      featured: true,
    },
  ];

  const toggleFilter = () => {
    setIsFilterOpen(!isFilterOpen);
  };

  const handleFilterChange = (filterType, value) => {
    setSelectedFilters({
      ...selectedFilters,
      [filterType]: value,
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
    },
  };

  return (
    <div className="category-page">
      <div className="category-header">
        <h1>Categories</h1>
        <div className="view-controls">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`view-button ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
          >
            <FiGrid /> Grid
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`view-button ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            <FiList /> List
          </motion.button>
        </div>
      </div>

      <div className="category-toolbar">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="filter-button"
          onClick={toggleFilter}
        >
          <FiFilter /> Filter <FiChevronDown />
        </motion.button>

        {isFilterOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="filter-panel"
          >
            <div className="filter-group">
              <label>Price Range:</label>
              <select
                value={selectedFilters.priceRange}
                onChange={(e) => handleFilterChange('priceRange', e.target.value)}
              >
                <option value="all">All Prices</option>
                <option value="budget">Budget</option>
                <option value="mid">Mid-Range</option>
                <option value="premium">Premium</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Sort By:</label>
              <select
                value={selectedFilters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              >
                <option value="popular">Most Popular</option>
                <option value="newest">Newest First</option>
                <option value="priceAsc">Price: Low to High</option>
                <option value="priceDesc">Price: High to Low</option>
              </select>
            </div>
          </motion.div>
        )}
      </div>

      <motion.div
        className={`categories-container ${viewMode}`}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {categories.map((category) => (
          <motion.div
            key={category.id}
            className="category-card"
            variants={itemVariants}
            whileHover={{ scale: 1.03 }}
          >
            <Link to={`/category/${category.id}`} className="category-link">
              <div className="category-image-container">
                <img src={category.image} alt={category.name} />
                {category.featured && <span className="featured-badge">Featured</span>}
              </div>
              <div className="category-info">
                <h3>{category.name}</h3>
                <p>{category.productCount} Products</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default Category; 