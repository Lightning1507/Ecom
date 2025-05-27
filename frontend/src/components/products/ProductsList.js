import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { FiStar, FiShoppingCart } from 'react-icons/fi';
import ProductFilter from './ProductFilter';
import './ProductsList.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
const CLOUDINARY_CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;

const ProductsList = () => {
  const { id: categoryId } = useParams();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    category: categoryId || 'all',
    priceRange: 'all',
    rating: 'all',
    sortBy: 'popular',
    brand: 'all',
    availability: 'all'
  });

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
          rating: product.rating || 4.5
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

  const filterProducts = (products) => {
    return products.filter(product => {
      // Category filter
      if (filters.category !== 'all' && product.category !== filters.category) {
        return false;
      }

      // Price range filter
      if (filters.priceRange !== 'all') {
        const [min, max] = filters.priceRange.split('-').map(Number);
        if (max) {
          if (product.price < min || product.price > max) return false;
        } else {
          if (product.price < min) return false;
        }
      }

      // Rating filter
      if (filters.rating !== 'all') {
        const minRating = parseInt(filters.rating);
        if (product.rating < minRating) return false;
      }

      // Brand filter
      if (filters.brand !== 'all' && product.brand !== filters.brand) {
        return false;
      }

      // Availability filter
      if (filters.availability !== 'all') {
        if (filters.availability === 'in-stock' && !product.stock) return false;
        if (filters.availability === 'out-of-stock' && product.stock) return false;
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
    <div className="products-page">
      <ProductFilter
        filters={filters}
        setFilters={setFilters}
        isOpen={isFilterOpen}
        onToggle={() => setIsFilterOpen(!isFilterOpen)}
      />

      <AnimatePresence>
        <motion.div
          className="products-grid"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {filteredAndSortedProducts.map(product => (
            <motion.div
              key={product.id}
              className="product-card"
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              whileHover={{ y: -5 }}
            >
              <div className="product-image">
                <img src={product.img_path} alt={product.name} />
                {!product.stock && (
                  <div className="out-of-stock-badge">Out of Stock</div>
                )}
              </div>
              <div className="product-info">
                <h3>{product.name}</h3>
                <div className="product-details">
                  <span className="price">${product.price.toFixed(2)}</span>
                  <span className="rating">
                    <FiStar /> {product.rating}
                  </span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="add-to-cart-button"
                  disabled={!product.stock}
                >
                  <FiShoppingCart /> Add to Cart
                </motion.button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default ProductsList;