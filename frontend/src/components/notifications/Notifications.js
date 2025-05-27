import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPackage, FiShoppingBag, FiTag, FiBell, FiX } from 'react-icons/fi';
import { AuthContext } from '../../context/AuthContext';
import './Notifications.css';

const getNotificationIcon = (type) => {
  switch (type) {
    case 'order':
      return <FiPackage />;
    case 'delivery':
      return <FiShoppingBag />;
    case 'promotion':
      return <FiTag />;
    default:
      return <FiBell />;
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

const NotificationsPanel = ({ isOpen, onClose }) => {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && user) {
      fetchNotifications();
    }
  }, [isOpen, user]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();
      setNotifications(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }

      setNotifications(notifications.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      ));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }

      setNotifications(notifications.map(notif => ({ ...notif, read: true })));
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
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
            <h2>Notifications</h2>
            <button className="close-btn" onClick={onClose}>
              <FiX />
            </button>
          </div>

          {loading ? (
            <div className="notifications-loading">Loading notifications...</div>
          ) : error ? (
            <div className="notifications-error">{error}</div>
          ) : (
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
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationsPanel; 