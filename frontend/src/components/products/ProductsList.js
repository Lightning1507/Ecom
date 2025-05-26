import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Product from './Product';
import './ProductsList.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
const CLOUDINARY_CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;

const ProductsList = () => {
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
      <h1 className="products-title">Our Products</h1>
      <motion.div 
        className="products-grid"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {products.map((product) => (
          <Product 
            key={product.id} 
            product={product} 
          />
        ))}
      </motion.div>
    </div>
  );
};

export default ProductsList;