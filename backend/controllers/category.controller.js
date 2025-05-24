const pool = require('../db');

// Get all categories
exports.getAllCategories = async (req, res) => {
  try {
    console.log('Fetching categories...');
    const result = await pool.query('SELECT * FROM Categories ORDER BY name');
    console.log('Categories found:', result.rows);
    
    // Make sure we're sending the exact structure the frontend expects
    res.json({ 
      categories: result.rows 
    });
  } catch (err) {
    console.error('Error fetching categories:', err.message);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// Create a new category
exports.createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }
    
    // Check if category already exists
    const categoryCheck = await pool.query(
      'SELECT * FROM Categories WHERE LOWER(name) = LOWER($1)',
      [name.trim()]
    );
    
    if (categoryCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Category already exists'
      });
    }
    
    // Insert new category
    const result = await pool.query(
      'INSERT INTO Categories (name) VALUES ($1) RETURNING *',
      [name.trim()]
    );
    
    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category: result.rows[0]
    });
  } catch (err) {
    console.error('Create category error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};

// Update category
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }
    
    // Check if category exists
    const categoryCheck = await pool.query(
      'SELECT * FROM Categories WHERE category_id = $1',
      [id]
    );
    
    if (categoryCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    // Update category
    const result = await pool.query(
      'UPDATE Categories SET name = $1 WHERE category_id = $2 RETURNING *',
      [name.trim(), id]
    );
    
    res.json({
      success: true,
      message: 'Category updated successfully',
      category: result.rows[0]
    });
  } catch (err) {
    console.error('Update category error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};

// Delete category
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if category exists
    const categoryCheck = await pool.query(
      'SELECT * FROM Categories WHERE category_id = $1',
      [id]
    );
    
    if (categoryCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    // Check if category is used in any products
    const productCheck = await pool.query(
      'SELECT * FROM Product_categories WHERE category_id = $1 LIMIT 1',
      [id]
    );
    
    if (productCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category because it is used by one or more products'
      });
    }
    
    // Delete category
    await pool.query(
      'DELETE FROM Categories WHERE category_id = $1',
      [id]
    );
    
    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (err) {
    console.error('Delete category error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};