import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  FiHome, 
  FiUsers, 
  FiShoppingBag, 
  FiShoppingCart, 
  FiBarChart2, 
  FiSettings,
  FiTag,
  FiMessageSquare
} from 'react-icons/fi';
import './AdminSidebar.css';

const AdminSidebar = () => {
  return (
    <div className="admin-sidebar">
      <div className="sidebar-header">
        <h2>Admin Panel</h2>
      </div>
      <nav className="sidebar-nav">
        <NavLink to="/admin/dashboard" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <FiHome /> Dashboard
        </NavLink>
        <NavLink to="/admin/users" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <FiUsers /> Users
        </NavLink>
        <NavLink to="/admin/sellers" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <FiShoppingBag /> Sellers
        </NavLink>
        <NavLink to="/admin/products" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <FiTag /> Products
        </NavLink>
        <NavLink to="/admin/orders" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <FiShoppingCart /> Orders
        </NavLink>
        <NavLink to="/admin/analytics" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <FiBarChart2 /> Analytics
        </NavLink>
        <NavLink to="/admin/reviews" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <FiMessageSquare /> Reviews
        </NavLink>
        <NavLink to="/admin/settings" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <FiSettings /> Settings
        </NavLink>
      </nav>
    </div>
  );
};

export default AdminSidebar; 