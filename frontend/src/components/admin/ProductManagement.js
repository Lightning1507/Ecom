import React, { useState, useEffect, useContext, useCallback } from 'react';
import { 
  FiSearch, 
  FiEdit2, 
  FiTrash2, 
  FiEye, 
  FiRefreshCw,
  FiToggleLeft,
  FiToggleRight,
  FiUser
} from 'react-icons/fi';
import { AuthContext } from '../../context/AuthContext';
import './ProductManagement.css';
import './Modal.css';

const ProductManagement = () => {
  const { user } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSeller, setFilterSeller] = useState('all');
  const [sellers, setSellers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Helper function to get auth token
  const getAuthToken = useCallback(() => {
    return user?.token || localStorage.getItem('token');
  }, [user?.token]);

  // Fetch all products (admin view)
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getAuthToken();

      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/products`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setProducts(data.products);
        setFilteredProducts(data.products);
        
        // Extract unique sellers and categories for filters
        const uniqueSellers = [...new Set(data.products.map(p => p.seller.name))];
        const uniqueCategories = [...new Set(data.products.flatMap(p => p.categories))];
        
        setSellers(uniqueSellers);
        setCategories(uniqueCategories);
      } else {
        setError(data.message || 'Failed to fetch products');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, getAuthToken]);

  // Load products on component mount
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Filter products when search term or filters change
  useEffect(() => {
    let filtered = products;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.seller?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.seller?.owner?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(product => 
        product.categories.includes(filterCategory)
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(product => product.status === filterStatus);
    }

    // Apply seller filter
    if (filterSeller !== 'all') {
      filtered = filtered.filter(product => product.seller.name === filterSeller);
    }

    setFilteredProducts(filtered);
  }, [products, searchTerm, filterCategory, filterStatus, filterSeller]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleReset = () => {
    setSearchTerm('');
    setFilterCategory('all');
    setFilterStatus('all');
    setFilterSeller('all');
  };

  const handleStatusToggle = async (productId) => {
    try {
      const token = getAuthToken();
      const productToUpdate = products.find(p => p.id === productId);
      const newVisible = productToUpdate.status === 'inactive';

      const response = await fetch(`${API_BASE_URL}/api/admin/products/${productId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ visible: newVisible })
      });

      const data = await response.json();

      if (data.success) {
        // Update the product in the local state
        setProducts(products.map(product => {
          if (product.id === productId) {
            return { ...product, status: newVisible ? 'active' : 'inactive' };
          }
          return product;
        }));
      } else {
        alert(data.message || 'Failed to update product status');
      }
    } catch (error) {
      console.error('Error updating product status:', error);
      alert('Failed to update product status');
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    try {
      const token = getAuthToken();

      const response = await fetch(`${API_BASE_URL}/api/admin/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        // Remove the product from local state
        setProducts(products.filter(product => product.id !== productId));
      } else {
        alert(data.message || 'Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product');
    }
  };

  const handleViewProduct = async (productId) => {
    try {
      const token = getAuthToken();

      const response = await fetch(`${API_BASE_URL}/api/admin/products/${productId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setSelectedProduct(data.product);
        setShowDetailsModal(true);
      } else {
        alert(data.message || 'Failed to fetch product details');
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
      alert('Failed to fetch product details');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="product-management">
      <div className="page-header">
        <h1>Product Management</h1>
        <div className="header-stats">
          <div className="stat">
            <span className="stat-number">{filteredProducts.length}</span>
            <span className="stat-label">Products</span>
          </div>
        </div>
      </div>

      <div className="filters-section">
        <div className="search-box">
          <FiSearch />
          <input
            type="text"
            placeholder="Search products, sellers..."
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>

        <div className="filters">
          <div className="filter-group">
            <label>Category:</label>
            <select 
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
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
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Seller:</label>
            <select 
              value={filterSeller}
              onChange={(e) => setFilterSeller(e.target.value)}
            >
              <option value="all">All Sellers</option>
              {sellers.map(seller => (
                <option key={seller} value={seller}>{seller}</option>
              ))}
            </select>
          </div>

          <button className="btn-icon" onClick={handleReset} title="Reset Filters">
            <FiRefreshCw />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading">
          <p>Loading products...</p>
        </div>
      ) : error ? (
        <div className="error">
          <p>Error: {error}</p>
          <button onClick={fetchProducts} className="btn-primary">
            Retry
          </button>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Product</th>
                  <th>Seller</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Sales</th>
                  <th>Rating</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(product => (
                  <tr key={product.id}>
                    <td>
                      <div className="product-image-cell">
                        {product.image ? (
                          <img 
                            src={product.image} 
                            alt={product.name}
                            className="product-table-image"
                          />
                        ) : (
                          <div className="product-no-image">
                            <span>No Image</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="product-info">
                        <div className="product-name">{product.name}</div>
                        <div className="product-description">
                          {product.description?.substring(0, 50)}...
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="seller-info">
                        <div className="seller-store">
                          <FiUser className="seller-icon" />
                          {product.seller.name}
                        </div>
                        <div className="seller-owner">{product.seller.owner}</div>
                      </div>
                    </td>
                    <td>
                      <span className="category-badge">
                        {product.category}
                      </span>
                    </td>
                    <td>{formatCurrency(product.price)}</td>
                    <td>
                      <span className={`stock-badge ${product.stock < 10 ? 'low' : product.stock < 30 ? 'medium' : 'high'}`}>
                        {product.stock}
                      </span>
                    </td>
                    <td>{product.totalSales || 0}</td>
                    <td>
                      <div className="rating">
                        <span className={`rating-value ${product.rating >= 4 ? 'high' : product.rating >= 3 ? 'medium' : 'low'}`}>
                          {product.rating?.toFixed(1) || '0.0'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${product.status}`}>
                        {product.status?.charAt(0).toUpperCase() + product.status?.slice(1)}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn-icon" 
                          title="View Details"
                          onClick={() => handleViewProduct(product.id)}
                        >
                          <FiEye />
                        </button>
                        <button 
                          className="btn-icon"
                          title={product.status === 'active' ? 'Deactivate Product' : 'Activate Product'}
                          onClick={() => handleStatusToggle(product.id)}
                        >
                          {product.status === 'active' ? <FiToggleRight /> : <FiToggleLeft />}
                        </button>
                        <button 
                          className="btn-icon delete" 
                          title="Delete Product"
                          onClick={() => handleDeleteProduct(product.id)}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredProducts.length === 0 && !loading && (
            <div className="no-results">
              <p>No products found matching your search criteria.</p>
            </div>
          )}
        </>
      )}

      {/* Product Details Modal */}
      {showDetailsModal && selectedProduct && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Product Details</h2>
              <button className="modal-close" onClick={() => setShowDetailsModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="product-details">
                <div className="detail-group">
                  <label>Product Name:</label>
                  <span>{selectedProduct.name}</span>
                </div>
                <div className="detail-group">
                  <label>Description:</label>
                  <p>{selectedProduct.description}</p>
                </div>
                <div className="detail-group">
                  <label>Price:</label>
                  <span>{formatCurrency(selectedProduct.price)}</span>
                </div>
                <div className="detail-group">
                  <label>Stock:</label>
                  <span>{selectedProduct.stock}</span>
                </div>
                <div className="detail-group">
                  <label>Categories:</label>
                  <span>{selectedProduct.categories.join(', ')}</span>
                </div>
                <div className="detail-group">
                  <label>Seller Store:</label>
                  <span>{selectedProduct.seller.name}</span>
                </div>
                <div className="detail-group">
                  <label>Seller Owner:</label>
                  <span>{selectedProduct.seller.owner}</span>
                </div>
                <div className="detail-group">
                  <label>Seller Email:</label>
                  <span>{selectedProduct.seller.email}</span>
                </div>
                <div className="detail-group">
                  <label>Seller Phone:</label>
                  <span>{selectedProduct.seller.phone || 'N/A'}</span>
                </div>
                <div className="detail-group">
                  <label>Status:</label>
                  <span className={`status-badge ${selectedProduct.status}`}>
                    {selectedProduct.status?.charAt(0).toUpperCase() + selectedProduct.status?.slice(1)}
                  </span>
                </div>
                {selectedProduct.image && (
                  <div className="detail-group">
                    <label>Product Image:</label>
                    <img 
                      src={selectedProduct.image} 
                      alt={selectedProduct.name}
                      className="product-image-preview"
                      style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'cover' }}
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => setShowDetailsModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement; 