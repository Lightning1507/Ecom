import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiGrid, FiList, FiFilter, FiChevronDown } from 'react-icons/fi';
import './Category.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const getCategoryIcon = (categoryName) => {
  const icons = {
    // English terms
    'electronics': '💻',
    'clothing': '👕',
    'books': '📚',
    'home': '🏠',
    'kitchen': '🍳',
    'sports': '⚽',
    'outdoors': '🏕️',
    'beauty': '💄',
    'personal care': '🧴',
    'gaming': '🎮',
    'accessories': '🎧',
    'toys': '🧸',
    'automotive': '🚗',
    'jewelry': '💍',
    'health': '💊',
    'fitness': '🏋️',
    'music': '🎵',
    'movies': '🎬',
    'food': '🍕',
    'beverages': '🥤',
    
    // Vietnamese terms
    'điện tử': '💻',
    'công nghệ': '💻',
    'máy tính': '💻',
    'laptop': '💻',
    'điện thoại': '📱',
    'smartphone': '📱',
    'thời trang': '👕',
    'quần áo': '👕',
    'áo': '👕',
    'quần': '👖',
    'giày': '👟',
    'sách': '📚',
    'học tập': '📚',
    'giáo dục': '📚',
    'nhà cửa': '🏠',
    'nội thất': '🏠',
    'gia đình': '🏠',
    'nhà bếp': '🍳',
    'bếp': '🍳',
    'nấu ăn': '🍳',
    'thể thao': '⚽',
    'thể dục': '🏋️',
    'gym': '🏋️',
    'làm đẹp': '💄',
    'mỹ phẩm': '💄',
    'chăm sóc': '🧴',
    'sức khỏe': '💊',
    'y tế': '💊',
    'thuốc': '💊',
    'game': '🎮',
    'trò chơi': '🎮',
    'phụ kiện': '🎧',
    'đồ chơi': '🧸',
    'ô tô': '🚗',
    'xe hơi': '🚗',
    'trang sức': '💍',
    'nhẫn': '💍',
    'âm nhạc': '🎵',
    'nhạc': '🎵',
    'phim': '🎬',
    'thực phẩm': '🍕',
    'đồ ăn': '🍕',
    'món ăn': '🍕',
    'đồ uống': '🥤',
    'nước': '🥤',
    'cafe': '☕',
    'cà phê': '☕',
    'trà': '🍵',
    'bánh': '🧁',
    'kẹo': '🍬',
    'snack': '🍿',
    'văn phòng phẩm': '📝',
    'học liệu': '📚',
    'túi xách': '👜',
    'balo': '🎒',
    'đồng hồ': '⌚',
    'kính': '👓'
  };
  
  const key = categoryName.toLowerCase().trim();
  
  // Direct match first
  if (icons[key]) {
    return icons[key];
  }
  
  // Check if category name contains any of the keywords
  for (const [keyword, icon] of Object.entries(icons)) {
    if (key.includes(keyword) || keyword.includes(key)) {
      return icon;
    }
  }
  
  // Default fallback
  return '🛍️';
};

const Category = () => {
  const [viewMode, setViewMode] = useState('grid');
  const [selectedFilters, setSelectedFilters] = useState({
    priceRange: 'all',
    sortBy: 'popular',
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        console.log('Fetching categories...');
        
        // Try direct URL first
        const response = await fetch(`${API_BASE_URL}/api/categories/with-counts`, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }).catch(async () => {
          console.log('Direct fetch failed, trying proxy...');
          // If direct fetch fails, try with proxy
          return await fetch('/api/categories/with-counts', {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });
        });

        if (!response || !response.ok) {
          throw new Error('Failed to fetch categories');
        }

        const data = await response.json();
        console.log('Categories response:', data);

        if (data.success && data.categories) {
          setCategories(data.categories);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError(err.message || 'Failed to load categories');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const toggleFilter = () => {
    setIsFilterOpen(!isFilterOpen);
  };

  const handleFilterChange = (filterType, value) => {
    setSelectedFilters({
      ...selectedFilters,
      [filterType]: value,
    });
  };

  // Filter and sort categories based on selected filters
  const filteredCategories = categories.filter(category => {
    if (selectedFilters.priceRange !== 'all') {
      // This would need more complex filtering based on product price ranges
      // For now, we'll show all categories
    }
    return true;
  }).sort((a, b) => {
    switch (selectedFilters.sortBy) {
      case 'newest':
        return b.id - a.id; // Assuming higher ID means newer
      case 'priceAsc':
        return a.productCount - b.productCount;
      case 'priceDesc':
        return b.productCount - a.productCount;
      default: // 'popular'
        return b.productCount - a.productCount; // Sort by product count
    }
  });

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

  if (loading) {
    return (
      <div className="category-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading categories...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="category-page">
        <div className="error-container">
          <h2>Error Loading Categories</h2>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="retry-button"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

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
              <label>Sort By:</label>
              <select
                value={selectedFilters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              >
                <option value="popular">Most Popular</option>
                <option value="newest">Newest First</option>
                <option value="priceAsc">Fewest Products</option>
                <option value="priceDesc">Most Products</option>
              </select>
            </div>
          </motion.div>
        )}
      </div>

      {filteredCategories.length === 0 ? (
        <div className="no-categories">
          <h3>No categories found</h3>
          <p>Categories will appear here once they are added to the system.</p>
        </div>
      ) : (
        <motion.div
          className={`categories-container ${viewMode}`}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {filteredCategories.map((category) => (
            <motion.div
              key={category.id}
              className="category-card"
              variants={itemVariants}
              whileHover={{ scale: 1.03 }}
            >
              <Link to={`/category/${category.id}`} className="category-link">
                <div className="category-icon-container">
                  <div className="category-icon">
                    <span className="category-emoji">{getCategoryIcon(category.name)}</span>
                  </div>
                  {category.featured && <span className="featured-badge">Featured</span>}
                </div>
                <div className="category-info">
                  <h3>{category.name}</h3>
                  <p>{category.productCount} Product{category.productCount !== 1 ? 's' : ''}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default Category; 