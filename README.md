# 🛒 E-Commerce Platform

A full-featured e-commerce platform built with React and Node.js, supporting multiple user roles including customers, sellers, administrators, and shippers.

## 📋 Table of Contents

- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Running the Project](#running-the-project)
- [User Roles](#user-roles)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Contributing](#contributing)

## ✨ Key Features

### 🛍️ Customer
- Register/Login
- Browse and search products
- Add products to cart
- Checkout
- Track order status
- Rate and review products
- Manage personal profile

### 🏪 Seller
- Sales management dashboard
- Add/Edit/Delete products
- Inventory management
- Process orders
- View statistical reports
- Store management

### 👨‍💼 Admin
- System overview dashboard
- User management
- Seller management
- Order management
- Statistics and reports
- Product category management
- Review management

### 🚚 Shipper
- Shipping dashboard
- Manage assigned orders
- Update delivery status
- Route planning
- Delivery statistics

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI Library
- **React Router DOM** - Routing
- **Chart.js & Recharts** - Charts
- **Framer Motion** - Animation
- **React Icons** - Icon set
- **CSS3** - Styling

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Multer** - File upload
- **Cloudinary** - Image storage
- **CORS** - Cross-origin resource sharing

### DevOps & Tools
- **Nodemon** - Hot reload development
- **CRACO** - Create React App Configuration Override
- **dotenv** - Environment variables

## 📁 Project Structure

```
Ecom/
├── backend/               # Node.js API server
│   ├── config/            # Config   
│   ├── controllers/       # Controllers (business logic)
│   ├── middleware/        # Auth Middleware
│   ├── routes/            # API routes
│   ├── utils/             # Utilities
│   ├── database.sql       # Database schema
│   └── index.js           # Entry point
│
├── frontend/              # React frontend
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
└── README.md              # Project documentation
```

## ⚙️ Installation

### Prerequisites
- Node.js >= 14.x
- PostgreSQL >= 12.x
- npm or yarn

### 1. Clone repository
```bash
git clone <repository-url>
cd Ecom
```

### 2. Install dependencies
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Database Setup
```bash
# Create PostgreSQL database
createdb ecommerce_db

# Import database schema
psql -d ecommerce_db -f backend/database.sql

# (Optional) Import mock data
psql -d ecommerce_db -f backend/mock_data.sql
```

### 4. Configure Environment Variables

#### Backend Environment
Create a `.env` file in the `backend/` directory:
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
Create a `.env` file in the `frontend/` directory:
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
REACT_APP_CLOUDINARY_API_KEY=your_cloudinary_api_key
REACT_APP_CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

## 🚀 Running the Project

### Development mode

#### Run Backend
```bash
cd backend
npm run dev
# Server runs at: http://localhost:5000
```

#### Run Frontend
```bash
cd frontend
npm start
# Client runs at: http://localhost:3000
```

### Production mode

#### Build Frontend
```bash
cd frontend
npm run build
```

#### Run Backend
```bash
cd backend
npm start
```

## 👥 User Roles

### Role-based access control:

| Feature | Customer | Seller | Admin | Shipper |
|-----------|----------|--------|-------|---------|
| Purchasing | ✅ | ✅ | ✅ | ✅ |
| Selling | ❌ | ✅ | ❌ | ❌ |
| System Management | ❌ | ❌ | ✅ | ❌ |
| Shipping | ❌ | ❌ | ❌ | ✅ |
| View Statistics | ❌ | ✅ | ✅ | ✅ |

## 📡 API Endpoints

### Authentication
- `POST /api/users/login` - Login
- `POST /api/users/register` - Register

### Products
- `GET /api/products` - Get products
- `POST /api/products` - Add product (Seller)
- `PUT /api/products/:id` - Update product (Seller)
- `DELETE /api/products/:id` - Delete product (Seller)

### Orders
- `GET /api/orders` - Get orders
- `POST /api/orders` - Create order
- `PUT /api/orders/:id/status` - Update order status

### Cart
- `GET /api/cart` - Get cart
- `POST /api/cart` - Add to cart
- `PUT /api/cart/:id` - Update cart
- `DELETE /api/cart/:id` - Remove from cart

### Admin
- `GET /api/admin/dashboard` - Admin dashboard
- `GET /api/admin/users` - Manage users
- `GET /api/admin/sellers` - Manage sellers

### Shipper
- `GET /api/shipper/dashboard` - Shipper dashboard
- `GET /api/shipper/orders` - Orders to deliver
- `PUT /api/shipper/orders/:id/status` - Update delivery status

## 🗄️ Database Schema

### Main Tables:
- **Users** - User information (all roles)
- **Sellers** - Seller information
- **Shipping_units** - Shipper unit information
- **Admins** - Admin information
- **Products** - Products
- **Categories** - Product categories
- **Orders** - Orders
- **Order_items** - Order items
- **Carts** - Carts
- **Cart_items** - Cart items
- **Payments** - Payments
- **Reviews** - Product reviews

## 🎨 Screenshots

## 🔧 Troubleshooting

### Common Issues:

#### 1. Database connection error
```bash
# Check if PostgreSQL is running
sudo service postgresql status

# Start PostgreSQL
sudo service postgresql start
```

#### 2. Port already in use
```bash
# Find process using port
lsof -i :5000
lsof -i :3000

# Kill process
kill -9 <PID>
```

#### 3. Module not found
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (git checkout -b feature/AmazingFeature)
3. Commit your changes (git commit -m 'Add some AmazingFeature')
4. Push to the branch (git push origin feature/AmazingFeature)
5. Open a Pull Request


## 📞 Contact

- **Developer**: Dang Hoang Quan
- **Email**: [lightning1575@gmail.com]
- **GitHub**: [https://github.com/Lightning1507]

## 🙏 Acknowledgements

- Thank you to Ms. Nguyen Thi Oanh for guiding me in building a database with integrity.
- Thank you to the open-source libraries used in this project.

---
