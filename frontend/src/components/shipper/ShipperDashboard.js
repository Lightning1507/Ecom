import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FiTruck, 
  FiPackage, 
  FiMapPin, 
  FiClock, 
  FiBarChart2,
  FiUser,
  FiMenu,
  FiX
} from 'react-icons/fi';
import './ShipperDashboard.css';

const ShipperDashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();

  const menuItems = [
    { path: '/shipper/dashboard', icon: <FiBarChart2 size={20} />, label: 'Dashboard' },
    { path: '/shipper/orders', icon: <FiPackage size={20} />, label: 'Orders' },
    { path: '/shipper/routes', icon: <FiMapPin size={20} />, label: 'Delivery Routes' },
    { path: '/shipper/analytics', icon: <FiClock size={20} />, label: 'Analytics' },
    { path: '/shipper/profile', icon: <FiUser size={20} />, label: 'Profile' },
  ];

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="shipper-layout">
      {/* Mobile Menu Button */}
      <button className="mobile-menu-btn" onClick={toggleSidebar}>
        {isSidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
      </button>

      {/* Sidebar */}
      <aside className={`shipper-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="logo-section">
            <FiTruck className="logo-icon" />
            <h2>Shipper Dashboard</h2>
          </div>
        </div>
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className={`shipper-main ${!isSidebarOpen ? 'sidebar-closed' : ''}`}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Outlet />
        </motion.div>
      </main>

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div className="mobile-overlay" onClick={toggleSidebar}></div>
      )}
    </div>
  );
};

export default ShipperDashboard; 