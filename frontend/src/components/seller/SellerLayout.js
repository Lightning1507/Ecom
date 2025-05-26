import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiHome, FiBox, FiShoppingBag, FiBarChart2, FiSettings, FiMenu, FiX } from 'react-icons/fi';
import './SellerLayout.css';

const SellerLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();

  const menuItems = [
    { path: '/seller/dashboard', icon: <FiHome size={20} />, label: 'Dashboard' },
    { path: '/seller/products', icon: <FiBox size={20} />, label: 'Products' },
    { path: '/seller/orders', icon: <FiShoppingBag size={20} />, label: 'Orders' },
    { path: '/seller/analytics', icon: <FiBarChart2 size={20} />, label: 'Analytics' },
    { path: '/seller/settings', icon: <FiSettings size={20} />, label: 'Settings' },
  ];

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="seller-layout">
      {/* Mobile Menu Button */}
      <button className="mobile-menu-btn" onClick={toggleSidebar}>
        {isSidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
      </button>

      {/* Sidebar */}
      <motion.aside
        className={`seller-sidebar ${isSidebarOpen ? 'open' : ''}`}
        initial={false}
        animate={{ 
          x: isSidebarOpen ? 0 : -220,
          transition: { type: "spring", stiffness: 300, damping: 30 }
        }}
      >
        <div className="sidebar-header">
          <h2>Seller Dashboard</h2>
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
      </motion.aside>

      {/* Main Content */}
      <main className={`seller-main ${!isSidebarOpen ? 'sidebar-closed' : ''}`}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
};

export default SellerLayout; 