# 🛒 E-Commerce Platform

Một nền tảng thương mại điện tử đầy đủ tính năng được xây dựng với React và Node.js, hỗ trợ đa vai trò người dùng bao gồm khách hàng, người bán, quản trị viên và đơn vị vận chuyển.

## 📋 Mục lục

- [Tính năng chính](#tính-năng-chính)
- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Cấu trúc dự án](#cấu-trúc-dự-án)
- [Cài đặt](#cài-đặt)
- [Cách chạy dự án](#cách-chạy-dự-án)
- [Vai trò người dùng](#vai-trò-người-dùng)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Đóng góp](#đóng-góp)

## ✨ Tính năng chính

### 🛍️ Khách hàng (Customer)
- Đăng ký/Đăng nhập tài khoản
- Duyệt và tìm kiếm sản phẩm
- Thêm sản phẩm vào giỏ hàng
- Thanh toán đơn hàng
- Theo dõi trạng thái đơn hàng
- Đánh giá và nhận xét sản phẩm
- Quản lý hồ sơ cá nhân

### 🏪 Người bán (Seller)
- Dashboard quản lý bán hàng
- Thêm/Chỉnh sửa/Xóa sản phẩm
- Quản lý kho hàng
- Xử lý đơn hàng
- Xem báo cáo thống kê
- Quản lý cửa hàng

### 👨‍💼 Quản trị viên (Admin)
- Dashboard tổng quan hệ thống
- Quản lý người dùng
- Quản lý người bán
- Quản lý đơn hàng
- Thống kê và báo cáo
- Quản lý danh mục sản phẩm
- Quản lý đánh giá

### 🚚 Đơn vị vận chuyển (Shipper)
- Dashboard vận chuyển
- Quản lý đơn hàng giao
- Cập nhật trạng thái giao hàng
- Lập kế hoạch tuyến đường
- Thống kê giao hàng

## 🛠️ Công nghệ sử dụng

### Frontend
- **React 18** - Thư viện UI
- **React Router DOM** - Định tuyến
- **Chart.js & Recharts** - Biểu đồ thống kê
- **Framer Motion** - Animation
- **React Icons** - Icon set
- **CSS3** - Styling

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Cơ sở dữ liệu
- **JWT** - Xác thực
- **bcryptjs** - Mã hóa mật khẩu
- **Multer** - Upload file
- **Cloudinary** - Lưu trữ hình ảnh
- **CORS** - Cross-origin resource sharing

### DevOps & Tools
- **Nodemon** - Hot reload development
- **CRACO** - Create React App Configuration Override
- **dotenv** - Environment variables

## 📁 Cấu trúc dự án

```
Ecom/
├── backend/                 # Node.js API server
│   ├── config/             # Cấu hình
│   ├── controllers/        # Controllers xử lý logic
│   ├── middleware/         # Middleware xác thực
│   ├── routes/            # API routes
│   ├── utils/             # Tiện ích
│   ├── database.sql       # Database schema
│   └── index.js           # Entry point
│
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── admin/     # Admin components
│   │   │   ├── auth/      # Authentication
│   │   │   ├── customer/  # Customer features
│   │   │   ├── seller/    # Seller dashboard
│   │   │   ├── shipper/   # Shipper features
│   │   │   └── ...
│   │   ├── context/       # React Context
│   │   ├── hooks/         # Custom hooks
│   │   └── router.js      # Routing configuration
│   └── public/            # Static assets
│
└── README.md              # Tài liệu dự án
```

## ⚙️ Cài đặt

### Yêu cầu hệ thống
- Node.js >= 14.x
- PostgreSQL >= 12.x
- npm hoặc yarn

### 1. Clone repository
```bash
git clone <repository-url>
cd Ecom
```

### 2. Cài đặt dependencies
```bash
# Cài đặt root dependencies
npm install

# Cài đặt backend dependencies
cd backend
npm install

# Cài đặt frontend dependencies
cd ../frontend
npm install
```

### 3. Cấu hình Database
```bash
# Tạo database PostgreSQL
createdb ecommerce_db

# Import database schema
psql -d ecommerce_db -f backend/database.sql

# (Tùy chọn) Import dữ liệu mẫu
psql -d ecommerce_db -f backend/mock_data.sql
```

### 4. Cấu hình Environment Variables

#### Backend Environment
Tạo file `.env` trong thư mục `backend/`:
```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ecommerce_db
DB_USER=your_username
DB_PASSWORD=your_password
DATABASE_URL=postgresql://postgres:password@localhost:5432/ecom
JWT_SECRET=your_jwt_secret_key
CLIENT_URL=http://localhost:3000
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

#### Frontend Environment
Tạo file `.env` trong thư mục `frontend/`:
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
REACT_APP_CLOUDINARY_API_KEY=your_cloudinary_api_key
REACT_APP_CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

## 🚀 Cách chạy dự án

### Development mode

#### Chạy Backend
```bash
cd backend
npm run dev
# Server chạy tại: http://localhost:5000
```

#### Chạy Frontend
```bash
cd frontend
npm start
# Client chạy tại: http://localhost:3000
```

### Production mode

#### Build Frontend
```bash
cd frontend
npm run build
```

#### Chạy Backend
```bash
cd backend
npm start
```

## 👥 Vai trò người dùng

### Quyền truy cập theo vai trò:

| Tính năng | Customer | Seller | Admin | Shipper |
|-----------|----------|--------|-------|---------|
| Mua hàng | ✅ | ✅ | ✅ | ✅ |
| Bán hàng | ❌ | ✅ | ❌ | ❌ |
| Quản lý hệ thống | ❌ | ❌ | ✅ | ❌ |
| Giao hàng | ❌ | ❌ | ❌ | ✅ |
| Xem thống kê | ❌ | ✅ | ✅ | ✅ |

## 📡 API Endpoints

### Authentication
- `POST /api/users/login` - Đăng nhập
- `POST /api/users/register` - Đăng ký

### Products
- `GET /api/products` - Lấy danh sách sản phẩm
- `POST /api/products` - Thêm sản phẩm (Seller)
- `PUT /api/products/:id` - Cập nhật sản phẩm (Seller)
- `DELETE /api/products/:id` - Xóa sản phẩm (Seller)

### Orders
- `GET /api/orders` - Lấy đơn hàng
- `POST /api/orders` - Tạo đơn hàng
- `PUT /api/orders/:id/status` - Cập nhật trạng thái đơn hàng

### Cart
- `GET /api/cart` - Lấy giỏ hàng
- `POST /api/cart` - Thêm vào giỏ hàng
- `PUT /api/cart/:id` - Cập nhật giỏ hàng
- `DELETE /api/cart/:id` - Xóa khỏi giỏ hàng

### Admin
- `GET /api/admin/dashboard` - Dashboard admin
- `GET /api/admin/users` - Quản lý người dùng
- `GET /api/admin/sellers` - Quản lý người bán

### Shipper
- `GET /api/shipper/dashboard` - Dashboard shipper
- `GET /api/shipper/orders` - Đơn hàng cần giao
- `PUT /api/shipper/orders/:id/status` - Cập nhật trạng thái giao hàng

## 🗄️ Database Schema

### Bảng chính:
- **Users** - Thông tin người dùng (tất cả vai trò)
- **Sellers** - Thông tin người bán
- **Shipping_units** - Thông tin đơn vị vận chuyển
- **Admins** - Thông tin quản trị viên
- **Products** - Sản phẩm
- **Categories** - Danh mục sản phẩm
- **Orders** - Đơn hàng
- **Order_items** - Chi tiết đơn hàng
- **Carts** - Giỏ hàng
- **Cart_items** - Chi tiết giỏ hàng
- **Payments** - Thanh toán
- **Reviews** - Đánh giá sản phẩm

## 🎨 Screenshots

## 🔧 Troubleshooting

### Lỗi thường gặp:

#### 1. Database connection error
```bash
# Kiểm tra PostgreSQL đã chạy chưa
sudo service postgresql status

# Khởi động PostgreSQL
sudo service postgresql start
```

#### 2. Port đã được sử dụng
```bash
# Tìm process đang sử dụng port
lsof -i :5000
lsof -i :3000

# Kill process
kill -9 <PID>
```

#### 3. Module not found
```bash
# Xóa node_modules và cài đặt lại
rm -rf node_modules package-lock.json
npm install
```

## 🤝 Đóng góp

1. Fork dự án
2. Tạo branch cho feature (`git checkout -b feature/AmazingFeature`)
3. Commit thay đổi (`git commit -m 'Add some AmazingFeature'`)
4. Push lên branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request


## 📞 Liên hệ

- **Developer**: Đặng Hoàng Quân
- **Email**: [lightning1575@gmail.com]
- **GitHub**: [https://github.com/Lightning1507]

## 🙏 Lời cảm ơn

- Xin cảm ơn cô Nguyễn Thị Oanh đã hướng dẫn bọn em trong quá trình xây dựng cơ sở dữ liệu đảm bảo tính toàn vẹn.
- Cảm ơn các thư viện mã nguồn mở đã được sử dụng trong dự án.

---
