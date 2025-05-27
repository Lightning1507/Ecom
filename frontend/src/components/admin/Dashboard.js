import React from 'react';
import { 
  FiUsers, 
  FiShoppingBag, 
  FiShoppingCart, 
  FiDollarSign,
  FiTrendingUp,
  FiAlertCircle
} from 'react-icons/fi';
import './Dashboard.css';

const Dashboard = () => {
  // Mock data - replace with actual API calls
  const stats = {
    totalUsers: 1250,
    totalSellers: 45,
    totalOrders: 850,
    totalRevenue: 125000,
    activeListings: 2400,
    pendingReviews: 28
  };

  const recentOrders = [
    { id: '1', customer: 'John Doe', amount: 299.99, status: 'Completed' },
    { id: '2', customer: 'Jane Smith', amount: 149.50, status: 'Processing' },
    { id: '3', customer: 'Mike Johnson', amount: 499.99, status: 'Pending' },
    { id: '4', customer: 'Sarah Williams', amount: 89.99, status: 'Completed' }
  ];

  return (
    <div className="admin-dashboard">
      <h1>Dashboard</h1>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon users">
            <FiUsers />
          </div>
          <div className="stat-details">
            <h3>Total Users</h3>
            <p>{stats.totalUsers}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon sellers">
            <FiShoppingBag />
          </div>
          <div className="stat-details">
            <h3>Active Sellers</h3>
            <p>{stats.totalSellers}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orders">
            <FiShoppingCart />
          </div>
          <div className="stat-details">
            <h3>Total Orders</h3>
            <p>{stats.totalOrders}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon revenue">
            <FiDollarSign />
          </div>
          <div className="stat-details">
            <h3>Total Revenue</h3>
            <p>${stats.totalRevenue.toLocaleString()}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon listings">
            <FiTrendingUp />
          </div>
          <div className="stat-details">
            <h3>Active Listings</h3>
            <p>{stats.activeListings}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon reviews">
            <FiAlertCircle />
          </div>
          <div className="stat-details">
            <h3>Pending Reviews</h3>
            <p>{stats.pendingReviews}</p>
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Recent Orders</h2>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map(order => (
                <tr key={order.id}>
                  <td>#{order.id}</td>
                  <td>{order.customer}</td>
                  <td>${order.amount}</td>
                  <td>
                    <span className={`status-badge ${order.status.toLowerCase()}`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 