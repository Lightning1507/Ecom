import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  FiArrowRight, 
  FiShoppingBag, 
  FiTruck, 
  FiCreditCard, 
  FiHeadphones,
  FiStar,
  FiTrendingUp,
  FiZap,
  FiShield,
  FiGift
} from 'react-icons/fi';
import './styles.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalCategories: 0,
    totalSellers: 0
  });

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      
      // Fetch products and categories in parallel
      const [productsResponse, categoriesResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/products`).catch(() => 
          fetch('/api/products')
        ),
        fetch(`${API_BASE_URL}/api/categories/with-counts`).catch(() => 
          fetch('/api/categories/with-counts')
        )
      ]);

      // Handle products
      if (productsResponse && productsResponse.ok) {
        const productsData = await productsResponse.json();
        const products = Array.isArray(productsData) ? productsData : productsData.products || [];
        
        // Get top 6 products with highest ratings for featured section
        const topProducts = products
          .filter(product => product.rating > 0 || product.stock > 0)
          .sort((a, b) => (b.rating || 0) - (a.rating || 0))
          .slice(0, 6);
          
        setFeaturedProducts(topProducts);
        setStats(prev => ({ ...prev, totalProducts: products.length }));
      }

      // Handle categories
      if (categoriesResponse && categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json();
        const categoryList = categoriesData.categories || [];
        
        // Get top 8 categories with most products
        const topCategories = categoryList
          .filter(cat => cat.productCount > 0)
          .sort((a, b) => b.productCount - a.productCount)
          .slice(0, 8);
          
        setCategories(topCategories);
        setStats(prev => ({ 
          ...prev, 
          totalCategories: categoryList.length,
          totalSellers: Math.floor(Math.random() * 50) + 20 // Mock seller count for now
        }));
      }
    } catch (error) {
      console.error('Error fetching home data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const getCloudinaryUrl = (imagePath) => {
    if (!imagePath) return 'https://via.placeholder.com/400x300/667eea/white?text=No+Image';
    if (imagePath.includes('cloudinary') || imagePath.includes('http')) return imagePath;
    return `https://via.placeholder.com/400x300/667eea/white?text=${encodeURIComponent('Product')}`;
  };

  const getCategoryIcon = (categoryName) => {
    const icons = {
      'electronics': '💻',
      'clothing': '👕',
      'books': '📚',
      'home': '🏠',
      'sports': '⚽',
      'beauty': '💄',
      'gaming': '🎮',
      'accessories': '🎧'
    };
    
    const key = categoryName.toLowerCase();
    return icons[key] || icons[Object.keys(icons).find(k => key.includes(k))] || '🛍️';
  };

  if (loading) {
    return (
      <div className="home-loading">
        <motion.div 
          className="loading-spinner"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <p>Loading amazing products...</p>
      </div>
    );
  }

  return (
    <div className="home-container">
      {/* Hero Section with Animated Background */}
      <section className="hero-section">
        <div className="hero-background">
          <div className="floating-shapes">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className={`floating-shape shape-${i + 1}`}
                animate={{
                  y: [0, -20, 0],
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 3 + i,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.5
                }}
              />
            ))}
          </div>
        </div>
        
        <motion.div
          className="hero-content"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="hero-badge"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <FiZap className="badge-icon" />
            <span>New Products Added Daily</span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            Discover Amazing Products
            <span className="gradient-text"> From Real Sellers</span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            Shop from {stats.totalProducts}+ authentic products across {stats.totalCategories}+ categories
            from verified sellers
          </motion.p>
          
          <motion.div
            className="hero-buttons"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <Link to="/products" className="cta-button primary">
              <FiShoppingBag />
              Shop Now <FiArrowRight />
            </Link>
            <Link to="/categories" className="cta-button secondary">
              Browse Categories
            </Link>
          </motion.div>
          
          <motion.div
            className="hero-stats"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <div className="stat-item">
              <FiTrendingUp className="stat-icon" />
              <span className="stat-number">{stats.totalProducts}+</span>
              <span className="stat-label">Products</span>
            </div>
            <div className="stat-item">
              <FiShoppingBag className="stat-icon" />
              <span className="stat-number">{stats.totalCategories}+</span>
              <span className="stat-label">Categories</span>
            </div>
            <div className="stat-item">
              <FiStar className="stat-icon" />
              <span className="stat-number">{stats.totalSellers}+</span>
              <span className="stat-label">Sellers</span>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2>Why Choose Our Platform?</h2>
          <p>Experience the best online shopping with our premium features</p>
        </motion.div>
        
        <div className="features-grid">
          {[
            {
              icon: FiShoppingBag,
              title: "Authentic Products",
              description: "All products from verified sellers with quality guarantee",
              color: "#667eea"
            },
            {
              icon: FiTruck,
              title: "Fast Delivery",
              description: "Quick and reliable shipping to your doorstep",
              color: "#f093fb"
            },
            {
              icon: FiShield,
              title: "Secure Payment",
              description: "Safe and encrypted transactions with multiple payment options",
              color: "#4facfe"
            },
            {
              icon: FiHeadphones,
              title: "24/7 Support",
              description: "Always here to help you with any questions or concerns",
              color: "#43e97b"
            }
          ].map((feature, index) => (
            <motion.div
              key={index}
              className="feature-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -10, scale: 1.02 }}
            >
              <div className="feature-icon-wrapper" style={{ backgroundColor: `${feature.color}20` }}>
                <feature.icon className="feature-icon" style={{ color: feature.color }} />
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="featured-section">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2>Featured Products</h2>
          <p>Top-rated products from our trusted sellers</p>
        </motion.div>
        
        {featuredProducts.length > 0 ? (
          <div className="products-grid">
            {featuredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                className="product-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -10, scale: 1.03 }}
              >
                <div className="product-image">
                  <img 
                    src={getCloudinaryUrl(product.img_path)} 
                    alt={product.name}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/300x200/667eea/white?text=Product';
                    }}
                  />
                  {product.rating > 0 && (
                    <div className="product-badge">
                      <FiStar className="star-icon" />
                      <span>{product.rating.toFixed(1)}</span>
                    </div>
                  )}
                  {product.stock <= 5 && product.stock > 0 && (
                    <div className="stock-badge low-stock">
                      Only {product.stock} left!
                    </div>
                  )}
                </div>
                
                <div className="product-info">
                  <div className="product-category">
                    {product.categories?.[0]?.name || product.category || 'General'}
                  </div>
                  <h3 className="product-name">{product.name}</h3>
                  <p className="product-description">
                    {product.description?.substring(0, 80)}
                    {product.description?.length > 80 ? '...' : ''}
                  </p>
                  <div className="product-footer">
                    <div className="product-price">
                      {formatPrice(product.price)}
                    </div>
                    <Link 
                      to={`/products/${product.id}`} 
                      className="view-product-btn"
                    >
                      <FiArrowRight />
                      View Details
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            className="no-products"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <FiGift className="empty-icon" />
            <h3>No Products Available</h3>
            <p>Check back soon for amazing products!</p>
          </motion.div>
        )}
        
        <motion.div
          className="section-footer"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Link to="/products" className="view-all-btn">
            View All Products <FiArrowRight />
          </Link>
        </motion.div>
      </section>

      {/* Categories Section */}
      <section className="categories-section">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2>Shop by Category</h2>
          <p>Explore our diverse range of product categories</p>
        </motion.div>
        
        {categories.length > 0 ? (
          <div className="categories-grid">
            {categories.map((category, index) => (
              <motion.div
                key={category.id}
                className="category-card"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link to={`/products?category=${category.name.toLowerCase()}`}>
                  <div className="category-icon">
                    <span className="category-emoji">{getCategoryIcon(category.name)}</span>
                  </div>
                  <div className="category-info">
                    <h3>{category.name}</h3>
                    <p>{category.productCount} Product{category.productCount !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="category-arrow">
                    <FiArrowRight />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            className="no-categories"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <FiShoppingBag className="empty-icon" />
            <h3>No Categories Available</h3>
            <p>Categories will appear here as products are added!</p>
          </motion.div>
        )}
        
        <motion.div
          className="section-footer"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Link to="/categories" className="view-all-btn">
            View All Categories <FiArrowRight />
          </Link>
        </motion.div>
      </section>

      {/* Newsletter Section */}
      <section className="newsletter-section">
        <motion.div
          className="newsletter-content"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="newsletter-icon">
            <FiGift />
          </div>
          <h2>Stay in the Loop</h2>
          <p>Subscribe to our newsletter for exclusive deals, new product launches, and special offers</p>
          <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
            <div className="form-group">
              <input 
                type="email" 
                placeholder="Enter your email address" 
                required 
              />
              <motion.button 
                type="submit"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Subscribe <FiArrowRight />
              </motion.button>
            </div>
          </form>
          <p className="newsletter-note">
            🎉 Get 10% off your first order when you subscribe!
          </p>
        </motion.div>
      </section>
    </div>
  );
};

export default Home; 