import React, { useContext } from 'react';
import {Link, useNavigate} from '../../router';
import { AuthContext } from '../../context/AuthContext';
import './Layout.css';

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
        <Link to="/" className="logo">E-Commerce</Link>
        
        <div className="search-bar">
          <input type="text" placeholder="Search products..." />
          <button type="submit">Search</button>
        </div>
        
        <nav className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/products">Products</Link>
          
          {user ? (
            <div className="user-menu">
              <div className="user-menu-trigger">
                <span>Hi, {user.username || 'User'}</span>
              </div>
              <div className="user-dropdown">
                <Link to="/profile">My Profile</Link>
                <Link to="/orders">My Orders</Link>
                {user.role === 'admin' && <Link to="/admin">Admin Panel</Link>}
                {user.role === 'seller' && <Link to="/seller">Seller Dashboard</Link>}
                <button onClick={handleLogout}>Logout</button>
              </div>
            </div>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Sign Up</Link>
            </>
          )}
          
          <Link to="/cart" className="cart-icon">
            <span role="img" aria-label="Shopping Cart">🛒</span> Cart
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;