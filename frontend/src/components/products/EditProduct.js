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
        const productResponse = await fetch(`http://localhost:5000/api/products/${id}`, {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });
        
        if (!productResponse.ok) {
          throw new Error('Failed to fetch product details');
        }
        
        const productData = await productResponse.json();
        
        // Fetch categories
        const categoriesResponse = await fetch('http://localhost:5000/api/categories');
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
          setCurrentImage(productData.product.img_path);
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
        visible: e.target.checked
      });
    } else {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value
      });
    }
  };

  const handleCategoryToggle = (categoryId) => {
    const currentCategories = [...formData.categories];
    const index = currentCategories.indexOf(categoryId);
    
    if (index > -1) {
      currentCategories.splice(index, 1);
    } else {
      currentCategories.push(categoryId);
    }
    
    setFormData({
      ...formData,
      categories: currentCategories
    });
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
      const response = await fetch(`http://localhost:5000/api/products/${id}`, {
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
          <div className="checkbox-container">
            <input
              type="checkbox"
              id="visible"
              name="visible"
              checked={formData.visible}
              onChange={handleChange}
              className="checkbox-input"
            />
            <label htmlFor="visible" className="checkbox-label">
              <span className="checkbox-custom"></span>
              <span className="checkbox-text">Product is visible to customers</span>
            </label>
          </div>
        </div>
        
        <div className="form-group">
          <label>Categories</label>
          <div className="categories-container">
            <p className="categories-hint">Select one or more categories for your product:</p>
            <div className="categories-grid">
              {categories.map(category => (
                <div key={category.category_id} className="category-item">
                  <input
                    type="checkbox"
                    id={`category-${category.category_id}`}
                    checked={formData.categories.includes(category.category_id)}
                    onChange={() => handleCategoryToggle(category.category_id)}
                    className="category-checkbox"
                  />
                  <label htmlFor={`category-${category.category_id}`} className="category-label">
                    <span className="category-checkbox-custom"></span>
                    <span className="category-name">{category.name}</span>
                  </label>
                </div>
              ))}
            </div>
            {formData.categories.length > 0 && (
              <div className="selected-categories">
                <span className="selected-count">
                  {formData.categories.length} categor{formData.categories.length === 1 ? 'y' : 'ies'} selected
                </span>
              </div>
            )}
          </div>
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
              <div className="image-preview-container">
                <img src={imagePreview || currentImage} alt="Product preview" className="preview-image" />
              </div>
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