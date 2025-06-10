const express = require('express');
const router = express.Router();
const { cloudinary, upload } = require('../config/cloudinary');

// Test Cloudinary configuration
router.get('/cloudinary-config', (req, res) => {
  try {
    const config = cloudinary.config();
    
    res.json({
      success: true,
      message: 'Cloudinary configuration loaded',
      config: {
        cloud_name: config.cloud_name || 'Not set',
        api_key: config.api_key ? '***CONFIGURED***' : 'Not set',
        api_secret: config.api_secret ? '***CONFIGURED***' : 'Not set'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Cloudinary configuration error',
      error: error.message
    });
  }
});

// Test image upload to Cloudinary
router.post('/upload-test', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    res.json({
      success: true,
      message: 'Image uploaded successfully to Cloudinary',
      file: {
        url: req.file.path,
        public_id: req.file.filename,
        size: req.file.size,
        format: req.file.format
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Upload failed',
      error: error.message
    });
  }
});

module.exports = router; 