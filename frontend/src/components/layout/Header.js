import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiShoppingCart, FiUser, FiSearch, FiBell, FiLogOut } from 'react-icons/fi';
import { AuthContext } from '../../context/AuthContext';
import './Header.css';

const Header = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
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
          <Link to="/deals" className="nav-link">Deals</Link>
        </nav>

        {/* Right Actions */}
        <div className="header-right">
          {user ? (
            <>
              <button className="header-icon-btn">
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
                  <Link to="/profile" className="dropdown-item">Profile</Link>
                  {user.role === 'seller' && (
                    <Link to="/seller/dashboard" className="dropdown-item">Seller Dashboard</Link>
                  )}
                  {user.role === 'admin' && (
                    <Link to="/admin" className="dropdown-item">Admin Panel</Link>
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
    </header>
  );
};

export default Header;