import React from 'react';
import { motion } from 'framer-motion';
import { FiDollarSign, FiShoppingCart, FiPackage, FiTrendingUp } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './styles.css';

const mockData = {
  stats: {
    revenue: 15420,
    orders: 124,
    products: 45,
    growth: 23.5
  },
  salesData: [
    { month: 'Jan', sales: 4000 },
    { month: 'Feb', sales: 3000 },
    { month: 'Mar', sales: 5000 },
    { month: 'Apr', sales: 4500 },
    { month: 'May', sales: 6000 },
    { month: 'Jun', sales: 5500 }
  ]
};

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
  const { stats, salesData } = mockData;

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
            <div className="activity-item">
              <div className="activity-icon order">
                <FiShoppingCart size={16} />
              </div>
              <div className="activity-details">
                <h4>New Order #1234</h4>
                <p>2 items • $156.00</p>
              </div>
              <span className="activity-time">2 min ago</span>
            </div>
            <div className="activity-item">
              <div className="activity-icon product">
                <FiPackage size={16} />
              </div>
              <div className="activity-details">
                <h4>Product Stock Update</h4>
                <p>Gaming Mouse X1 • +50 units</p>
              </div>
              <span className="activity-time">1 hour ago</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SellerDashboard; 