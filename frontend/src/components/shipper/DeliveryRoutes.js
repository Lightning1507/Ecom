import React from 'react';
import { FiMapPin, FiNavigation, FiClock } from 'react-icons/fi';

const DeliveryRoutes = () => {
  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Delivery Routes</h1>
        <p>Plan and optimize your delivery routes</p>
      </div>

      <div className="feature-placeholder">
        <div className="placeholder-content">
          <FiMapPin size={64} color="#9ca3af" />
          <h2>Delivery Routes</h2>
          <p>Route planning and optimization features will be available here.</p>
          <div className="feature-list">
            <div className="feature-item">
              <FiNavigation className="feature-icon" />
              <span>GPS Navigation</span>
            </div>
            <div className="feature-item">
              <FiClock className="feature-icon" />
              <span>Route Optimization</span>
            </div>
            <div className="feature-item">
              <FiMapPin className="feature-icon" />
              <span>Delivery Tracking</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryRoutes; 