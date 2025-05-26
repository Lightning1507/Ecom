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
          <h3 className="footer-title">E-Commerce</h3>
          <p className="footer-description">
            Your one-stop shop for all tech needs. Quality products, competitive prices, and excellent service.
          </p>
          <div className="footer-social">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"><FiFacebook /></a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"><FiTwitter /></a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"><FiInstagram /></a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer"><FiLinkedin /></a>
          </div>
        </div>

        {/* Quick Links */}
        <div className="footer-section">
          <h4 className="footer-subtitle">Quick Links</h4>
          <ul className="footer-links">
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/contact">Contact</Link></li>
            <li><Link to="/faq">FAQ</Link></li>
            <li><Link to="/privacy">Privacy Policy</Link></li>
            <li><Link to="/terms">Terms of Service</Link></li>
          </ul>
        </div>

        {/* Categories */}
        <div className="footer-section">
          <h4 className="footer-subtitle">Categories</h4>
          <ul className="footer-links">
            <li><Link to="/categories/gaming">Gaming</Link></li>
            <li><Link to="/categories/laptops">Laptops</Link></li>
            <li><Link to="/categories/accessories">Accessories</Link></li>
            <li><Link to="/categories/networking">Networking</Link></li>
            <li><Link to="/categories/components">Components</Link></li>
          </ul>
        </div>

        {/* Contact Info */}
        <div className="footer-section">
          <h4 className="footer-subtitle">Contact Us</h4>
          <ul className="footer-contact">
            <li>
              <FiMapPin />
              <span>123 Tech Street, Digital City, 12345</span>
            </li>
            <li>
              <FiPhone />
              <span>+1 (555) 123-4567</span>
            </li>
            <li>
              <FiMail />
              <span>support@techmart.com</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="footer-bottom">
        <div className="footer-bottom-content">
          <p>&copy; 2024 TechMart. All rights reserved.</p>
          <div className="footer-bottom-links">
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/sitemap">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;