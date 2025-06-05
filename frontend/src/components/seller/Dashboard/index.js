import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FiDollarSign, FiShoppingCart, FiPackage, FiTrendingUp } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './styles.css';

const StatCard = ({ icon, label, value, trend }) => (
  <motion.div
    className="stat-card"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <div className="stat-icon">{icon}</div>
    <div className="stat-info">
      <h3>{label}</h3>
      <p className="stat-value">{value}</p>
      {trend && <span className="stat-trend">↑ {trend}%</span>}
    </div>
  </motion.div>
);

const SellerDashboard = () => {
  const [stats, setStats] = useState({
    revenue: 0,
    orders: 0,
    products: 0,
    growth: 0
  });
  const [salesData, setSalesData] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      const token = getAuthToken();
      
      if (!token) {
        setError('Authentication required. Please log in as a seller.');
        return;
      }

      // Fetch stats and activity in parallel
      const [statsResponse, activityResponse] = await Promise.all([
        fetch('http://localhost:5000/api/dashboard/seller/stats', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch('http://localhost:5000/api/dashboard/seller/activity', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      const [statsData, activityData] = await Promise.all([
        statsResponse.json(),
        activityResponse.json()
      ]);

      if (statsData.success) {
        setStats(statsData.stats);
        setSalesData(statsData.salesData);
      } else {
        setError(statsData.message || 'Failed to fetch dashboard statistics');
      }

      if (activityData.success) {
        setRecentActivity(activityData.recentActivity);
      }

      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch dashboard data
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-state">
          <h2>Loading dashboard...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error-state">
          <h2>Error loading dashboard</h2>
          <p>{error}</p>
          <button onClick={fetchDashboardData} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="dashboard-title">Dashboard Overview</h1>
        
        <div className="stats-grid">
          <StatCard
            icon={<FiDollarSign size={24} />}
            label="Total Revenue"
            value={'$' + stats.revenue.toLocaleString()}
            trend={stats.growth}
          />
          <StatCard
            icon={<FiShoppingCart size={24} />}
            label="Total Orders"
            value={stats.orders}
          />
          <StatCard
            icon={<FiPackage size={24} />}
            label="Products"
            value={stats.products}
          />
          <StatCard
            icon={<FiTrendingUp size={24} />}
            label="Growth"
            value={stats.growth + '%'}
          />
        </div>

        <div className="chart-section">
          <h2>Sales Overview</h2>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="sales" fill="#3182ce" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="recent-activity">
          <h2>Recent Activity</h2>
          <div className="activity-list">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <div key={index} className="activity-item">
                  <div className={`activity-icon ${activity.icon}`}>
                    {activity.icon === 'order' ? (
                      <FiShoppingCart size={16} />
                    ) : (
                      <FiPackage size={16} />
                    )}
                  </div>
                  <div className="activity-details">
                    <h4>{activity.title}</h4>
                    <p>{activity.description}</p>
                  </div>
                  <span className="activity-time">{activity.time}</span>
                </div>
              ))
            ) : (
              <div className="no-activity">
                <p>No recent activity to display.</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SellerDashboard; 