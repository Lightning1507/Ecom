import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiPackage, FiClock, FiCheck, FiTruck, FiX } from 'react-icons/fi';
import './Orders.css';

// Temporary mock data - replace with actual API call
const mockOrders = [
  {
    id: '1',
    date: '2024-03-15',
    status: 'delivered',
    total: 299.99,
    items: [
      { id: 1, name: 'Wireless Headphones', price: 199.99, quantity: 1 },
      { id: 2, name: 'Phone Case', price: 29.99, quantity: 2 },
    ],
    shippingAddress: '123 Main St, City, Country',
    trackingNumber: 'TRK123456789'
  },
  {
    id: '2',
    date: '2024-03-10',
    status: 'in-transit',
    total: 499.99,
    items: [
      { id: 3, name: 'Smart Watch', price: 499.99, quantity: 1 }
    ],
    shippingAddress: '456 Oak St, City, Country',
    trackingNumber: 'TRK987654321'
  },
  {
    id: '3',
    date: '2024-03-05',
    status: 'processing',
    total: 89.97,
    items: [
      { id: 4, name: 'T-Shirt', price: 29.99, quantity: 3 }
    ],
    shippingAddress: '789 Pine St, City, Country',
    trackingNumber: 'TRK456789123'
  }
];

const getStatusIcon = (status) => {
  switch (status) {
    case 'delivered':
      return <FiCheck className="status-icon delivered" />;
    case 'in-transit':
      return <FiTruck className="status-icon in-transit" />;
    case 'processing':
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
          </div>
        </div>
        <div className="order-summary">
          <p className="order-total">${order.total.toFixed(2)}</p>
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
            {order.items.map((item) => (
              <div key={item.id} className="order-item">
                <div className="item-info">
                  <p className="item-name">{item.name}</p>
                  <p className="item-quantity">Qty: {item.quantity}</p>
                </div>
                <p className="item-price">${(item.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>

          <div className="order-shipping">
            <h4>Shipping Information</h4>
            <p className="shipping-address">{order.shippingAddress}</p>
            <p className="tracking-number">
              Tracking Number: <span>{order.trackingNumber}</span>
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

const Orders = () => {
  return (
    <div className="orders-container">
      <motion.div
        className="orders-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1>My Orders</h1>
        <p>{mockOrders.length} orders placed</p>
      </motion.div>

      <div className="orders-list">
        {mockOrders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>
    </div>
  );
};

export default Orders; 