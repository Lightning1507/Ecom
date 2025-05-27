import React, { useState } from 'react';
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

const ProductManagement = () => {
  // Mock data - replace with API calls
  const mockProducts = [
    {
      id: 1,
      name: 'Wireless Headphones',
      seller: 'Tech Store',
      category: 'Electronics',
      price: 99.99,
      stock: 45,
      status: 'active',
      featured: true,
      rating: 4.5,
      sales: 128,
      lastUpdated: '2024-03-10'
    },
    {
      id: 2,
      name: 'Summer Dress',
      seller: 'Fashion Boutique',
      category: 'Clothing',
      price: 59.99,
      stock: 23,
      status: 'active',
      featured: false,
      rating: 4.8,
      sales: 89,
      lastUpdated: '2024-03-12'
    },
    {
      id: 3,
      name: 'Ceramic Vase',
      seller: 'Home Decor Plus',
      category: 'Home & Living',
      price: 34.99,
      stock: 12,
      status: 'inactive',
      featured: false,
      rating: 4.2,
      sales: 45,
      lastUpdated: '2024-03-08'
    }
  ];

  const [products, setProducts] = useState(mockProducts);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterFeatured, setFilterFeatured] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  const categories = ['Electronics', 'Clothing', 'Home & Living', 'Books', 'Sports', 'Beauty'];

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    applyFilters(term, filterCategory, filterStatus, filterFeatured);
  };

  const applyFilters = (search = searchTerm, category = filterCategory, status = filterStatus, featured = filterFeatured) => {
    let filtered = mockProducts;

    if (search) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(search) ||
        product.seller.toLowerCase().includes(search)
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
          comparison = a.sales - b.sales;
          break;
        case 'rating':
          comparison = a.rating - b.rating;
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
    setProducts(mockProducts);
  };

  const handleStatusToggle = (productId) => {
    setProducts(products.map(product => {
      if (product.id === productId) {
        const newStatus = product.status === 'active' ? 'inactive' : 'active';
        return { ...product, status: newStatus };
      }
      return product;
    }));
  };

  const handleFeaturedToggle = (productId) => {
    setProducts(products.map(product => {
      if (product.id === productId) {
        return { ...product, featured: !product.featured };
      }
      return product;
    }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

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
            <label>Featured:</label>
            <select 
              value={filterFeatured}
              onChange={(e) => {
                setFilterFeatured(e.target.value);
                applyFilters(searchTerm, filterCategory, filterStatus, e.target.value);
              }}
            >
              <option value="all">All Products</option>
              <option value="featured">Featured</option>
              <option value="not-featured">Not Featured</option>
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
              <option value="sales-desc">Best Selling</option>
              <option value="rating-desc">Top Rated</option>
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
              <th>Seller</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Featured</th>
              <th>Sales</th>
              <th>Rating</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.id}>
                <td>{product.name}</td>
                <td>{product.seller}</td>
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
                <td>
                  <span className={`status-badge ${product.status}`}>
                    {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                  </span>
                </td>
                <td>
                  <button 
                    className={`featured-toggle ${product.featured ? 'active' : ''}`}
                    onClick={() => handleFeaturedToggle(product.id)}
                  >
                    {product.featured ? <FiToggleRight /> : <FiToggleLeft />}
                  </button>
                </td>
                <td>{product.sales}</td>
                <td>
                  <div className="rating">
                    <span className={`rating-value ${product.rating >= 4 ? 'high' : product.rating >= 3 ? 'medium' : 'low'}`}>
                      {product.rating.toFixed(1)}
                    </span>
                  </div>
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