import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ProductReviews from './ProductReviews';
import './ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:5000/api/products/${id}`);
        if (!response.ok) {
          throw new Error('Product not found');
        }
        const data = await response.json();
        if (data.success === false) {
          throw new Error(data.message || 'Product not found');
        }
        setProduct(data.product);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    // Add to cart logic here
    console.log('Added to cart:', product);
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={i} className="star-filled">★</span>);
    }

    if (hasHalfStar) {
      stars.push(<span key="half" className="star-half">★</span>);
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<span key={`empty-${i}`} className="star-empty">★</span>);
    }

    return stars;
  };

  const getStockStatus = (stock) => {
    if (stock === 0) return { class: 'out-of-stock', text: 'Out of Stock' };
    if (stock <= 5) return { class: 'low-stock', text: `Low Stock (${stock} left)` };
    return { class: 'in-stock', text: 'In Stock' };
  };

  if (loading) {
    return (
      <div className="product-detail">
        <div className="product-detail-container">
          <div className="product-detail-loading">
            <div className="loading-spinner"></div>
            <p>Loading product details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="product-detail">
        <div className="product-detail-container">
          <div className="product-detail-error">
            <h2>Error</h2>
            <p>{error}</p>
            <Link to="/products" className="back-to-products">
              ← Back to Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-detail">
        <div className="product-detail-container">
          <div className="product-detail-error">
            <h2>Product Not Found</h2>
            <p>The product you're looking for doesn't exist.</p>
            <Link to="/products" className="back-to-products">
              ← Back to Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const stockStatus = getStockStatus(product.stock);

  return (
    <div className="product-detail">
      <div className="product-detail-container">
        {/* Breadcrumb */}
        <nav className="breadcrumb">
          <Link to="/">Home</Link>
          <span>›</span>
          <Link to="/products">Products</Link>
          <span>›</span>
          {product.categories && product.categories.length > 0 && (
            <>
              <span>{product.categories[0].name}</span>
              <span>›</span>
            </>
          )}
          <span>{product.name}</span>
        </nav>

        {/* Main Product Content */}
        <div className="product-detail-content">
          {/* Product Images */}
          <div className="product-images">
            <div className="main-image">
              <img 
                src={product.img_path || '/api/placeholder/500/500'} 
                alt={product.name}
                onError={(e) => {
                  e.target.src = '/api/placeholder/500/500';
                }}
              />
            </div>
          </div>

          {/* Product Information */}
          <div className="product-info">
            <h1 className="product-title">{product.name}</h1>

            {/* Rating Section */}
            <div className="product-rating-section">
              <div className="rating-stars">
                {renderStars(product.rating || 0)}
                <span className="rating-text">
                  {product.rating ? product.rating.toFixed(1) : '0.0'} out of 5
                </span>
              </div>
              {product.total_sold > 0 && (
                <div className="sold-count">
                  {product.total_sold} sold
                </div>
              )}
            </div>

            {/* Price Section */}
            <div className="price-section">
              <div className="current-price">
                {(typeof product.price === 'number' ? product.price : parseFloat(product.price || 0)).toLocaleString('vi-VN')} ₫
              </div>
            </div>

            {/* Product Details */}
            <div className="product-details-section">
              <div className="detail-item">
                <span className="detail-icon">🏷️</span>
                <span><strong>Category:</strong> {product.categories && product.categories.length > 0 ? product.categories[0].name : 'General'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-icon">🏭</span>
                <span><strong>Store:</strong> {product.store_name || 'Unknown Store'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-icon">👤</span>
                <span><strong>Seller:</strong> {product.seller_name || 'Unknown Seller'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-icon">📊</span>
                <span><strong>Stock Left:</strong> {product.stock}</span>
              </div>
              {product.categories && product.categories.length > 1 && (
                <div className="detail-item">
                  <span className="detail-icon">🎯</span>
                  <span><strong>All Categories:</strong> {product.categories.map(cat => cat.name).join(', ')}</span>
                </div>
              )}
            </div>

            {/* Stock Status */}
            <div className="stock-status">
              <span className={stockStatus.class}>
                {stockStatus.text}
              </span>
            </div>

            {/* Add to Cart Button */}
            <button 
              className="add-to-cart-btn"
              onClick={handleAddToCart}
              disabled={product.stock === 0 || !product.visible}
            >
              <span>🛒</span>
              {product.stock === 0 ? 'Out of Stock' : !product.visible ? 'Not Available' : 'Add to Cart'}
            </button>
          </div>
        </div>

        {/* Product Description */}
        <div className="product-description-section">
          <div className="description-container">
            <h3>Product Description</h3>
            <div className="description-content">
              <p>
                {product.description || 'No description available for this product.'}
              </p>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="reviews-section">
          <ProductReviews productId={product.product_id} />
        </div>
      </div>
    </div>
  );
};

export default ProductDetail; 