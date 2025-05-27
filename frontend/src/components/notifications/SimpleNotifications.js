import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPackage, FiShoppingBag, FiTag, FiBell, FiX } from 'react-icons/fi';
import './SimpleNotifications.css';

// Mock notifications - in a real app, this would come from your app's events
const mockNotifications = [
  {
    id: 1,
    type: 'order',
    message: 'Your order #123 has been confirmed',
    createdAt: new Date().toISOString(),
    read: false
  },
  {
    id: 2,
    type: 'delivery',
    message: 'Order #120 has been delivered',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    read: false
  },
  {
    id: 3,
    type: 'promotion',
    message: 'Flash Sale! 50% off on electronics',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    read: false
  }
];

const getNotificationIcon = (type) => {
  switch (type) {
    case 'order':
      return <FiPackage className="icon order" />;
    case 'delivery':
      return <FiShoppingBag className="icon delivery" />;
    case 'promotion':
      return <FiTag className="icon promotion" />;
    default:
      return <FiBell className="icon" />;
  }
};

const NotificationItem = ({ notification, onRead }) => {
  return (
    <motion.div
      className={`notification-item ${notification.read ? 'read' : 'unread'}`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <div className="notification-icon">
        {getNotificationIcon(notification.type)}
      </div>
      <div className="notification-content">
        <p className="notification-message">{notification.message}</p>
        <span className="notification-time">
          {new Date(notification.createdAt).toLocaleDateString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            month: 'short',
            day: 'numeric'
          })}
        </span>
      </div>
      {!notification.read && (
        <button 
          className="mark-read-btn"
          onClick={() => onRead(notification.id)}
          aria-label="Mark as read"
        >
          <FiX />
        </button>
      )}
    </motion.div>
  );
};

const SimpleNotifications = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);

  // Load notifications from localStorage on component mount
  useEffect(() => {
    const storedNotifications = localStorage.getItem('notifications');
    if (storedNotifications) {
      setNotifications(JSON.parse(storedNotifications));
    } else {
      // Use mock notifications if nothing in localStorage
      setNotifications(mockNotifications);
      localStorage.setItem('notifications', JSON.stringify(mockNotifications));
    }
  }, []);

  const markAsRead = (notificationId) => {
    const updatedNotifications = notifications.map(notif =>
      notif.id === notificationId ? { ...notif, read: true } : notif
    );
    setNotifications(updatedNotifications);
    localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
  };

  const markAllAsRead = () => {
    const updatedNotifications = notifications.map(notif => ({ ...notif, read: true }));
    setNotifications(updatedNotifications);
    localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // Add a new notification
  const addNotification = (message, type = 'general') => {
    const newNotification = {
      id: Date.now(),
      type,
      message,
      createdAt: new Date().toISOString(),
      read: false
    };
    
    const updatedNotifications = [newNotification, ...notifications];
    setNotifications(updatedNotifications);
    localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="notifications-panel"
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
        >
          <div className="notifications-header">
            <h2>Notifications {unreadCount > 0 && `(${unreadCount})`}</h2>
            <button className="close-btn" onClick={onClose}>
              <FiX />
            </button>
          </div>

          <>
            {notifications.length > 0 ? (
              <>
                <div className="notifications-actions">
                  <button 
                    className="mark-all-read-btn"
                    onClick={markAllAsRead}
                  >
                    Mark all as read
                  </button>
                </div>
                <div className="notifications-list">
                  {notifications.map(notification => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onRead={markAsRead}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="no-notifications">
                <FiBell size={24} />
                <p>No notifications yet</p>
              </div>
            )}
          </>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SimpleNotifications; 