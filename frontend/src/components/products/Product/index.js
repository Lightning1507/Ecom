import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaShoppingCart, FaStar } from 'react-icons/fa';
import { useCart } from '../../../hooks/useCart';
import './styles.css';

const Product = ({ product }) => {
  const {
    id,
    name,
    description,
    price,
    img_path,
    stock,
    rating, // Real rating from database
    total_sold, // Total units sold
  } = product;

  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const { addToCart } = useCart();

  const handleAddToCart = async () => {
    setIsAddingToCart(true);
    try {
      await addToCart(id, 1);
    } catch (err) {
      console.error('Error adding to cart:', err);
    } finally {
      setIsAddingToCart(false);
    }
  };

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
              className={index < Math.floor(rating || 0) ? 'star-filled' : 'star-empty'}
            />
          ))}
          <span className="rating-value">
            ({rating ? rating.toFixed(1) : 'No reviews yet'})
          </span>
        </div>
        <div className="product-sold">
          <span className="sold-count">{total_sold || 0} sold</span>
        </div>
        <p className="product-description">{description}</p>
        <div className="product-footer">
          <span className="product-price">
            {new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            }).format(price)}
          </span>
          <motion.button
            className="add-to-cart-btn"
            whileTap={{ scale: 0.95 }}
            disabled={stock === 0 || isAddingToCart}
            onClick={handleAddToCart}
          >
            <FaShoppingCart /> 
            {isAddingToCart ? 'Adding...' : stock === 0 ? 'Out of Stock' : 'Add to Cart'}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default Product; 