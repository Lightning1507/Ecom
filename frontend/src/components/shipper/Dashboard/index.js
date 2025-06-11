import React, { useState, useEffect, useCallback } from 'react';
import { 
  FiPackage, 
  FiTruck, 
  FiMapPin, 
  FiDollarSign,
  FiClock,
  FiCheckCircle,
  FiAlertCircle
} from 'react-icons/fi';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingDeliveries: 0,
    completedDeliveries: 0,
    totalDistance: 0,
    earnings: 0,
    averageDeliveryTime: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Helper function to get authentication token
  const getAuthToken = () => {
    try {
      let token = localStorage.getItem('token');
      if (token) return token;

      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.token) return user.token;
      }
      return null;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  };

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getAuthToken();
      
      if (!token) {
        setError('Authentication required. Please log in as a shipper.');
        return;
      }

      // Fetch dashboard stats
      const response = await fetch(`${API_BASE_URL}/api/shipper/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
        setRecentOrders(data.recentOrders || []);
      } else {
        setError(data.message || 'Failed to fetch dashboard data');
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'preparing':
        return '#f59e0b';
      case 'in_transit':
        return '#3b82f6';
      case 'delivered':
        return '#10b981';
      case 'returned':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'preparing':
        return 'Preparing';
      case 'in_transit':
        return 'In Transit';
      case 'delivered':
        return 'Delivered';
      case 'returned':
        return 'Returned';
      default:
        return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <h2>Loading dashboard...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error-state">
          <FiAlertCircle size={48} color="#dc2626" />
          <h2>Error Loading Dashboard</h2>
          <p>{error}</p>
          <button onClick={fetchDashboardData} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <h1>Shipper Dashboard</h1>
        <p>Welcome back! Here's your delivery overview</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-icon orders">
              <FiPackage />
            </div>
            <div className="stat-details">
              <span className="stat-value">{stats.totalOrders}</span>
              <span className="stat-label">Total Orders</span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-icon deliveries">
              <FiTruck />
            </div>
            <div className="stat-details">
              <span className="stat-value">{stats.pendingDeliveries}</span>
              <span className="stat-label">Pending Deliveries</span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-icon deliveries">
              <FiCheckCircle />
            </div>
            <div className="stat-details">
              <span className="stat-value">{stats.completedDeliveries}</span>
              <span className="stat-label">Completed</span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-icon distance">
              <FiMapPin />
            </div>
            <div className="stat-details">
              <span className="stat-value">{stats.totalDistance} km</span>
              <span className="stat-label">Total Distance</span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-icon earnings">
              <FiDollarSign />
            </div>
            <div className="stat-details">
              <span className="stat-value">{stats.earnings?.toLocaleString('vi-VN')} ₫</span>
              <span className="stat-label">This Month Earnings</span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-icon earnings">
              <FiClock />
            </div>
            <div className="stat-details">
              <span className="stat-value">{stats.averageDeliveryTime} min</span>
              <span className="stat-label">Avg. Delivery Time</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="recent-orders-section">
        <div className="section-header">
          <h2>Recent Orders</h2>
          <p>Your latest delivery assignments</p>
        </div>

        {recentOrders.length > 0 ? (
          <div className="orders-list">
            {recentOrders.map((order) => (
              <div key={order.order_id} className="order-card">
                <div className="order-header">
                  <div className="order-info">
                    <h3>Order #{order.order_id}</h3>
                    <p className="tracking-number">
                      Tracking: {order.tracking_number || 'Not assigned'}
                    </p>
                  </div>
                  <div 
                    className="order-status"
                    style={{ color: getStatusColor(order.shipping_status) }}
                  >
                    {getStatusLabel(order.shipping_status)}
                  </div>
                </div>

                <div className="order-details">
                  <div className="detail-item">
                    <FiMapPin className="detail-icon" />
                    <span>Delivery Address: {order.customer_address || 'Address not provided'}</span>
                  </div>
                  
                  <div className="detail-item">
                    <FiClock className="detail-icon" />
                    <span>
                      Order Date: {new Date(order.order_date).toLocaleDateString('vi-VN')}
                    </span>
                  </div>

                  {order.estimated_delivery && (
                    <div className="detail-item">
                      <FiTruck className="detail-icon" />
                      <span>
                        Est. Delivery: {new Date(order.estimated_delivery).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  )}
                </div>

                <div className="order-actions">
                  <button className="action-btn primary">
                    View Details
                  </button>
                  {order.shipping_status === 'preparing' && (
                    <button className="action-btn secondary">
                      Start Delivery
                    </button>
                  )}
                  {order.shipping_status === 'in_transit' && (
                    <button className="action-btn success">
                      Mark Delivered
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <FiPackage size={48} color="#9ca3af" />
            <h3>No Recent Orders</h3>
            <p>You don't have any recent delivery assignments.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard; 