import React, { useEffect, useState } from 'react';

const ProductsList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Adjust URL if needed for production, or use REACT_APP_API_URL
        const response = await fetch('http://localhost:5000/api/products');
        const data = await response.json();
        setProducts(data.products);
      } catch (error) {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Products</h2>
      {products.length === 0 ? (
        <div>No products found.</div>
      ) : (
        <ul>
          {products.map(product => (
            <li key={product.id || product.product_id}>
              <strong>{product.name}</strong> - {product.description} - ₹{product.price}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ProductsList;