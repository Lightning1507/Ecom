import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
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
import './App.css';

function App() {
  return (
    <AuthProvider>
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
                    <div>Profile Page (Protected)</div>
                  </ProtectedRoute>
                } />
                <Route path="/products" element={<ProductsList />} />
                <Route path="/admin" element={
                  <ProtectedRoute roles={['admin']}>
                    <div>Admin Dashboard (Protected, Admin Only)</div>
                  </ProtectedRoute>
                } />
                <Route path="/seller" element={<SellerLayout />}>
                  <Route path="dashboard" element={<SellerDashboard />} />
                  <Route path="products" element={<ProductManagement />} />
                  <Route path="add-product" element={<AddProduct />} />
                  <Route path="edit-product/:id" element={<EditProduct />} />
                </Route>
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
    </AuthProvider>
  );
}

export default App;
