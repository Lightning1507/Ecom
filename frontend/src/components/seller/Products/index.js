import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiSearch, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import './styles.css';

const mockProducts = [
  {
    id: 1,
    name: 'Wireless Gaming Mouse',
    price: 59.99,
    stock: 45,
    category: 'Electronics',
    status: 'In Stock'
  },
  {
    id: 2,
    name: 'Mechanical Keyboard',
    price: 129.99,
    stock: 28,
    category: 'Electronics',
    status: 'Low Stock'
  },
  {
    id: 3,
    name: 'Gaming Headset',
    price: 89.99,
    stock: 0,
    category: 'Electronics',
    status: 'Out of Stock'
  }
];

const ProductManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [products] = useState(mockProducts);

  const getStatusClass = (status) => {
    switch (status.toLowerCase()) {
      case 'in stock':
        return 'status-in-stock';
      case 'low stock':
        return 'status-low-stock';
      case 'out of stock':
        return 'status-out-of-stock';
      default:
        return '';
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                  <td>{product.category}</td>
                  <td>${product.price.toFixed(2)}</td>
                  <td>{product.stock}</td>
                  <td>
                    <span className={'status-badge ' + getStatusClass(product.status)}>
                      {product.status}
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
                        onClick={() => {
                          // Add delete confirmation logic here
                          alert('Delete product: ' + product.name);
                        }}
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
      </motion.div>
    </div>
  );
};

export default ProductManagement; 