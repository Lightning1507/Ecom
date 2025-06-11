import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaShoppingCart, FaStar, FaArrowLeft, FaStore, FaTag, FaBox } from 'react-icons/fa';
import { useCart } from '../../hooks/useCart';
import ProductReviews from './ProductReviews';
import './ProductDetail.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/products/${id}`);
        
        if (!response.ok) {
          throw new Error('Product not found');
        }
        
        const data = await response.json();
        if (data.product) {
          setProduct(data.product);
          setSelectedImage(data.product.img_path);
        } else {
          throw new Error('Product data not found');
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  const handleAddToCart = async () => {
    setIsAddingToCart(true);
    try {
      await addToCart(product.product_id, 1);
    } catch (err) {
      console.error('Error adding to cart:', err);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  if (loading) {
    return (
      <div className="product-detail-loading">
        <div className="loading-spinner"></div>
        <p>Loading product details...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-detail-error">
        <h2>Product not found</h2>
        <p>{error || 'The product you are looking for does not exist.'}</p>
        <Link to="/products" className="back-to-products">
          <FaArrowLeft /> Back to Products
        </Link>
      </div>
    );
  }

  return (
    <div className="product-detail">
      <div className="product-detail-container">
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/products">Products</Link>
          <span>/</span>
          <span>{product.name}</span>
        </div>

        {/* Product Info Section */}
        <div className="product-detail-content">
          {/* Product Images */}
          <div className="product-images">
            <div className="main-image">
              <img
                src={selectedImage || 'https://via.placeholder.com/500'}
                alt={product.name}
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/500';
                }}
              />
            </div>
          </div>

          {/* Product Information */}
          <div className="product-info">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="product-title">{product.name}</h1>
              
              {/* Rating and Reviews */}
              <div className="product-rating-section">
                <div className="rating-stars">
                  {[...Array(5)].map((_, index) => (
                    <FaStar
                      key={index}
                      className={index < Math.floor(product.rating || 0) ? 'star-filled' : 'star-empty'}
                    />
                  ))}
                  <span className="rating-text">
                    ({product.rating ? product.rating.toFixed(1) : '0'}) 
                  </span>
                </div>
                <div className="sold-count">
                  <span>{product.total_sold || 0} sold</span>
                </div>
              </div>

              {/* Price */}
              <div className="price-section">
                <span className="current-price">{formatPrice(product.price)}</span>
              </div>

              {/* Product Details */}
              <div className="product-details-section">
                <div className="detail-item">
                  <FaStore className="detail-icon" />
                  <span>Store: {product.store_name || 'Unknown Store'}</span>
                </div>
                
                {product.categories && product.categories.length > 0 && (
                  <div className="detail-item">
                    <FaTag className="detail-icon" />
                    <span>Category: {product.categories.map(cat => cat.name || cat).join(', ')}</span>
                  </div>
                )}
                
                <div className="detail-item">
                  <FaBox className="detail-icon" />
                  <span>Stock: {product.stock} items available</span>
                </div>
              </div>

              {/* Stock Status */}
              <div className="stock-status">
                {product.stock <= 0 ? (
                  <span className="out-of-stock">Out of Stock</span>
                ) : product.stock <= 5 ? (
                  <span className="low-stock">Only {product.stock} left in stock!</span>
                ) : (
                  <span className="in-stock">In Stock</span>
                )}
              </div>

              {/* Add to Cart Button */}
              <motion.button
                className="add-to-cart-btn"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={product.stock <= 0 || isAddingToCart}
                onClick={handleAddToCart}
              >
                <FaShoppingCart />
                {isAddingToCart ? 'Adding...' : product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
              </motion.button>
            </motion.div>
          </div>
        </div>

        {/* Product Description - Full Width */}
        {product.description && (
          <motion.div
            className="product-description-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="description-container">
              <h3>Product Description</h3>
              <div className="description-content">
                <p>{product.description}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Reviews Section */}
        <div className="reviews-section">
          <ProductReviews productId={product.product_id} />
        </div>
      </div>
    </div>
  );
};

export default ProductDetail; 