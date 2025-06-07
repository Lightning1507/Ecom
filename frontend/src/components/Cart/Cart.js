import React, { useState, useEffect, useContext, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiShoppingCart, FiPlus, FiMinus, FiTrash2, FiShoppingBag, FiCheck } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { CartContext } from '../../context/CartContext';
import './Cart.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const CLOUDINARY_CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;

const Cart = () => {
  const [carts, setCarts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingItems, setUpdatingItems] = useState(new Set());
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [selectedSellers, setSelectedSellers] = useState(new Set());
  
  const { user, isAuthenticated } = useContext(AuthContext);
  const { refreshCartCount } = useContext(CartContext);
  const navigate = useNavigate();

  // Helper function to get Cloudinary URL
  const getCloudinaryUrl = (imagePath) => {
    if (!imagePath) {
      return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/v1/default-product-image`;
    }
    
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${imagePath}`;
  };

  // Helper function to get auth token
  const getAuthToken = useCallback(() => {
    return user?.token || localStorage.getItem('token');
  }, [user?.token]);

  // Fetch cart items
  const fetchCartItems = useCallback(async () => {
    if (!isAuthenticated()) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const token = getAuthToken();
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/api/cart`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch cart items');
      }

      const data = await response.json();
      setCarts(data.carts || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching cart items:', err);
      setError(err.message || 'Failed to load cart items');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, getAuthToken]);

  useEffect(() => {
    fetchCartItems();
  }, [fetchCartItems]);

  // Selection handlers
  const toggleItemSelection = (productId) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const toggleSellerSelection = (sellerId) => {
    const seller = carts.find(cart => cart.seller_id === sellerId);
    if (!seller) return;

    const sellerItemIds = seller.items.map(item => item.product_id);
    const allSellerItemsSelected = sellerItemIds.every(id => selectedItems.has(id));

    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (allSellerItemsSelected) {
        // Deselect all items from this seller
        sellerItemIds.forEach(id => newSet.delete(id));
      } else {
        // Select all items from this seller
        sellerItemIds.forEach(id => newSet.add(id));
      }
      return newSet;
    });

    setSelectedSellers(prev => {
      const newSet = new Set(prev);
      if (allSellerItemsSelected) {
        newSet.delete(sellerId);
      } else {
        newSet.add(sellerId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    const allItemIds = carts.flatMap(cart => cart.items.map(item => item.product_id));
    const allSellerIds = carts.map(cart => cart.seller_id);
    
    setSelectedItems(new Set(allItemIds));
    setSelectedSellers(new Set(allSellerIds));
  };

  const deselectAll = () => {
    setSelectedItems(new Set());
    setSelectedSellers(new Set());
  };

  // Update item quantity
  const updateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 0) return;

    setUpdatingItems(prev => new Set(prev).add(productId));

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/api/cart/update`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productId,
          quantity: newQuantity
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update quantity');
      }

      // Refresh cart data
      await fetchCartItems();
      
      // Update cart count
      if (refreshCartCount) {
        refreshCartCount();
      }

    } catch (err) {
      console.error('Error updating quantity:', err);
      alert(err.message || 'Failed to update quantity');
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  // Remove item from cart
  const removeItem = async (productId) => {
    setUpdatingItems(prev => new Set(prev).add(productId));

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/api/cart/remove/${productId}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to remove item');
      }

      // Remove from selection if selected
      setSelectedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });

      // Refresh cart data
      await fetchCartItems();
      
      // Update cart count
      if (refreshCartCount) {
        refreshCartCount();
      }

    } catch (err) {
      console.error('Error removing item:', err);
      alert(err.message || 'Failed to remove item');
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  // Clear entire cart
  const clearCart = async () => {
    if (!window.confirm('Are you sure you want to clear your entire cart?')) {
      return;
    }

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/api/cart/clear`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to clear cart');
      }

      // Clear selections
      setSelectedItems(new Set());
      setSelectedSellers(new Set());

      // Refresh cart data
      await fetchCartItems();
      
      // Update cart count
      if (refreshCartCount) {
        refreshCartCount();
      }

    } catch (err) {
      console.error('Error clearing cart:', err);
      alert(err.message || 'Failed to clear cart');
    }
  };

  // Proceed to checkout with selected items
  const proceedToCheckout = () => {
    if (selectedItems.size === 0) {
      alert('Please select items to checkout');
      return;
    }

    // Store selected items in sessionStorage for checkout
    const selectedItemsData = carts.flatMap(cart => 
      cart.items.filter(item => selectedItems.has(item.product_id))
        .map(item => ({
          ...item,
          cart_id: cart.cart_id,
          seller_id: cart.seller_id,
          store_name: cart.store_name
        }))
    );

    sessionStorage.setItem('selectedItems', JSON.stringify(selectedItemsData));
    navigate('/checkout');
  };

  // Calculate totals for selected items
  const calculateSelectedTotals = () => {
    let totalItems = 0;
    let totalAmount = 0;

    carts.forEach(cart => {
      cart.items.forEach(item => {
        if (selectedItems.has(item.product_id)) {
          totalItems += item.quantity;
          totalAmount += item.total;
        }
      });
    });

    return { totalItems, totalAmount };
  };

  // Calculate totals for all items
  const calculateTotals = () => {
    let totalItems = 0;
    let totalAmount = 0;

    carts.forEach(cart => {
      cart.items.forEach(item => {
        totalItems += item.quantity;
        totalAmount += item.total;
      });
    });

    return { totalItems, totalAmount };
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Check if seller is fully selected
  const isSellerFullySelected = (sellerId) => {
    const seller = carts.find(cart => cart.seller_id === sellerId);
    if (!seller) return false;
    return seller.items.every(item => selectedItems.has(item.product_id));
  };

  if (!isAuthenticated()) {
    return (
      <div className="cart-container">
        <div className="cart-empty">
          <FiShoppingCart className="empty-cart-icon" />
          <h2>Please log in to view your cart</h2>
          <Link to="/login" className="login-link">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn btn-primary"
            >
              Log In
            </motion.button>
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="cart-container">
        <div className="cart-loading">
          <div className="loading-spinner"></div>
          <p>Loading your cart...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cart-container">
        <div className="cart-error">
          <h2>Error loading cart</h2>
          <p>{error}</p>
          <button onClick={fetchCartItems} className="btn btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const { totalItems, totalAmount } = calculateTotals();
  const { totalItems: selectedTotalItems, totalAmount: selectedTotalAmount } = calculateSelectedTotals();

  if (carts.length === 0 || totalItems === 0) {
    return (
      <div className="cart-container">
        <div className="cart-empty">
          <FiShoppingCart className="empty-cart-icon" />
          <h2>Your cart is empty</h2>
          <p>Looks like you haven't added anything to your cart yet.</p>
          <Link to="/products">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn btn-primary"
            >
              Continue Shopping
            </motion.button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <div className="cart-header">
        <h2><FiShoppingCart /> Shopping Cart</h2>
        <div className="cart-actions">
          <div className="selection-controls">
            <button onClick={selectAll} className="select-btn">
              Select All
            </button>
            <button onClick={deselectAll} className="select-btn">
              Deselect All
            </button>
          </div>
          <button onClick={clearCart} className="clear-cart-btn">
            <FiTrash2 /> Clear Cart
          </button>
        </div>
      </div>

      <div className="cart-content">
        <div className="cart-items">
          <AnimatePresence>
            {carts.map((cart) => (
              <motion.div
                key={cart.cart_id}
                className="seller-cart"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="seller-header">
                  <div className="seller-info">
                    <label className="seller-checkbox">
                      <input
                        type="checkbox"
                        checked={isSellerFullySelected(cart.seller_id)}
                        onChange={() => toggleSellerSelection(cart.seller_id)}
                      />
                      <span className="checkmark"></span>
                      <h3><FiShoppingBag /> {cart.store_name}</h3>
                    </label>
                  </div>
                  <span className="item-count">
                    {cart.items.length} item{cart.items.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="seller-items">
                  {cart.items.map((item) => (
                    <motion.div
                      key={item.product_id}
                      className={`cart-item ${selectedItems.has(item.product_id) ? 'selected' : ''}`}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <label className="item-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedItems.has(item.product_id)}
                          onChange={() => toggleItemSelection(item.product_id)}
                        />
                        <span className="checkmark"></span>
                      </label>

                      <img 
                        src={getCloudinaryUrl(item.img_path)} 
                        alt={item.name}
                        className="item-image"
                      />
                      
                      <div className="item-details">
                        <h4>{item.name}</h4>
                        <p className="item-price">{formatCurrency(item.price)}</p>
                        <p className="stock-info">Stock: {item.stock}</p>
                      </div>

                      <div className="quantity-controls">
                        <button
                          onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                          disabled={updatingItems.has(item.product_id) || item.quantity <= 1}
                          className="quantity-btn"
                        >
                          <FiMinus />
                        </button>
                        
                        <span className="quantity">{item.quantity}</span>
                        
                        <button
                          onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                          disabled={updatingItems.has(item.product_id) || item.quantity >= item.stock}
                          className="quantity-btn"
                        >
                          <FiPlus />
                        </button>
                      </div>

                      <div className="item-total">
                        <p>{formatCurrency(item.total)}</p>
                        <button
                          onClick={() => removeItem(item.product_id)}
                          disabled={updatingItems.has(item.product_id)}
                          className="remove-btn"
                        >
                          <FiTrash2 />
                        </button>
                      </div>

                      {updatingItems.has(item.product_id) && (
                        <div className="item-updating">
                          <div className="mini-spinner"></div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>

                <div className="seller-subtotal">
                  <span>Subtotal for {cart.store_name}: </span>
                  <span className="subtotal-amount">
                    {formatCurrency(cart.items.reduce((sum, item) => sum + item.total, 0))}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="cart-summary">
          <h3>Order Summary</h3>
          
          <div className="summary-section">
            <h4>All Items</h4>
            <div className="summary-row">
              <span>Total Items:</span>
              <span>{totalItems}</span>
            </div>
            <div className="summary-row">
              <span>Total Amount:</span>
              <span>{formatCurrency(totalAmount)}</span>
            </div>
          </div>

          {selectedItems.size > 0 && (
            <div className="summary-section selected-summary">
              <h4>Selected Items ({selectedItems.size})</h4>
              <div className="summary-row">
                <span>Selected Items:</span>
                <span>{selectedTotalItems}</span>
              </div>
              <div className="summary-row">
                <span>Subtotal:</span>
                <span>{formatCurrency(selectedTotalAmount)}</span>
              </div>
              <div className="summary-row">
                <span>Tax (10%):</span>
                <span>{formatCurrency(selectedTotalAmount * 0.1)}</span>
              </div>
              <div className="summary-row total">
                <span>Total:</span>
                <span>{formatCurrency(selectedTotalAmount + (selectedTotalAmount * 0.1))}</span>
              </div>
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="checkout-button"
            onClick={proceedToCheckout}
            disabled={selectedItems.size === 0}
          >
            {selectedItems.size > 0 
              ? `Checkout Selected Items (${selectedItems.size})` 
              : 'Select Items to Checkout'
            }
          </motion.button>

          <Link to="/products">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="continue-shopping-btn"
            >
              Continue Shopping
            </motion.button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Cart; 