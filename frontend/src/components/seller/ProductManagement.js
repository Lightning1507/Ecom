// src/components/seller/ProductManagement.js
import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import '../products/ProductStyles.css'; // Make sure to import the CSS

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { user } = useContext(AuthContext);
  
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        console.log('Fetching products with token:', user?.token);
        
        if (!user || !user.token) {
          console.error('No authentication token available');
          setError('Please log in to view your products');
          setLoading(false);
          return;
        }
        
        const response = await fetch('/api/products/seller/my-products', {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });
        
        console.log('API Response status:', response.status);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('API error:', errorData);
          throw new Error(errorData.message || `Failed to fetch products: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Products received:', data);
        setProducts(data.products || []);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError(err.message || 'Failed to load products');
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
  
  // Render a debug section to help troubleshoot
  const renderDebugInfo = () => {
    return (
      <div style={{margin: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '5px'}}>
        <h3>Debug Information</h3>
        <p>Loading state: {loading ? 'Loading...' : 'Completed'}</p>
        <p>Error state: {error ? error : 'No errors'}</p>
        <p>User authenticated: {user ? 'Yes' : 'No'}</p>
        <p>Products count: {products ? products.length : 0}</p>
        <p>User role: {user ? user.role : 'Unknown'}</p>
      </div>
    );
  };
  
  if (loading) {
    return <div className="loading">Loading products...</div>;
  }
  
  return (
    <div className="product-management">
      <div className="management-header">
        <h2>My Products</h2>
        <Link to="/seller/add-product" className="btn btn-primary">
          Add New Product
        </Link>
      </div>
      
      {renderDebugInfo()} {/* Add this for debugging */}
      
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