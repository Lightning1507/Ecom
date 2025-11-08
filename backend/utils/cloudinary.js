const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const fs = require("fs");
const path = require("path");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Tạo thư mục uploads nếu chưa tồn tại
const uploadDir = "uploads/products/";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for local storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "product-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/avif",
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Only image files (JPEG, JPG, PNG, GIF, WEBP, AVIF) are allowed!"
        ),
        false
      );
    }
  },
});

// Hàm upload file từ đường dẫn lên Cloudinary
const uploadToCloudinary = async (filePath) => {
  try {
    console.log("Uploading file to Cloudinary from path:", filePath);

    if (!fs.existsSync(filePath)) {
      throw new Error("File not found: " + filePath);
    }

    const result = await cloudinary.uploader.upload(filePath, {
      folder: "ecommerce/products",
      resource_type: "image",
      allowed_formats: ["jpg", "jpeg", "png", "gif", "webp", "avif"],
      transformation: [
        {
          width: 800,
          height: 800,
          crop: "fill",
          gravity: "auto",
          quality: "auto:good",
        },
      ],
    });

    console.log("Cloudinary upload successful:", result.secure_url);

    // Xóa file tạm sau khi upload thành công
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return {
      url: result.secure_url,
      public_id: result.public_id,
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    // Xóa file tạm nếu có lỗi
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw new Error(`Cloudinary upload failed: ${error.message}`);
  }
};

/**
 * Extract public ID from Cloudinary URL
 * @param {string} imageUrl - Full Cloudinary image URL
 * @returns {string|null} - Public ID or null if not a valid Cloudinary URL
 */
const extractPublicId = (imageUrl) => {
  if (!imageUrl || typeof imageUrl !== "string") {
    return null;
  }

  try {
    // Check if it's a Cloudinary URL
    if (!imageUrl.includes("cloudinary.com")) {
      return null;
    }

    // Extract public ID from URL
    // URL format: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/filename.ext
    const parts = imageUrl.split("/");
    const uploadIndex = parts.indexOf("upload");

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
    const publicIdWithExt = pathParts.join("/");
    const lastDotIndex = publicIdWithExt.lastIndexOf(".");

    if (lastDotIndex > 0) {
      return publicIdWithExt.substring(0, lastDotIndex);
    }

    return publicIdWithExt;
  } catch (error) {
    console.error("Error extracting public ID from URL:", error);
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
    if (imageUrl.includes("cloudinary.com")) {
      publicId = extractPublicId(imageUrl);
    } else {
      // Assume it's already a public ID
      publicId = imageUrl;
    }

    if (!publicId) {
      console.warn("Could not extract public ID from:", imageUrl);
      return false;
    }

    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === "ok" || result.result === "not found") {
      return true;
    }

    console.warn("Cloudinary delete result:", result);
    return false;
  } catch (error) {
    console.error("Error deleting image from Cloudinary:", error);
    return false;
  }
};

// Alias for deleteFromCloudinary (để tương thích với controller)
const deleteFromCloudinary = deleteImage;

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

    const deletePromises = imageUrls.map((url) => deleteImage(url));
    const results = await Promise.all(deletePromises);

    return results.every((result) => result === true);
  } catch (error) {
    console.error("Error deleting multiple images:", error);
    return false;
  }
};

module.exports = {
  cloudinary,
  upload,
  uploadToCloudinary,
  deleteFromCloudinary,
  extractPublicId,
  deleteImage,
  deleteImages,
};
