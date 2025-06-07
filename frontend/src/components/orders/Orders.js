import React, { useState, useEffect, useContext, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FiPackage, FiClock, FiCheck, FiTruck, FiX } from 'react-icons/fi';
import { AuthContext } from '../../context/AuthContext';
import './Orders.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const CLOUDINARY_CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;

const getStatusIcon = (status) => {
  switch (status) {
    case 'delivered':
      return <FiCheck className="status-icon delivered" />;
    case 'shipped':
      return <FiTruck className="status-icon in-transit" />;
    case 'confirmed':
      return <FiClock className="status-icon processing" />;
    case 'pending':
      return <FiClock className="status-icon processing" />;
    case 'cancelled':
      return <FiX className="status-icon cancelled" />;
    default:
      return <FiPackage className="status-icon" />;
  }
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const OrderCard = ({ order }) => {
  const [isExpanded, setIsExpanded] = useState(false);

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

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <motion.div
      className="order-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="order-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="order-main-info">
          {getStatusIcon(order.status)}
          <div className="order-details">
            <h3>Order #{order.id}</h3>
            <p className="order-date">{formatDate(order.date)}</p>
            {order.storeName && <p className="store-name">From: {order.storeName}</p>}
          </div>
        </div>
        <div className="order-summary">
          <p className="order-total">{formatCurrency(order.payment.amount)}</p>
          <span className={`order-status ${order.status}`}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </span>
        </div>
      </div>

      {isExpanded && (
        <motion.div
          className="order-content"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <div className="order-items">
            <h4>Items</h4>
            {order.items.map((item, index) => (
              <div key={index} className="order-item">
                <img 
                  src={getCloudinaryUrl(item.image)} 
                  alt={item.name}
                  className="item-image"
                />
                <div className="item-info">
                  <p className="item-name">{item.name}</p>
                  <p className="item-quantity">Qty: {item.quantity}</p>
                  <p className="item-price">{formatCurrency(item.price)}</p>
                </div>
                <p className="item-total">{formatCurrency(item.price * item.quantity)}</p>
              </div>
            ))}
          </div>

          <div className="order-payment">
            <h4>Payment Information</h4>
            <p className="payment-method">
              Method: <span>{order.payment.method === 'cod' ? 'Cash on Delivery' : 'Bank Transfer'}</span>
            </p>
            <p className="payment-status">
              Payment Status: <span className={`payment-status-${order.payment.status}`}>
                {order.payment.status.charAt(0).toUpperCase() + order.payment.status.slice(1)}
              </span>
            </p>
            <p className="payment-amount">
              Amount: <span>{formatCurrency(order.payment.amount)}</span>
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, isAuthenticated } = useContext(AuthContext);

  // Helper function to get auth token
  const getAuthToken = useCallback(() => {
    return user?.token || localStorage.getItem('token');
  }, [user?.token]);

  // Fetch orders from API
  useEffect(() => {
    const fetchOrders = async () => {
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

        const response = await fetch(`${API_BASE_URL}/api/payment/orders`, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch orders');
        }

        const data = await response.json();
        setOrders(data.orders || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError(err.message || 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [isAuthenticated, user, getAuthToken]);

  if (!isAuthenticated()) {
    return (
      <div className="orders-container">
        <div className="orders-error">
          <h2>Please log in to view your orders</h2>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="orders-container">
        <div className="orders-loading">
          <div className="loading-spinner"></div>
          <p>Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="orders-container">
        <div className="orders-error">
          <h2>Error loading orders</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-container">
      <motion.div
        className="orders-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1>My Orders</h1>
        <p>{orders.length} orders placed</p>
      </motion.div>

      <div className="orders-list">
        {orders.length === 0 ? (
          <div className="no-orders">
            <FiPackage className="no-orders-icon" />
            <h3>No orders yet</h3>
            <p>Start shopping to see your orders here!</p>
          </div>
        ) : (
          orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))
        )}
      </div>
    </div>
  );
};

export default Orders; 