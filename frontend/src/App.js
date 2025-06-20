import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import ProtectedRoute from './components/routes/ProtectedRoute';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Home from './components/Home';
import SellerLayout from './components/seller/SellerLayout';
import SellerDashboard from './components/seller/Dashboard';
import ProductManagement from './components/seller/Products';
import AddProduct from './components/products/AddProduct';
import EditProduct from './components/products/EditProduct';
import ProductsList from './components/products/ProductsList';
import ProductDetail from './components/products/ProductDetail';
import Profile from './components/Profile/Profile';
import Cart from './components/Cart/Cart';
import Checkout from './components/Checkout/Checkout';
import Category from './components/Category/Category';
import Orders from './components/orders/Orders';
import SellerOrders from './components/seller/SellerOrders';
import SellerAnalytics from './components/seller/SellerAnalytics';
import SellerSettings from './components/seller/SellerSettings';
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './components/admin/Dashboard';
import UserManagement from './components/admin/UserManagement';
import SellerManagement from './components/admin/SellerManagement';
import AdminProductManagement from './components/admin/ProductManagement';
import OrdersManagement from './components/admin/OrdersManagement';
import AnalyticsDashboard from './components/admin/AnalyticsDashboard';
import ReviewsManagement from './components/admin/ReviewsManagement';
import Settings from './components/admin/Settings';
import CustomerReviews from './components/customer/CustomerReviews';
import Shops from './components/shops/Shops';
import ShopDetail from './components/shops/ShopDetail';
import ShipperDashboard from './components/shipper/ShipperDashboard';
import ShipperDashboardContent from './components/shipper/Dashboard';
import ShipperOrderManagement from './components/shipper/OrderManagement';
import ShipperDeliveryRoutes from './components/shipper/DeliveryRoutes';
import ShipperAnalyticsContent from './components/shipper/ShipperAnalytics';
import ShipperProfileContent from './components/shipper/ShipperProfile';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <div className="App">
            <Header />
            <main className="main-content">
            <div className="container">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/" element={<Home />} />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={
                  <ProtectedRoute>
                    <Checkout />
                  </ProtectedRoute>
                } />
                <Route path="/categories" element={<Category />} />
                <Route path="/category/:id" element={<ProductsList />} />
                <Route path="/products" element={<ProductsList />} />
                <Route path="/products/:id" element={<ProductDetail />} />
                <Route path="/shops" element={<Shops />} />
                <Route path="/shops/:id" element={<ShopDetail />} />
                
                {/* Shipper Routes */}
                <Route path="/shipper" element={
                  <ProtectedRoute roles={['shipper']}>
                    <ShipperDashboard />
                  </ProtectedRoute>
                }>
                  <Route path="dashboard" element={<ShipperDashboardContent />} />
                  <Route path="orders" element={<ShipperOrderManagement />} />
                  <Route path="routes" element={<ShipperDeliveryRoutes />} />
                  <Route path="analytics" element={<ShipperAnalyticsContent />} />
                  <Route path="profile" element={<ShipperProfileContent />} />
                </Route>
                
                {/* Admin Routes */}
                <Route path="/admin" element={
                  <ProtectedRoute roles={['admin']}>
                    <AdminLayout />
                  </ProtectedRoute>
                }>
                  <Route index element={<Navigate to="/admin/dashboard" replace />} />
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="users" element={<UserManagement />} />
                  <Route path="sellers" element={<SellerManagement />} />
                  <Route path="products" element={<AdminProductManagement />} />
                  <Route path="orders" element={<OrdersManagement />} />
                  <Route path="analytics" element={<AnalyticsDashboard />} />
                  <Route path="reviews" element={<ReviewsManagement />} />
                  <Route path="settings" element={<Settings />} />
                </Route>

                {/* Seller Routes */}
                <Route path="/seller" element={
                  <ProtectedRoute roles={['seller']}>
                    <SellerLayout />
                  </ProtectedRoute>
                }>
                  <Route path="dashboard" element={<SellerDashboard />} />
                  <Route path="products" element={<ProductManagement />} />
                  <Route path="orders" element={<SellerOrders />} />
                  <Route path="analytics" element={<SellerAnalytics />} />
                  <Route path="settings" element={<SellerSettings />} />
                  <Route path="add-product" element={<AddProduct />} />
                  <Route path="edit-product/:id" element={<EditProduct />} />
                </Route>

                <Route path="/orders" element={
                  <ProtectedRoute>
                    <Orders />
                  </ProtectedRoute>
                } />
                <Route path="/reviews" element={
                  <ProtectedRoute>
                    <CustomerReviews />
                  </ProtectedRoute>
                } />
                <Route path="*" element={
                  <div>
                    <h2>Page Not Found</h2>
                    <p>The page you're looking for doesn't exist or you don't have permission to view it.</p>
                    <p>Current URL: {window.location.pathname}</p>
                  </div>
                } />
              </Routes>
            </div>
          </main>
          <Footer />
        </div>
      </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
