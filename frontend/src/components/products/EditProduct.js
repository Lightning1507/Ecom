// src/components/products/EditProduct.js
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import '../products/ProductStyles.css';

const EditProduct = () => {
  const { id } = useParams();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    visible: true,
    categories: []
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [currentImage, setCurrentImage] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchProductAndCategories = async () => {
      try {
        // Fetch product details
        const productResponse = await fetch(`/api/products/${id}`, {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });
        
        if (!productResponse.ok) {
          throw new Error('Failed to fetch product details');
        }
        
        const productData = await productResponse.json();
        
        // Fetch categories
        const categoriesResponse = await fetch('/api/products/categories/all');
        const categoriesData = await categoriesResponse.json();
        
        setCategories(categoriesData.categories);
        
        // Set form data from product
        setFormData({
          name: productData.product.name,
          description: productData.product.description,
          price: productData.product.price,
          stock: productData.product.stock,
          visible: productData.product.visible,
          categories: productData.product.categories.map(cat => cat.category_id)
        });
        
        if (productData.product.img_path) {
          setCurrentImage(`/uploads/${productData.product.img_path}`);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProductAndCategories();
  }, [id, user]);
  
  const handleChange = (e) => {
    if (e.target.name === 'categories') {
      const selectedOptions = Array.from(
        e.target.selectedOptions,
        option => parseInt(option.value)
      );
      setFormData({
        ...formData,
        [e.target.name]: selectedOptions
      });
    } else if (e.target.name === 'visible') {
      setFormData({
        ...formData,
        visible: e.target.value === 'true'
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
    
    const formDataToSend = new FormData();
    formDataToSend.append('name', formData.name);
    formDataToSend.append('description', formData.description);
    formDataToSend.append('price', formData.price);
    formDataToSend.append('stock', formData.stock);
    formDataToSend.append('visible', formData.visible);
    
    formData.categories.forEach(categoryId => {
      formDataToSend.append('categories[]', categoryId);
    });
    
    if (image) {
      formDataToSend.append('image', image);
    }
    
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`
        },
        body: formDataToSend
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update product');
      }
      
      alert('Product updated successfully!');
      navigate('/seller/products');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return <div className="loading">Loading...</div>;
  }
  
  return (
    <div className="add-product-container">
      <h2>Edit Product</h2>
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
            required
          />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="price">Price (₹)</label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              min="0"
              step="0.01"
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
          <label htmlFor="visible">Visibility</label>
          <select
            id="visible"
            name="visible"
            value={formData.visible.toString()}
            onChange={handleChange}
          >
            <option value="true">Visible</option>
            <option value="false">Hidden</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="categories">Categories</label>
          <select
            id="categories"
            name="categories"
            multiple
            value={formData.categories}
            onChange={handleChange}
          >
            {categories.map(category => (
              <option key={category.category_id} value={category.category_id}>
                {category.name}
              </option>
            ))}
          </select>
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
          
          {(imagePreview || currentImage) && (
            <div className="image-preview">
              <p>Image Preview:</p>
              <img src={imagePreview || currentImage} alt="Product preview" />
            </div>
          )}
        </div>
        
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Updating...' : 'Update Product'}
        </button>
      </form>
    </div>
  );
};

export default EditProduct;