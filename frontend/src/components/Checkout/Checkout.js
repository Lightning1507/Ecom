import React, { useState, useEffect, useContext, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FiCreditCard, FiTruck, FiUser, FiShoppingBag, FiCheck } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { CartContext } from '../../context/CartContext';
import './Checkout.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const CLOUDINARY_CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;

const Checkout = () => {
  const [checkoutData, setCheckoutData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [shippingAddress, setShippingAddress] = useState('');
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderResult, setOrderResult] = useState(null);
  
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

  // Fetch checkout summary
  useEffect(() => {
    const fetchCheckoutSummary = async () => {
      if (!isAuthenticated()) {
        navigate('/login');
        return;
      }

      try {
        setLoading(true);
        
        // Check if we have selected items from cart
        const selectedItemsData = sessionStorage.getItem('selectedItems');
        if (selectedItemsData) {
          // Use selected items for checkout
          const selectedItems = JSON.parse(selectedItemsData);
          
          if (selectedItems.length === 0) {
            throw new Error('No items selected for checkout');
          }

          // Group items by seller
          const ordersBySeller = {};
          let totalAmount = 0;

          selectedItems.forEach(item => {
            if (!ordersBySeller[item.seller_id]) {
              ordersBySeller[item.seller_id] = {
                seller_id: item.seller_id,
                store_name: item.store_name,
                items: [],
                subtotal: 0
              };
            }
            
            ordersBySeller[item.seller_id].items.push({
              product_id: item.product_id,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              img_path: item.img_path,
              stock: item.stock,
              total: item.total
            });
            
            ordersBySeller[item.seller_id].subtotal += item.total;
            totalAmount += item.total;
          });

          // Get user information
          const token = getAuthToken();
          if (!token) {
            throw new Error('No authentication token found');
          }

          const userResponse = await fetch(`${API_BASE_URL}/api/dashboard/user/profile`, {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });

          if (!userResponse.ok) {
            throw new Error('Failed to fetch user information');
          }

          const userData = await userResponse.json();

          // Calculate tax (10%)
          const tax = totalAmount * 0.1;
          const grandTotal = totalAmount + tax;

          setCheckoutData({
            success: true,
            user: {
              full_name: userData.profile.name,
              email: userData.profile.email,
              phone: userData.profile.phone,
              address: userData.profile.location
            },
            ordersBySeller: Object.values(ordersBySeller),
            summary: {
              subtotal: totalAmount,
              tax: tax,
              total: grandTotal,
              itemCount: selectedItems.length
            }
          });

          setShippingAddress(userData.profile.location || '');
          setError(null);
        } else {
          // Fallback to regular checkout summary API
          const token = getAuthToken();
          
          if (!token) {
            throw new Error('No authentication token found');
          }

          const response = await fetch(`${API_BASE_URL}/api/payment/checkout/summary`, {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch checkout summary');
          }

          const data = await response.json();
          setCheckoutData(data);
          setShippingAddress(data.user.address || '');
          setError(null);
        }
      } catch (err) {
        console.error('Error fetching checkout summary:', err);
        setError(err.message || 'Failed to load checkout information');
        
        // If cart is empty, redirect to cart
        if (err.message.includes('empty') || err.message.includes('No items selected')) {
          setTimeout(() => navigate('/cart'), 2000);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCheckoutSummary();
  }, [isAuthenticated, navigate, user, getAuthToken]);

  // Process checkout
  const handleCheckout = async () => {
    if (!paymentMethod) {
      setError('Please select a payment method');
      return;
    }

    if (!shippingAddress.trim()) {
      setError('Please enter a shipping address');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Get selected items from sessionStorage
      const selectedItemsData = sessionStorage.getItem('selectedItems');
      const selectedItems = selectedItemsData ? JSON.parse(selectedItemsData) : null;

      const response = await fetch(`${API_BASE_URL}/api/payment/checkout`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          paymentMethod,
          shippingAddress: shippingAddress.trim(),
          selectedItems
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to process checkout');
      }

      // Success
      setOrderResult(data);
      setOrderComplete(true);
      
      // Clear selected items from sessionStorage
      sessionStorage.removeItem('selectedItems');
      
      // Refresh cart count
      if (refreshCartCount) {
        refreshCartCount();
      }

    } catch (err) {
      console.error('Error processing checkout:', err);
      setError(err.message || 'Failed to process payment');
    } finally {
      setProcessing(false);
    }
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

  if (!isAuthenticated()) {
    return (
      <div className="checkout-container">
        <div className="checkout-error">
          <h2>Authentication Required</h2>
          <p>Please log in to proceed with checkout.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="checkout-container">
        <div className="checkout-loading">
          <div className="loading-spinner"></div>
          <p>Loading checkout information...</p>
        </div>
      </div>
    );
  }

  if (error && !checkoutData) {
    return (
      <div className="checkout-container">
        <div className="checkout-error">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/cart')} className="btn btn-primary">
            Return to Cart
          </button>
        </div>
      </div>
    );
  }

  if (orderComplete && orderResult) {
    return (
      <div className="checkout-container">
        <motion.div
          className="order-success"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <FiCheck className="success-icon" />
          <h2>Order Placed Successfully!</h2>
          <p>Thank you for your purchase. Your order has been confirmed.</p>
          
          <div className="order-summary">
            <h3>Order Details</h3>
            <p><strong>Order Count:</strong> {orderResult.orderCount} order(s)</p>
            <p><strong>Total Amount:</strong> {formatCurrency(orderResult.totalAmount)}</p>
            <p><strong>Payment Method:</strong> {orderResult.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Bank Transfer'}</p>
          </div>

          <div className="order-actions">
            <button onClick={() => navigate('/orders')} className="btn btn-primary">
              View My Orders
            </button>
            <button onClick={() => navigate('/products')} className="btn btn-secondary">
              Continue Shopping
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      <div className="checkout-header">
        <h2><FiShoppingBag /> Checkout</h2>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="checkout-content">
        {/* Order Summary */}
        <div className="order-summary-section">
          <h3><FiShoppingBag /> Order Summary</h3>
          
          {checkoutData?.ordersBySeller.map((sellerOrder, index) => (
            <div key={index} className="seller-order">
              <h4>From: {sellerOrder.store_name}</h4>
              
              {sellerOrder.items.map((item) => (
                <div key={item.product_id} className="checkout-item">
                  <img 
                    src={getCloudinaryUrl(item.img_path)} 
                    alt={item.name} 
                    className="item-image"
                  />
                  <div className="item-details">
                    <h5>{item.name}</h5>
                    <p>Quantity: {item.quantity}</p>
                    <p className="item-price">{formatCurrency(item.price)}</p>
                  </div>
                  <div className="item-total">
                    {formatCurrency(item.total)}
                  </div>
                </div>
              ))}
              
              <div className="seller-subtotal">
                <strong>Subtotal: {formatCurrency(sellerOrder.subtotal)}</strong>
              </div>
            </div>
          ))}

          <div className="final-summary">
            <div className="summary-row">
              <span>Subtotal:</span>
              <span>{formatCurrency(checkoutData?.summary.subtotal || 0)}</span>
            </div>
            <div className="summary-row">
              <span>Tax (10%):</span>
              <span>{formatCurrency(checkoutData?.summary.tax || 0)}</span>
            </div>
            <div className="summary-row total">
              <span>Total:</span>
              <span>{formatCurrency(checkoutData?.summary.total || 0)}</span>
            </div>
          </div>
        </div>

        {/* Payment & Shipping Form */}
        <div className="payment-section">
          {/* Shipping Information */}
          <div className="shipping-info">
            <h3><FiTruck /> Shipping Information</h3>
            
            <div className="user-info">
              <p><FiUser /> <strong>{checkoutData?.user.full_name || checkoutData?.user.email}</strong></p>
              <p>Email: {checkoutData?.user.email}</p>
              {checkoutData?.user.phone && <p>Phone: {checkoutData?.user.phone}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="shippingAddress">Shipping Address *</label>
              <textarea
                id="shippingAddress"
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                placeholder="Enter your complete shipping address"
                rows={3}
                required
              />
            </div>
          </div>

          {/* Payment Method */}
          <div className="payment-method">
            <h3><FiCreditCard /> Payment Method</h3>
            
            <div className="payment-options">
              <label className="payment-option">
                <input
                  type="radio"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <div className="option-content">
                  <FiTruck className="option-icon" />
                  <div>
                    <strong>Cash on Delivery (COD)</strong>
                    <p>Pay when you receive your order</p>
                  </div>
                </div>
              </label>

              <label className="payment-option">
                <input
                  type="radio"
                  value="bank_transfer"
                  checked={paymentMethod === 'bank_transfer'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <div className="option-content">
                  <FiCreditCard className="option-icon" />
                  <div>
                    <strong>Bank Transfer</strong>
                    <p>Transfer money to our bank account</p>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Place Order Button */}
          <motion.button
            className="place-order-btn"
            onClick={handleCheckout}
            disabled={processing || !paymentMethod || !shippingAddress.trim()}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {processing ? 'Processing...' : `Place Order - ${formatCurrency(checkoutData?.summary.total || 0)}`}
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default Checkout; 