import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiTrash2, FiMinus, FiPlus, FiShoppingBag } from 'react-icons/fi';
import './Cart.css';

const Cart = () => {
  // Sample cart data - in a real app, this would come from a cart context or Redux store
  const [cartItems, setCartItems] = useState([
    {
      id: 1,
      name: 'Wireless Headphones',
      price: 99.99,
      quantity: 1,
      image: 'https://via.placeholder.com/100',
    },
    {
      id: 2,
      name: 'Smartphone Case',
      price: 24.99,
      quantity: 2,
      image: 'https://via.placeholder.com/100',
    },
  ]);

  const updateQuantity = (id, change) => {
    setCartItems(cartItems.map(item => {
      if (item.id === id) {
        const newQuantity = Math.max(1, item.quantity + change);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const removeItem = (id) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.1; // 10% tax
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  return (
    <motion.div
      className="cart-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="cart-header">
        <h2><FiShoppingBag /> Shopping Cart</h2>
        <span className="item-count">{cartItems.length} items</span>
      </div>

      {cartItems.length === 0 ? (
        <div className="empty-cart">
          <FiShoppingBag size={48} />
          <p>Your cart is empty</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="continue-shopping"
          >
            Continue Shopping
          </motion.button>
        </div>
      ) : (
        <>
          <div className="cart-items">
            {cartItems.map(item => (
              <motion.div
                key={item.id}
                className="cart-item"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <img src={item.image} alt={item.name} className="item-image" />
                <div className="item-details">
                  <h3>{item.name}</h3>
                  <p className="item-price">${item.price.toFixed(2)}</p>
                </div>
                <div className="quantity-controls">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => updateQuantity(item.id, -1)}
                  >
                    <FiMinus />
                  </motion.button>
                  <span>{item.quantity}</span>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => updateQuantity(item.id, 1)}
                  >
                    <FiPlus />
                  </motion.button>
                </div>
                <p className="item-total">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="remove-button"
                  onClick={() => removeItem(item.id)}
                >
                  <FiTrash2 />
                </motion.button>
              </motion.div>
            ))}
          </div>

          <div className="cart-summary">
            <div className="summary-row">
              <span>Subtotal</span>
              <span>${calculateSubtotal().toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Tax (10%)</span>
              <span>${calculateTax().toFixed(2)}</span>
            </div>
            <div className="summary-row total">
              <span>Total</span>
              <span>${calculateTotal().toFixed(2)}</span>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="checkout-button"
            >
              Proceed to Checkout
            </motion.button>
          </div>
        </>
      )}
    </motion.div>
  );
};

export default Cart; 