import React from 'react';
// In App.js
import { Router, Routes, Route } from './router';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/routes/ProtectedRoute';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
// Import the new components
import ProductManagement from './components/seller/ProductManagement';
import AddProduct from './components/products/AddProduct';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Header />
          <main className="main-content">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/" element={
                <div>
                  <h1>Welcome to our E-commerce Store</h1>
                  <p>This is the homepage content. You'll expand this later.</p>
                </div>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <div>Profile Page (Protected)</div>
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute roles={['admin']}>
                  <div>Admin Dashboard (Protected, Admin Only)</div>
                </ProtectedRoute>
              } />
              <Route path="/seller" element={
                <ProtectedRoute roles={['seller']}>
                  <div>Seller Dashboard (Protected, Seller Only)</div>
                </ProtectedRoute>
              } />
              <Route path="/seller/products" element={
                <ProtectedRoute roles={['seller']}>
                  <ProductManagement />
                </ProtectedRoute>
              } />
              <Route path="/seller/add-product" element={
                <ProtectedRoute roles={['seller']}>
                  <AddProduct />
                </ProtectedRoute>
              } />
              {/* We also need to create an EditProduct component */}
              {/* <Route path="/seller/edit-product/:id" element={
                <ProtectedRoute roles={['seller']}>
                  <EditProduct />
                </ProtectedRoute>
              } /> */}
              <Route path="*" element={<div>Page Not Found</div>} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;