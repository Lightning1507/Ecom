import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './ProductStyles.css';

const ProductsList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Using the proxy from package.json
        const response = await fetch('/api/products');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch products: ${response.status}`);
        }
        
        const data = await response.json();
        setProducts(data.products || []);
      } catch (error) {
        console.error('Error fetching products:', error);
        setError(error.message || 'Failed to load products');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, []);

  if (loading) return <div className="loading-container">Loading products...</div>;

  if (error) return <div className="error-container">{error}</div>;

  return (
    <div className="products-page">
      <div className="products-header">
        <h2>All Products</h2>
        <p>Browse our collection of quality products</p>
      </div>
      
      {products.length === 0 ? (
        <div className="no-products">
          <p>No products available at the moment.</p>
        </div>
      ) : (
        <div className="products-grid">
          {products.map(product => (
            <div className="product-card" key={product.product_id || product.id}>
              <div className="product-image">
                {product.img_path ? (
                  <img 
                    src={`/uploads/${product.img_path}`} 
                    alt={product.name} 
                  />
                ) : (
                  <div className="no-image">No Image Available</div>
                )}
              </div>
              
              <div className="product-details">
                <h3 className="product-name">{product.name}</h3>
                <p className="product-price">₹{product.price}</p>
                <p className="product-description">
                  {product.description && product.description.length > 100 
                    ? `${product.description.substring(0, 100)}...` 
                    : product.description}
                </p>
                <div className="product-actions">
                  <button className="btn btn-primary">View Details</button>
                  <button className="btn btn-secondary">Add to Cart</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductsList;