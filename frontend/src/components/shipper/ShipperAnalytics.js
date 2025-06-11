import React from 'react';
import { FiBarChart2, FiTrendingUp, FiClock } from 'react-icons/fi';

const ShipperAnalytics = () => {
  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Analytics</h1>
        <p>Track your delivery performance and earnings</p>
      </div>

      <div className="feature-placeholder">
        <div className="placeholder-content">
          <FiBarChart2 size={64} color="#9ca3af" />
          <h2>Performance Analytics</h2>
          <p>Detailed analytics and reporting features will be available here.</p>
          <div className="feature-list">
            <div className="feature-item">
              <FiTrendingUp className="feature-icon" />
              <span>Delivery Trends</span>
            </div>
            <div className="feature-item">
              <FiClock className="feature-icon" />
              <span>Performance Metrics</span>
            </div>
            <div className="feature-item">
              <FiBarChart2 className="feature-icon" />
              <span>Earnings Reports</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShipperAnalytics; 