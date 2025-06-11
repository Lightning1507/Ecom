import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiShoppingCart, FiUser, FiSearch, FiLogOut, FiPackage, FiShoppingBag, FiSettings, FiStar } from 'react-icons/fi';
import { AuthContext } from '../../context/AuthContext';
import { CartContext } from '../../context/CartContext';
import './Header.css';

const Header = () => {
  const { user, logout } = useContext(AuthContext);
  const { cartCount } = useContext(CartContext);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };



  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSearchInputChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch(e);
    }
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
          <form onSubmit={handleSearch} className="search-bar">
            <FiSearch className="search-icon" onClick={handleSearch} />
            <input 
              type="text" 
              placeholder="Search products..." 
              value={searchQuery}
              onChange={handleSearchInputChange}
              onKeyPress={handleKeyPress}
            />
          </form>
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

              <Link to="/cart" className="header-icon-btn">
                <FiShoppingCart />
                {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
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
                  <Link to="/reviews" className="dropdown-item">
                    <FiStar />
                    <span>My Reviews</span>
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


    </header>
  );
};

export default Header;