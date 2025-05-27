import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiShoppingBag, FiTruck, FiCreditCard, FiHeadphones } from 'react-icons/fi';
import './styles.css';

const featuredProducts = [
  {
    id: 1,
    name: 'Wireless Gaming Mouse',
    price: 59.99,
    image: 'https://res.cloudinary.com/dcjxg0bvb/image/upload/v1699425293/mouse_qhvx3p.jpg',
    category: 'Gaming'
  },
  {
    id: 2,
    name: 'Mechanical Keyboard',
    price: 129.99,
    image: 'https://res.cloudinary.com/dcjxg0bvb/image/upload/v1699425293/keyboard_kkpz8k.jpg',
    category: 'Gaming'
  },
  {
    id: 3,
    name: 'Gaming Headset',
    price: 89.99,
    image: 'https://res.cloudinary.com/dcjxg0bvb/image/upload/v1699425293/headset_mvqwwi.jpg',
    category: 'Gaming'
  }
];

const categories = [
  { id: 1, name: 'Gaming', icon: '🎮' },
  { id: 2, name: 'Electronics', icon: '💻' },
  { id: 3, name: 'Accessories', icon: '🎧' },
  { id: 4, name: 'Peripherals', icon: '🖱️' }
];

const Home = () => {
  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <motion.div
          className="hero-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1>Discover Amazing Tech Products</h1>
          <p>Find the best gaming gear and accessories for your setup</p>
          <Link to="/products" className="cta-button">
            Shop Now <FiArrowRight />
          </Link>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="features-grid">
          <div className="feature-card">
            <FiShoppingBag className="feature-icon" />
            <h3>Wide Selection</h3>
            <p>Browse through our extensive collection</p>
          </div>
          <div className="feature-card">
            <FiTruck className="feature-icon" />
            <h3>Fast Delivery</h3>
            <p>Quick and reliable shipping</p>
          </div>
          <div className="feature-card">
            <FiCreditCard className="feature-icon" />
            <h3>Secure Payment</h3>
            <p>Safe and encrypted transactions</p>
          </div>
          <div className="feature-card">
            <FiHeadphones className="feature-icon" />
            <h3>24/7 Support</h3>
            <p>Always here to help you</p>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="featured-section">
        <h2>Featured Products</h2>
        <div className="products-grid">
          {featuredProducts.map((product) => (
            <motion.div
              key={product.id}
              className="product-card"
              whileHover={{ y: -5 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="product-image">
                <img src={product.image} alt={product.name} />
              </div>
              <div className="product-info">
                <span className="product-category">{product.category}</span>
                <h3>{product.name}</h3>
                <p className="product-price">${product.price}</p>
                <Link to={`/products/${product.id}`} className="view-product-btn">
                  View Details
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories-section">
        <h2>Shop by Category</h2>
        <div className="categories-grid">
          {categories.map((category) => (
            <motion.div
              key={category.id}
              className="category-card"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="category-icon">{category.icon}</span>
              <h3>{category.name}</h3>
              <Link to={`/products?category=${category.name.toLowerCase()}`}>
                Browse <FiArrowRight />
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="newsletter-section">
        <div className="newsletter-content">
          <h2>Stay Updated</h2>
          <p>Subscribe to our newsletter for the latest products and deals</p>
          <form className="newsletter-form">
            <input type="email" placeholder="Enter your email" />
            <button type="submit">Subscribe</button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default Home; 