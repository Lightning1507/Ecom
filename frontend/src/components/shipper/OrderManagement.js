import React, { useState, useEffect, useCallback } from 'react';
import { 
  FiPackage, 
  FiTruck, 
  FiMapPin, 
  FiClock,
  FiPhone,
  FiMail,
  FiUser,
  FiFilter,
  FiRefreshCw
} from 'react-icons/fi';

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const getAuthToken = () => {
    try {
      let token = localStorage.getItem('token');
      if (token) return token;

      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.token) return user.token;
      }
      return null;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  };

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getAuthToken();
      
      if (!token) {
        setError('Authentication required. Please log in as a shipper.');
        return;
      }

      const params = new URLSearchParams({
        status: statusFilter,
        page: page.toString(),
        limit: '10'
      });

      const response = await fetch(`${API_BASE_URL}/api/shipper/orders?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setOrders(data.orders);
        setTotalPages(data.pagination.pages);
      } else {
        setError(data.message || 'Failed to fetch orders');
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page, API_BASE_URL]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'preparing':
        return '#f59e0b';
      case 'in_transit':
        return '#3b82f6';
      case 'delivered':
        return '#10b981';
      case 'returned':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'preparing':
        return 'Preparing';
      case 'in_transit':
        return 'In Transit';
      case 'delivered':
        return 'Delivered';
      case 'returned':
        return 'Returned';
      default:
        return 'Unknown';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <h2>Loading orders...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Order Management</h1>
        <p>Manage your delivery assignments</p>
      </div>

      {/* Filter Controls */}
      <div className="filter-controls">
        <div className="filter-group">
          <FiFilter className="filter-icon" />
          <select 
            value={statusFilter} 
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="filter-select"
          >
            <option value="all">All Orders</option>
            <option value="preparing">Preparing</option>
            <option value="in_transit">In Transit</option>
            <option value="delivered">Delivered</option>
            <option value="returned">Returned</option>
          </select>
        </div>
        <button onClick={fetchOrders} className="refresh-btn">
          <FiRefreshCw /> Refresh
        </button>
      </div>

      {error && (
        <div className="error-state">
          <p>{error}</p>
          <button onClick={fetchOrders} className="retry-btn">
            Try Again
          </button>
        </div>
      )}

      {/* Orders List */}
      {orders.length > 0 ? (
        <div className="orders-grid">
          {orders.map((order) => (
            <div key={order.order_id} className="order-card">
              <div className="order-header">
                <div className="order-info">
                  <h3>Order #{order.order_id}</h3>
                  <p className="tracking-number">
                    Tracking: {order.tracking_number || 'Not assigned'}
                  </p>
                  <div 
                    className="order-status"
                    style={{ color: getStatusColor(order.shipping_status) }}
                  >
                    {getStatusLabel(order.shipping_status)}
                  </div>
                </div>
                <div className="order-amount">
                  {formatCurrency(order.total_amount)}
                </div>
              </div>

              <div className="order-details">
                <div className="customer-info">
                  <h4>Customer Information</h4>
                  <div className="detail-item">
                    <FiUser className="detail-icon" />
                    <span>{order.customer_name}</span>
                  </div>
                  <div className="detail-item">
                    <FiPhone className="detail-icon" />
                    <span>{order.customer_phone}</span>
                  </div>
                  <div className="detail-item">
                    <FiMail className="detail-icon" />
                    <span>{order.customer_email}</span>
                  </div>
                  <div className="detail-item">
                    <FiMapPin className="detail-icon" />
                    <span>{order.customer_address}</span>
                  </div>
                </div>

                <div className="order-meta">
                  <div className="detail-item">
                    <FiClock className="detail-icon" />
                    <span>
                      Order Date: {new Date(order.order_date).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  {order.estimated_delivery && (
                    <div className="detail-item">
                      <FiTruck className="detail-icon" />
                      <span>
                        Est. Delivery: {new Date(order.estimated_delivery).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  )}
                  <div className="detail-item">
                    <FiPackage className="detail-icon" />
                    <span>Store: {order.store_name}</span>
                  </div>
                </div>
              </div>

              <div className="order-actions">
                <button className="action-btn primary">
                  View Details
                </button>
                {order.shipping_status === 'preparing' && (
                  <button className="action-btn secondary">
                    Start Delivery
                  </button>
                )}
                {order.shipping_status === 'in_transit' && (
                  <button className="action-btn success">
                    Mark Delivered
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <FiPackage size={48} color="#9ca3af" />
          <h3>No Orders Found</h3>
          <p>No orders match your current filters.</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="pagination-btn"
          >
            Previous
          </button>
          <span className="pagination-info">
            Page {page} of {totalPages}
          </span>
          <button 
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="pagination-btn"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default OrderManagement; 