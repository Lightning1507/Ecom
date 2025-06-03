import React, { useState, useEffect } from 'react';
import { 
  FiSearch, 
  FiEdit2, 
  FiTrash2, 
  FiEye, 
  FiRefreshCw,
  FiToggleLeft,
  FiToggleRight
} from 'react-icons/fi';
import './ProductManagement.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterFeatured, setFilterFeatured] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  const categories = ['Electronics', 'Clothing', 'Home & Living', 'Books', 'Sports', 'Beauty'];

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/products/seller/products`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();
      setProducts(data.products || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    applyFilters(term, filterCategory, filterStatus, filterFeatured);
  };

  const applyFilters = (search = searchTerm, category = filterCategory, status = filterStatus, featured = filterFeatured) => {
    let filtered = [...products];

    if (search) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(search) ||
        product.category.toLowerCase().includes(search)
      );
    }

    if (category !== 'all') {
      filtered = filtered.filter(product => product.category === category);
    }

    if (status !== 'all') {
      filtered = filtered.filter(product => product.status === status);
    }

    if (featured !== 'all') {
      filtered = filtered.filter(product => 
        featured === 'featured' ? product.featured : !product.featured
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'stock':
          comparison = a.stock - b.stock;
          break;
        case 'sales':
          comparison = (a.sales || 0) - (b.sales || 0);
          break;
        case 'rating':
          comparison = (a.rating || 0) - (b.rating || 0);
          break;
        default:
          comparison = 0;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setProducts(filtered);
  };

  const handleReset = () => {
    setSearchTerm('');
    setFilterCategory('all');
    setFilterStatus('all');
    setFilterFeatured('all');
    setSortBy('name');
    setSortOrder('asc');
    fetchProducts();
  };

  const handleStatusToggle = async (productId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/seller/products/${productId}/toggle-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          // Add authorization header if needed
          // 'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to update product status');
      }

      // Refresh the products list
      fetchProducts();
    } catch (err) {
      console.error('Error updating product status:', err);
      setError(err.message || 'Failed to update product status');
    }
  };

  const handleFeaturedToggle = async (productId) => {
    // Show a message that featured functionality is not available
    alert('Featured status is not supported in the current version.');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

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
        <button onClick={fetchProducts} className="btn-primary">
          <FiRefreshCw /> Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="product-management">
      <div className="page-header">
        <h1>Products Management</h1>
        <button className="btn-primary">
          Add New Product
        </button>
      </div>

      <div className="filters-section">
        <div className="search-box">
          <FiSearch />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>

        <div className="filters">
          <div className="filter-group">
            <label>Category:</label>
            <select 
              value={filterCategory}
              onChange={(e) => {
                setFilterCategory(e.target.value);
                applyFilters(searchTerm, e.target.value, filterStatus, filterFeatured);
              }}
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Status:</label>
            <select 
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                applyFilters(searchTerm, filterCategory, e.target.value, filterFeatured);
              }}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Sort By:</label>
            <select 
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [newSortBy, newSortOrder] = e.target.value.split('-');
                setSortBy(newSortBy);
                setSortOrder(newSortOrder);
                applyFilters();
              }}
            >
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="price-asc">Price (Low-High)</option>
              <option value="price-desc">Price (High-Low)</option>
              <option value="stock-asc">Stock (Low-High)</option>
              <option value="stock-desc">Stock (High-Low)</option>
            </select>
          </div>

          <button className="btn-icon" onClick={handleReset} title="Reset Filters">
            <FiRefreshCw />
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.id}>
                <td>{product.name}</td>
                <td>
                  <span className="category-badge">
                    {product.category || 'Uncategorized'}
                  </span>
                </td>
                <td>{formatCurrency(product.price)}</td>
                <td>
                  <span className={`stock-badge ${product.stock < 10 ? 'low' : product.stock < 30 ? 'medium' : 'high'}`}>
                    {product.stock}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${product.status}`}>
                    {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-icon" title="View Product">
                      <FiEye />
                    </button>
                    <button className="btn-icon" title="Edit Product">
                      <FiEdit2 />
                    </button>
                    <button 
                      className="btn-icon"
                      title={product.status === 'active' ? 'Deactivate Product' : 'Activate Product'}
                      onClick={() => handleStatusToggle(product.id)}
                    >
                      {product.status === 'active' ? <FiToggleRight /> : <FiToggleLeft />}
                    </button>
                    <button className="btn-icon delete" title="Delete Product">
                      <FiTrash2 />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {products.length === 0 && (
        <div className="no-results">
          <p>No products found matching your search criteria.</p>
        </div>
      )}
    </div>
  );
};

export default ProductManagement; 