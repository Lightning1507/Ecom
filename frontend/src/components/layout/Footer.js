import React from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiPhone, FiMapPin, FiFacebook, FiTwitter, FiInstagram, FiLinkedin } from 'react-icons/fi';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        {/* Company Info */}
        <div className="footer-section">
          <h3 className="footer-title">ECOM</h3>
          <p className="footer-description">
            Your trusted multi-vendor marketplace connecting buyers, sellers, and shippers. 
            Discover quality products from verified sellers with reliable delivery services.
          </p>
          <div className="footer-social">
            <a href="https://facebook.com/" target="_blank" rel="noopener noreferrer"><FiFacebook /></a>
            <a href="https://twitter.com/" target="_blank" rel="noopener noreferrer"><FiTwitter /></a>
            <a href="https://instagram.com/" target="_blank" rel="noopener noreferrer"><FiInstagram /></a>
            <a href="https://linkedin.com/" target="_blank" rel="noopener noreferrer"><FiLinkedin /></a>
          </div>
        </div>

        {/* For Customers */}
        <div className="footer-section">
          <h4 className="footer-subtitle">For Customers</h4>
          <ul className="footer-links">
            <li><Link to="/products">Browse Products</Link></li>
            <li><Link to="/shops">Explore Shops</Link></li>
            <li><Link to="/categories">Categories</Link></li>
            <li><Link to="/orders">Track Orders</Link></li>
            <li><Link to="/profile">My Account</Link></li>
            <li><Link to="/cart">Shopping Cart</Link></li>
          </ul>
        </div>

        {/* For Partners */}
        <div className="footer-section">
          <h4 className="footer-subtitle">For Partners</h4>
          <ul className="footer-links">
            <li><Link to="/seller/register">Become a Seller</Link></li>
            <li><Link to="/seller/dashboard">Seller Dashboard</Link></li>
            <li><Link to="/shipper/register">Join as Shipper</Link></li>
            <li><Link to="/shipper/dashboard">Shipper Portal</Link></li>
            <li><Link to="/seller-guide">Seller Guide</Link></li>
            <li><Link to="/shipping-info">Shipping Partners</Link></li>
          </ul>
        </div>

        {/* Support & Company */}
        <div className="footer-section">
          <h4 className="footer-subtitle">Support & Info</h4>
          <ul className="footer-links">
            <li><Link to="/help">Help Center</Link></li>
            <li><Link to="/contact">Contact Support</Link></li>
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/privacy">Privacy Policy</Link></li>
            <li><Link to="/terms">Terms of Service</Link></li>
            <li><Link to="/refund-policy">Refund Policy</Link></li>
          </ul>
        </div>

        {/* Contact Info */}
        <div className="footer-section">
          <h4 className="footer-subtitle">Get in Touch</h4>
          <ul className="footer-contact">
            <li>
              <FiMapPin />
              <span>456 Commerce Plaza, Business District, 54321</span>
            </li>
            <li>
              <FiPhone />
              <span>+1 (800) ECOMHUB</span>
            </li>
            <li>
              <FiMail />
              <span>support@ecomhub.com</span>
            </li>
          </ul>
          <div style={{ marginTop: '1rem' }}>
            <p style={{ fontSize: '0.9rem', color: '#a0aec0', margin: 0 }}>
              Customer Service Hours:<br />
              Mon-Fri: 9AM-8PM<br />
              Sat-Sun: 10AM-6PM
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="footer-bottom">
        <div className="footer-bottom-content">
          <p>&copy; 2024 EcomHub. All rights reserved. | Connecting Commerce, Empowering Business</p>
          <div className="footer-bottom-links">
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/cookies">Cookies</Link>
            <Link to="/sitemap">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;