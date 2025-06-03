// src/components/products/AddProduct.js
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import '../products/ProductStyles.css';

const AddProduct = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    categories: []
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Fetch categories
    const fetchCategories = async () => {
      try {
        console.log('Fetching categories...');
        const response = await fetch('http://localhost:5000/api/categories', {
          credentials: 'include'
        });
        const data = await response.json();
        console.log('Categories data received:', data);
        if (data.categories) {
          setCategories(data.categories);
        } else {
          console.error('No categories array in response:', data);
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err);
        setError('Failed to load categories. Please try refreshing the page.');
      }
    };
    
    fetchCategories();
  }, []);
  
  const handleChange = (e) => {
    if (e.target.name === 'categories') {
      const selectedOptions = Array.from(
        e.target.selectedOptions,
        option => parseInt(option.value)
      );
      console.log('Selected categories:', selectedOptions);
      setFormData({
        ...formData,
        [e.target.name]: selectedOptions
      });
    } else {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value
      });
    }
  };
  
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Validate form data
    if (!formData.name || !formData.price || !formData.stock) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    // Validate price and stock
    if (parseFloat(formData.price) <= 0) {
      setError('Price must be greater than 0');
      setLoading(false);
      return;
    }

    if (parseInt(formData.stock) < 0) {
      setError('Stock cannot be negative');
      setLoading(false);
      return;
    }
    
    const formDataToSend = new FormData();
    formDataToSend.append('name', formData.name.trim());
    formDataToSend.append('description', formData.description.trim());
    formDataToSend.append('price', formData.price);
    formDataToSend.append('stock', formData.stock);
    
    // Add categories if selected
    if (formData.categories.length > 0) {
      formData.categories.forEach(categoryId => {
        formDataToSend.append('categories[]', categoryId);
      });
    }
    
    // Add image if selected
    if (image) {
      formDataToSend.append('image', image);
    }
    
    try {
      console.log('Sending product data:', {
        name: formData.name,
        description: formData.description,
        price: formData.price,
        stock: formData.stock,
        categories: formData.categories,
        hasImage: !!image
      });

      const response = await fetch('http://localhost:5000/api/products', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.token || 'dummy-token'}`
        },
        credentials: 'include',
        body: formDataToSend
      });
      
      // Log the raw response for debugging
      const responseText = await response.text();
      console.log('Raw server response:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse server response:', parseError);
        throw new Error('Server returned invalid JSON. Please try again or contact support.');
      }
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create product');
      }
      
      alert('Product created successfully!');
      navigate('/seller/products');
    } catch (err) {
      console.error('Error creating product:', err);
      setError(err.message || 'Failed to create product. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="add-product-container">
      <h2>Add New Product</h2>
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit} className="product-form">
        <div className="form-group">
          <label htmlFor="name">Product Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
          />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="price">Price (₫)</label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              min="0"
              step="1"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="stock">Stock</label>
            <input
              type="number"
              id="stock"
              name="stock"
              value={formData.stock}
              onChange={handleChange}
              min="0"
              required
            />
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="categories">Categories</label>
          {categories.length > 0 ? (
            <select
              id="categories"
              name="categories"
              multiple
              value={formData.categories}
              onChange={handleChange}
              className="categories-select"
            >
              {categories.map(category => (
                <option key={category.category_id} value={category.category_id}>
                  {category.name}
                </option>
              ))}
            </select>
          ) : (
            <p className="loading-text">Loading categories...</p>
          )}
          <small>Hold Ctrl (or Cmd) to select multiple categories</small>
        </div>
        
        <div className="form-group">
          <label htmlFor="image">Product Image</label>
          <input
            type="file"
            id="image"
            name="image"
            onChange={handleImageChange}
            accept="image/jpeg, image/png, image/jpg, image/webp"
          />
          {imagePreview && (
            <div className="image-preview">
              <img src={imagePreview} alt="Product preview" />
            </div>
          )}
        </div>
        
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Creating...' : 'Create Product'}
        </button>
      </form>
    </div>
  );
};

export default AddProduct;