import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { FiStar, FiShoppingCart } from 'react-icons/fi';
import ProductFilter from './ProductFilter';
import { useCart } from '../../hooks/useCart';
import './ProductsList.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
const CLOUDINARY_CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;

const ProductsList = () => {
  const { id: categoryId } = useParams();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const navigate = useNavigate();
  
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    category: 'all', // Will be set after fetching category name
    priceRange: 'all',
    rating: 'all',
    sortBy: 'popular',
    brand: 'all',
    availability: 'all'
  });

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterChangeKey, setFilterChangeKey] = useState(0); // For triggering animations
  const [categoryName, setCategoryName] = useState(null);
  const [addingToCart, setAddingToCart] = useState(new Set());
  const [successMessage, setSuccessMessage] = useState('');
  
  // Cart functionality
  const { addToCart, error: cartError } = useCart();

  // Handle add to cart
  const handleAddToCart = async (productId, event) => {
    event.stopPropagation(); // Prevent card click when clicking add to cart
    setAddingToCart(prev => new Set(prev).add(productId));
    
    try {
      const result = await addToCart(productId, 1);
      if (result.success) {
        setSuccessMessage('Item added to cart successfully!');
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error adding to cart:', err);
    } finally {
      setAddingToCart(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  // Handle product card click
  const handleProductClick = (productId) => {
    navigate(`/products/${productId}`);
  };

  const getCloudinaryUrl = (imagePath) => {
    if (!imagePath) {
      return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/v1/default-product-image`;
    }
    
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${imagePath}`;
  };

  // Fetch category name if categoryId is provided
  useEffect(() => {
    const fetchCategoryName = async () => {
      if (categoryId && categoryId !== 'all') {
        try {
          const response = await fetch(`${API_BASE_URL}/api/categories`, {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          }).catch(async () => {
            return await fetch('/api/categories', {
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              }
            });
          });

          if (response && response.ok) {
            const data = await response.json();
            const category = data.categories?.find(cat => cat.category_id === parseInt(categoryId));
            if (category) {
              setCategoryName(category.name);
              setFilters(prev => ({
                ...prev,
                category: category.name.toLowerCase()
              }));
            }
          }
        } catch (err) {
          console.error('Error fetching category:', err);
        }
      }
    };

    fetchCategoryName();
  }, [categoryId]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        console.log('Fetching products...');
        // Try direct URL first
        const response = await fetch(`${API_BASE_URL}/api/products`, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }).catch(async () => {
          console.log('Direct fetch failed, trying proxy...');
          // If direct fetch fails, try with proxy
          return await fetch('/api/products', {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });
        });

        if (!response) {
          throw new Error('Network response was not ok');
        }

        console.log('Response status:', response.status);
        
        if (response.status === 404) {
          throw new Error('API endpoint not found. Please check if the backend server is running.');
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Received non-JSON response from server');
        }

        const data = await response.json();
        console.log('Response data:', data);

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch products');
        }

        // Handle both array and object responses
        const productsData = Array.isArray(data) ? data : data.products;
        
        if (!Array.isArray(productsData)) {
          console.error('Invalid products data:', data);
          throw new Error('Invalid products data received');
        }

        // Transform the data to match the Product component's expected format
        const transformedProducts = productsData.map(product => ({
          id: product.product_id || product.id,
          name: product.name || 'Unnamed Product',
          description: product.description || '',
          price: parseFloat(product.price) || 0,
          img_path: getCloudinaryUrl(product.img_path),
          stock: parseInt(product.stock, 10) || 0,
          rating: product.rating || 0,
          total_sold: parseInt(product.total_sold, 10) || 0, // Include total sold count
          category: product.category || 'uncategorized', // Include category from API
          brand: product.brand || 'Unknown Brand', // Include brand from API
          categories: product.categories || [] // Include full categories array
        }));

        setProducts(transformedProducts);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError(err.message || 'An error occurred while fetching products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Trigger animation when filters change
  useEffect(() => {
    setFilterChangeKey(prev => prev + 1);
  }, [filters, searchQuery]);

  const filterProducts = (products) => {
    return products.filter(product => {
      // Search filter - check name, description, brand, and category
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          product.name.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query) ||
          product.brand.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query) ||
          (product.categories && product.categories.some(cat => 
            cat.name.toLowerCase().includes(query)
          ));
        
        if (!matchesSearch) {
          return false;
        }
      }

      // Category filter - more flexible matching
      if (filters.category !== 'all') {
        const productCategories = product.categories || [];
        const hasMatchingCategory = productCategories.some(cat => 
          cat.name.toLowerCase() === filters.category.toLowerCase()
        ) || product.category.toLowerCase() === filters.category.toLowerCase();
        
        if (!hasMatchingCategory) {
          return false;
        }
      }

      // Price range filter
      if (filters.priceRange !== 'all') {
        if (filters.priceRange.endsWith('+')) {
          // Handle "50000000+" format
          const min = parseInt(filters.priceRange.replace('+', ''));
          if (product.price < min) return false;
        } else {
          // Handle "min-max" format
          const [min, max] = filters.priceRange.split('-').map(Number);
          if (max && (product.price < min || product.price > max)) return false;
          if (!max && product.price < min) return false;
        }
      }

      // Rating filter
      if (filters.rating !== 'all') {
        const minRating = parseInt(filters.rating.replace('+', ''));
        if (product.rating < minRating) return false;
      }

      // Brand filter - exact match
      if (filters.brand !== 'all' && product.brand !== filters.brand) {
        return false;
      }

      // Availability filter
      if (filters.availability !== 'all') {
        if (filters.availability === 'in-stock' && product.stock <= 0) return false;
        if (filters.availability === 'out-of-stock' && product.stock > 0) return false;
      }

      return true;
    });
  };

  const sortProducts = (products) => {
    const sortedProducts = [...products];
    switch (filters.sortBy) {
      case 'price-asc':
        return sortedProducts.sort((a, b) => a.price - b.price);
      case 'price-desc':
        return sortedProducts.sort((a, b) => b.price - a.price);
      case 'rating-desc':
        return sortedProducts.sort((a, b) => b.rating - a.rating);
      case 'newest':
        return sortedProducts.reverse(); // Assuming the original array is in chronological order
      default: // 'popular'
        return sortedProducts;
    }
  };

  const filteredAndSortedProducts = sortProducts(filterProducts(products));

  // Debug: Log current filtering state
  useEffect(() => {
    if (categoryId && products.length > 0) {
      console.log('=== CATEGORY FILTERING DEBUG ===');
      console.log('Category ID from URL:', categoryId);
      console.log('Category Name:', categoryName);
      console.log('Current filter.category:', filters.category);
      console.log('Total products:', products.length);
      console.log('Filtered products:', filteredAndSortedProducts.length);
      console.log('Sample product categories:', products.slice(0, 3).map(p => ({
        name: p.name,
        category: p.category,
        categories: p.categories
      })));
    }
  }, [categoryId, categoryName, filters.category, products, filteredAndSortedProducts]);

  if (loading) {
    return (
      <div className="products-loading">
        <div className="loading-spinner"></div>
        <p>Loading products...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="products-error">
        <h2>Error loading products</h2>
        <p>{error}</p>
        <div className="error-actions">
          <button 
            onClick={() => window.location.reload()}
            className="retry-button"
          >
            Try Again
          </button>
          <p className="error-help">
            Make sure the backend server is running on port 5000
          </p>
        </div>
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="products-empty">
        <h2>No products available</h2>
        <p>Check back later for new products!</p>
      </div>
    );
  }

  return (
    <div className="products-container">
      <div className="products-page">
        {!searchQuery && !categoryName && (
          <h1 className="products-title">All Products</h1>
        )}
        
        {/* Success Message */}
        {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="success-message"
          style={{
            background: '#d4edda',
            color: '#155724',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1rem',
            border: '1px solid #c3e6cb'
          }}
        >
          {successMessage}
        </motion.div>
      )}

      {/* Error Message */}
      {cartError && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="error-message"
          style={{
            background: '#f8d7da',
            color: '#721c24',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1rem',
            border: '1px solid #f5c6cb'
          }}
        >
          {cartError}
        </motion.div>
      )}

      {/* Show search query if present */}
      {searchQuery && (
        <div className="search-results-header">
          <h2>Search Results for "{searchQuery}"</h2>
          <p>{filteredAndSortedProducts.length} product{filteredAndSortedProducts.length !== 1 ? 's' : ''} found</p>
        </div>
      )}

      {/* Show category header if viewing a specific category */}
      {categoryName && !searchQuery && (
        <div className="category-results-header">
          <h2>{categoryName}</h2>
          <p>{filteredAndSortedProducts.length} product{filteredAndSortedProducts.length !== 1 ? 's' : ''} in this category</p>
        </div>
      )}

      <ProductFilter
        filters={filters}
        setFilters={setFilters}
        isOpen={isFilterOpen}
        onToggle={() => setIsFilterOpen(!isFilterOpen)}
      />

      <div className="products-results">
        <motion.p 
          key={`results-${filterChangeKey}`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="results-count"
        >
          {!searchQuery && !categoryName && `${filteredAndSortedProducts.length} product${filteredAndSortedProducts.length !== 1 ? 's' : ''} found`}
        </motion.p>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={filterChangeKey}
          className="products-grid"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ 
            duration: 0.3,
            staggerChildren: 0.05
          }}
        >
          {filteredAndSortedProducts.map((product, index) => (
            <motion.div
              key={product.id}
              className="product-card"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              transition={{ 
                duration: 0.3,
                delay: index * 0.05,
                ease: "easeOut"
              }}
              whileHover={{ 
                y: -5,
                scale: 1.02,
                transition: { duration: 0.2 }
              }}
              layout
              onClick={() => handleProductClick(product.id)}
              style={{ cursor: 'pointer' }}
            >
              <div className="product-image">
                <img src={product.img_path} alt={product.name} />
                {product.stock <= 0 && (
                  <div className="out-of-stock-badge">Out of Stock</div>
                )}
                {product.stock > 0 && product.stock <= 5 && (
                  <div className="low-stock-badge">Only {product.stock} left</div>
                )}
              </div>
              <div className="product-info">
                <h3>{product.name}</h3>
                <p className="product-brand">{product.brand}</p>
                <div className="product-details">
                  <span className="price">
                    {new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                    }).format(product.price)}
                  </span>
                  <span className="rating">
                    <FiStar /> {product.rating}
                  </span>
                </div>
                <div className="product-sold">
                  <span className="sold-count">{product.total_sold || 0} sold</span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`add-to-cart-button ${product.stock <= 0 ? 'disabled' : ''}`}
                  disabled={product.stock <= 0 || addingToCart.has(product.id)}
                  onClick={(event) => handleAddToCart(product.id, event)}
                >
                  <FiShoppingCart /> 
                  {addingToCart.has(product.id) 
                    ? 'Adding...' 
                    : product.stock <= 0 
                      ? 'Out of Stock' 
                      : 'Add to Cart'}
                </motion.button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      {filteredAndSortedProducts.length === 0 && !loading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="no-results"
        >
          <h3>
            {searchQuery 
              ? `No products found matching "${searchQuery}"` 
              : 'No products match your filters'
            }
          </h3>
          <p>
            {searchQuery 
              ? 'Try adjusting your search terms or browse our categories' 
              : 'Try adjusting your search criteria'
            }
          </p>
          <button 
            onClick={() => {
              setFilters({
                category: 'all',
                priceRange: 'all',
                rating: 'all',
                sortBy: 'popular',
                brand: 'all',
                availability: 'all'
              });
              if (searchQuery) {
                window.location.href = '/products';
              }
            }}
            className="clear-filters-btn"
          >
            {searchQuery ? 'View All Products' : 'Clear All Filters'}
          </button>
        </motion.div>
      )}
      </div>
    </div>
  );
};

export default ProductsList;