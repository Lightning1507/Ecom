// const cloudinary = require('cloudinary').v2;
// const { CloudinaryStorage } = require('multer-storage-cloudinary');
// const multer = require('multer');

// // Configure Cloudinary
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// // Configure Cloudinary storage for multer
// const storage = new CloudinaryStorage({
//   cloudinary: cloudinary,
//   params: {
//     folder: 'ecommerce/reviews', // Folder in Cloudinary
//     allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
//     transformation: [
//       {
//         width: 800,
//         height: 800,
//         crop: 'limit',
//         quality: 'auto:good'
//       }
//     ]
//   },
// });

// // Configure multer with Cloudinary storage
// const upload = multer({
//   storage: storage,
//   limits: {
//     fileSize: 5 * 1024 * 1024, // 5MB limit
//   },
//   fileFilter: (req, file, cb) => {
//     // Check file type
//     if (file.mimetype.startsWith('image/')) {
//       cb(null, true);
//     } else {
//       cb(new Error('Only image files are allowed!'), false);
//     }
//   }
// });

// module.exports = {
//   cloudinary,
//   upload
// }; 


const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Tạo thư mục uploads nếu chưa tồn tại
const uploadDir = 'uploads/products/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for local storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Hàm upload file từ đường dẫn lên Cloudinary
const uploadToCloudinary = async (filePath) => {
  try {
    console.log('Uploading file to Cloudinary from path:', filePath);
    
    if (!fs.existsSync(filePath)) {
      throw new Error('File not found: ' + filePath);
    }

    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'ecommerce/products',
      resource_type: 'image',
      transformation: [
        {
          width: 800,
          height: 800,
          crop: 'limit',
          quality: 'auto:good'
        }
      ]
    });

    console.log('Cloudinary upload successful:', result.secure_url);

    // Xóa file tạm sau khi upload thành công
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return {
      url: result.secure_url,
      public_id: result.public_id
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    // Xóa file tạm nếu có lỗi
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw new Error(`Cloudinary upload failed: ${error.message}`);
  }
};

// Hàm xóa file từ Cloudinary
const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error(`Cloudinary delete failed: ${error.message}`);
  }
};

// Hàm extract public ID từ URL (nếu cần)
const extractPublicId = (url) => {
  if (!url) return null;
  const parts = url.split('/');
  const filename = parts[parts.length - 1];
  return filename.split('.')[0];
};

// Hàm delete image (alias cho deleteFromCloudinary)
const deleteImage = deleteFromCloudinary;

// Hàm delete multiple images
const deleteImages = async (publicIds) => {
  try {
    const result = await cloudinary.api.delete_resources(publicIds);
    return result;
  } catch (error) {
    throw new Error(`Cloudinary delete multiple failed: ${error.message}`);
  }
};

module.exports = {
  cloudinary,
  upload,
  uploadToCloudinary,
  deleteFromCloudinary,
  extractPublicId,
  deleteImage,
  deleteImages
};