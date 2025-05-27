import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiShoppingCart, FiUser, FiSearch, FiBell, FiLogOut, FiPackage, FiShoppingBag, FiSettings } from 'react-icons/fi';
import { AuthContext } from '../../context/AuthContext';
import SimpleNotifications from '../notifications/SimpleNotifications';
import './Header.css';

const Header = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleNotifications = () => {
    setIsNotificationsOpen(!isNotificationsOpen);
  };

  return (
    <header className="header">
      <div className="header-container">
        {/* Logo and Brand */}
        <div className="header-left">
          <Link to="/" className="brand">
            <span className="brand-text">E-Commerce</span>
          </Link>
        </div>

        {/* Search Bar */}
        <div className="search-container">
          <div className="search-bar">
            <FiSearch className="search-icon" />
            <input type="text" placeholder="Search products..." />
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="header-nav">
          <Link to="/products" className="nav-link">Products</Link>
          <Link to="/categories" className="nav-link">Categories</Link>
        </nav>

        {/* Right Actions */}
        <div className="header-right">
          {user ? (
            <>
              <button className="header-icon-btn" onClick={toggleNotifications}>
                <FiBell />
                <span className="notification-badge">3</span>
              </button>
              <Link to="/cart" className="header-icon-btn">
                <FiShoppingCart />
                <span className="cart-badge">2</span>
              </Link>
              <div className="user-menu">
                <button className="user-btn">
                  <FiUser />
                  <span className="user-name">{user.username}</span>
                </button>
                <div className="user-dropdown">
                  <Link to="/profile" className="dropdown-item">
                    <FiUser />
                    <span>Profile</span>
                  </Link>
                  <Link to="/orders" className="dropdown-item">
                    <FiPackage />
                    <span>My Orders</span>
                  </Link>
                  {user.role === 'seller' && (
                    <Link to="/seller/dashboard" className="dropdown-item">
                      <FiShoppingBag />
                      <span>Seller Dashboard</span>
                    </Link>
                  )}
                  {user.role === 'admin' && (
                    <Link to="/admin" className="dropdown-item">
                      <FiSettings />
                      <span>Admin Panel</span>
                    </Link>
                  )}
                  <button onClick={handleLogout} className="dropdown-item logout-btn">
                    <FiLogOut />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="auth-btn login-btn">Login</Link>
              <Link to="/register" className="auth-btn register-btn">Register</Link>
            </div>
          )}
        </div>
      </div>

      <SimpleNotifications 
        isOpen={isNotificationsOpen} 
        onClose={() => setIsNotificationsOpen(false)} 
      />
    </header>
  );
};

export default Header;