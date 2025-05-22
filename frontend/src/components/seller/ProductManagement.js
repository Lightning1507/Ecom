// src/components/seller/ProductManagement.js
import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { user } = useContext(AuthContext);
  
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products/seller/my-products', {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        
        const data = await response.json();
        setProducts(data.products);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, [user]);
  
  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete product');
      }
      
      // Remove product from state
      setProducts(products.filter(product => product.product_id !== productId));
      alert('Product deleted successfully');
    } catch (err) {
      alert(err.message);
    }
  };
  
  if (loading) {
    return <div className="loading">Loading...</div>;
  }
  
  return (
    <div className="product-management">
      <div className="management-header">
        <h2>My Products</h2>
        <Link to="/seller/add-product" className="btn btn-primary">
          Add New Product
        </Link>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {products.length === 0 ? (
        <div className="no-products">
          <p>You haven't added any products yet.</p>
          <Link to="/seller/add-product" className="btn btn-primary">
            Add Your First Product
          </Link>
        </div>
      ) : (
        <div className="products-table-container">
          <table className="products-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Visible</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.product_id}>
                  <td>
                    {product.img_path ? (
                      <img 
                        src={`/uploads/${product.img_path}`} 
                        alt={product.name} 
                        className="product-thumbnail" 
                      />
                    ) : (
                      <div className="no-image">No Image</div>
                    )}
                  </td>
                  <td>{product.name}</td>
                  <td>₹{product.price}</td>
                  <td>{product.stock}</td>
                  <td>
                    <span className={`status ${product.visible ? 'active' : 'inactive'}`}>
                      {product.visible ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="actions">
                    <Link to={`/seller/edit-product/${product.product_id}`} className="btn btn-sm btn-edit">
                      Edit
                    </Link>
                    <button 
                      className="btn btn-sm btn-delete"
                      onClick={() => handleDeleteProduct(product.product_id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;