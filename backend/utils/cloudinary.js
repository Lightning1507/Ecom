const { cloudinary } = require('../config/cloudinary');

/**
 * Extract public ID from Cloudinary URL
 * @param {string} imageUrl - Full Cloudinary image URL
 * @returns {string|null} - Public ID or null if not a valid Cloudinary URL
 */
const extractPublicId = (imageUrl) => {
  if (!imageUrl || typeof imageUrl !== 'string') {
    return null;
  }

  try {
    // Check if it's a Cloudinary URL
    if (!imageUrl.includes('cloudinary.com')) {
      return null;
    }

    // Extract public ID from URL
    // URL format: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/filename.ext
    const parts = imageUrl.split('/');
    const uploadIndex = parts.indexOf('upload');
    
    if (uploadIndex === -1 || uploadIndex >= parts.length - 1) {
      return null;
    }

    // Get everything after upload/ (skip version if present)
    let pathParts = parts.slice(uploadIndex + 1);
    
    // Remove version if present (starts with 'v' followed by numbers)
    if (pathParts[0] && /^v\d+$/.test(pathParts[0])) {
      pathParts = pathParts.slice(1);
    }

    if (pathParts.length === 0) {
      return null;
    }

    // Join the remaining parts and remove file extension
    const publicIdWithExt = pathParts.join('/');
    const lastDotIndex = publicIdWithExt.lastIndexOf('.');
    
    if (lastDotIndex > 0) {
      return publicIdWithExt.substring(0, lastDotIndex);
    }

    return publicIdWithExt;
  } catch (error) {
    console.error('Error extracting public ID from URL:', error);
    return null;
  }
};

/**
 * Delete image from Cloudinary
 * @param {string} imageUrl - Full Cloudinary image URL or public ID
 * @returns {Promise<boolean>} - Success status
 */
const deleteImage = async (imageUrl) => {
  try {
    if (!imageUrl) {
      return true; // Nothing to delete
    }

    let publicId;
    
    // If it's a full URL, extract public ID
    if (imageUrl.includes('cloudinary.com')) {
      publicId = extractPublicId(imageUrl);
    } else {
      // Assume it's already a public ID
      publicId = imageUrl;
    }

    if (!publicId) {
      console.warn('Could not extract public ID from:', imageUrl);
      return false;
    }

    const result = await cloudinary.uploader.destroy(publicId);
    
    if (result.result === 'ok' || result.result === 'not found') {
      return true;
    }

    console.warn('Cloudinary delete result:', result);
    return false;
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    return false;
  }
};

/**
 * Delete multiple images from Cloudinary
 * @param {string[]} imageUrls - Array of Cloudinary image URLs
 * @returns {Promise<boolean>} - Success status (true if all deleted successfully)
 */
const deleteImages = async (imageUrls) => {
  try {
    if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
      return true;
    }

    const deletePromises = imageUrls.map(url => deleteImage(url));
    const results = await Promise.all(deletePromises);
    
    return results.every(result => result === true);
  } catch (error) {
    console.error('Error deleting multiple images:', error);
    return false;
  }
};

module.exports = {
  extractPublicId,
  deleteImage,
  deleteImages
}; 