import React from 'react';
import { motion } from 'framer-motion';
import { FaShoppingCart, FaStar } from 'react-icons/fa';
import './styles.css';

const Product = ({ product }) => {
  const {
    name,
    description,
    price,
    img_path,
    stock,
    rating = 4.5, // Default rating if not provided
  } = product;

  return (
    <motion.div
      className="product-card"
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <div className="product-image">
        <img 
          src={img_path || 'https://via.placeholder.com/300'} 
          alt={name}
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/300';
          }}
        />
        {stock <= 5 && stock > 0 && (
          <div className="stock-warning">Only {stock} left!</div>
        )}
        {stock === 0 && (
          <div className="out-of-stock">Out of Stock</div>
        )}
      </div>

      <div className="product-info">
        <h3 className="product-name">{name}</h3>
        <div className="product-rating">
          {[...Array(5)].map((_, index) => (
            <FaStar
              key={index}
              className={index < Math.floor(rating) ? 'star-filled' : 'star-empty'}
            />
          ))}
          <span className="rating-value">({rating})</span>
        </div>
        <p className="product-description">{description}</p>
        <div className="product-footer">
          <span className="product-price">${price.toLocaleString()}</span>
          <motion.button
            className="add-to-cart-btn"
            whileTap={{ scale: 0.95 }}
            disabled={stock === 0}
          >
            <FaShoppingCart /> Add to Cart
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default Product; 