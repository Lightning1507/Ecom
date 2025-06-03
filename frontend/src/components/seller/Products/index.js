import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiSearch, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import './styles.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const ProductManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const userData = localStorage.getItem('user');
      
      if (!userData) {
        throw new Error('No authentication token found. Please log in.');
      }

      const { token } = JSON.parse(userData);
      
      if (!token) {
        throw new Error('No authentication token found. Please log in.');
      }

      const response = await fetch(`${API_BASE_URL}/api/products/seller/products`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        }
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();
      console.log('Fetched products:', data);
      setProducts(data.products || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const getStatusClass = (stock) => {
    if (stock <= 0) return 'status-out-of-stock';
    if (stock < 10) return 'status-low-stock';
    return 'status-in-stock';
  };

  const getStatusText = (stock) => {
    if (stock <= 0) return 'Out of Stock';
    if (stock < 10) return 'Low Stock';
    return 'In Stock';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        const userData = localStorage.getItem('user');
        if (!userData) {
          throw new Error('No authentication token found. Please log in.');
        }

        const { token } = JSON.parse(userData);
        if (!token) {
          throw new Error('No authentication token found. Please log in.');
        }

        const response = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to delete product');
        }

        // Refresh the products list
        fetchProducts();
      } catch (err) {
        console.error('Error deleting product:', err);
        alert('Failed to delete product. Please try again.');
      }
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading products...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error loading products</h2>
        <p>{error}</p>
        <button onClick={fetchProducts} className="retry-button">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="products-management">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="products-header">
          <h1>Product Management</h1>
          <Link to="/seller/add-product" className="add-product-btn">
            <FiPlus size={20} />
            Add New Product
          </Link>
        </div>

        <div className="products-tools">
          <div className="search-box">
            <FiSearch size={20} />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="products-table-container">
          <table className="products-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <motion.tr
                  key={product.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <td>{product.name}</td>
                  <td>{product.category || 'Uncategorized'}</td>
                  <td>{formatCurrency(product.price)}</td>
                  <td>{product.stock}</td>
                  <td>
                    <span className={'status-badge ' + getStatusClass(product.stock)}>
                      {getStatusText(product.stock)}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <Link
                        to={'/seller/edit-product/' + product.id}
                        className="edit-btn"
                        title="Edit Product"
                      >
                        <FiEdit2 size={18} />
                      </Link>
                      <button
                        className="delete-btn"
                        title="Delete Product"
                        onClick={() => handleDelete(product.id)}
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && (
          <div className="no-products">
            <p>No products found matching your search criteria.</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ProductManagement; 