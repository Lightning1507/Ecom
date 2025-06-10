import React, { useState, useEffect, useContext, useCallback } from 'react';
import { 
  FiSearch, 
  FiRefreshCw,
  FiEye,
  FiPackage,
  FiTruck,
  FiCheck,
  FiX,
  FiAlertCircle
} from 'react-icons/fi';
import { AuthContext } from '../../context/AuthContext';
import './OrdersManagement.css';
import './Modal.css';

const OrdersManagement = () => {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Helper function to get auth token
  const getAuthToken = useCallback(() => {
    return user?.token || localStorage.getItem('token');
  }, [user?.token]);

  // Fetch orders from API
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getAuthToken();

      if (!token) {
        setError('Authentication required');
        return;
      }

      const queryParams = new URLSearchParams({
        search: searchTerm,
        status: statusFilter,
        date: dateFilter,
        sort: `${sortBy}-${sortOrder}`,
        limit: '100' // Get more orders for better filtering experience
      });

      const response = await fetch(`${API_BASE_URL}/api/admin/orders?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setOrders(data.orders);
        setFilteredOrders(data.orders);
      } else {
        setError(data.message || 'Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, getAuthToken, searchTerm, statusFilter, dateFilter, sortBy, sortOrder]);

  // Load orders on component mount and when filters change
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Apply local filtering (for immediate feedback)
  useEffect(() => {
    let filtered = orders;

    // Apply search filter locally for immediate feedback
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.trackingNumber && order.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredOrders(filtered);
  }, [orders, searchTerm]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleReset = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDateFilter('all');
    setSortBy('date');
    setSortOrder('desc');
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      const token = getAuthToken();
      const orderIdNum = orderId.replace('ORD-', ''); // Remove prefix for API

      const response = await fetch(`${API_BASE_URL}/api/admin/orders/${orderIdNum}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();

      if (data.success) {
        // Update the order in the local state
        setOrders(orders.map(order => {
          if (order.orderId === parseInt(orderIdNum)) {
            return { ...order, status: newStatus };
          }
          return order;
        }));
      } else {
        alert(data.message || 'Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    }
  };

  const handlePaymentStatusUpdate = async (orderId, newPaymentStatus) => {
    try {
      const token = getAuthToken();
      const orderIdNum = orderId.replace('ORD-', ''); // Remove prefix for API

      const response = await fetch(`${API_BASE_URL}/api/admin/orders/${orderIdNum}/payment-status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ paymentStatus: newPaymentStatus })
      });

      const data = await response.json();

      if (data.success) {
        // Update the payment status in the local state
        setOrders(orders.map(order => {
          if (order.orderId === parseInt(orderIdNum)) {
            return { ...order, paymentStatus: newPaymentStatus };
          }
          return order;
        }));
      } else {
        alert(data.message || 'Failed to update payment status');
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert('Failed to update payment status');
    }
  };

  const handleViewOrder = async (orderId) => {
    try {
      const token = getAuthToken();
      const orderIdNum = orderId.replace('ORD-', ''); // Remove prefix for API

      const response = await fetch(`${API_BASE_URL}/api/admin/orders/${orderIdNum}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setSelectedOrder(data.order);
        setShowDetailsModal(true);
      } else {
        alert(data.message || 'Failed to fetch order details');
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      alert('Failed to fetch order details');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <FiAlertCircle />;
      case 'confirmed':
      case 'processing':
        return <FiPackage />;
      case 'shipped':
        return <FiTruck />;
      case 'delivered':
        return <FiCheck />;
      case 'cancelled':
        return <FiX />;
      default:
        return null;
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="orders-management">
      <div className="page-header">
        <h1>Orders Management</h1>
        <div className="header-stats">
          <div className="stat">
            <span className="stat-number">{filteredOrders.length}</span>
            <span className="stat-label">Orders</span>
          </div>
        </div>
      </div>

      <div className="filters-section">
        <div className="search-box">
          <FiSearch />
          <input
            type="text"
            placeholder="Search by order ID, customer name, or tracking number..."
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>

        <div className="filters">
          <div className="filter-group">
            <label>Status:</label>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Date:</label>
            <select 
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Sort By:</label>
            <select 
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [newSortBy, newSortOrder] = e.target.value.split('-');
                setSortBy(newSortBy);
                setSortOrder(newSortOrder);
              }}
            >
              <option value="date-desc">Date (Newest First)</option>
              <option value="date-asc">Date (Oldest First)</option>
              <option value="total-desc">Total (High to Low)</option>
              <option value="total-asc">Total (Low to High)</option>
              <option value="items-desc">Items (Most First)</option>
              <option value="items-asc">Items (Least First)</option>
            </select>
          </div>

          <button className="btn-icon" onClick={handleReset} title="Reset Filters">
            <FiRefreshCw />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading">
          <p>Loading orders...</p>
        </div>
      ) : error ? (
        <div className="error">
          <p>Error: {error}</p>
          <button onClick={fetchOrders} className="btn-primary">
            Retry
          </button>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => (
                  <tr key={order.orderId}>
                    <td>{order.id}</td>
                    <td>{order.customer}</td>
                    <td>{formatDate(order.date)}</td>
                    <td>{order.items}</td>
                    <td>{formatCurrency(order.total)}</td>
                    <td>
                      <span className={`status-badge ${order.status}`}>
                        {getStatusIcon(order.status)}
                        <span>{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
                      </span>
                    </td>
                    <td>
                      <div className="payment-status-container">
                        <span className={`payment-badge ${order.paymentStatus}`}>
                          {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                        </span>
                        <select
                          className="payment-status-update"
                          value={order.paymentStatus}
                          onChange={(e) => handlePaymentStatusUpdate(order.id, e.target.value)}
                          title="Update payment status"
                        >
                          <option value="pending">Pending</option>
                          <option value="completed">Completed</option>
                          <option value="failed">Failed</option>
                          <option value="refunded">Refunded</option>
                        </select>
                      </div>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn-icon" 
                          title="View Order Details"
                          onClick={() => handleViewOrder(order.id)}
                        >
                          <FiEye />
                        </button>
                        {order.status !== 'delivered' && order.status !== 'cancelled' && (
                          <select
                            className="status-update"
                            value={order.status}
                            onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                          >
                            <option value="pending">Mark Pending</option>
                            <option value="confirmed">Mark Confirmed</option>
                            <option value="shipped">Mark Shipped</option>
                            <option value="delivered">Mark Delivered</option>
                            <option value="cancelled">Mark Cancelled</option>
                          </select>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredOrders.length === 0 && !loading && (
            <div className="no-results">
              <p>No orders found matching your search criteria.</p>
            </div>
          )}
        </>
      )}

      {/* Order Details Modal */}
      {showDetailsModal && selectedOrder && (
        <div className="modal-overlay">
          <div className="modal large">
            <div className="modal-header">
              <h2>Order Details - {selectedOrder.id}</h2>
              <button className="modal-close" onClick={() => setShowDetailsModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="order-details">
                <div className="order-section">
                  <h3>Order Information</h3>
                  <div className="detail-grid">
                    <div className="detail-group">
                      <label>Order ID:</label>
                      <span>{selectedOrder.id}</span>
                    </div>
                    <div className="detail-group">
                      <label>Date:</label>
                      <span>{formatDate(selectedOrder.date)}</span>
                    </div>
                    <div className="detail-group">
                      <label>Status:</label>
                      <span className={`status-badge ${selectedOrder.status}`}>
                        {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="order-section">
                  <h3>Customer Information</h3>
                  <div className="detail-grid">
                    <div className="detail-group">
                      <label>Name:</label>
                      <span>{selectedOrder.customer?.name || 'N/A'}</span>
                    </div>
                    <div className="detail-group">
                      <label>Email:</label>
                      <span>{selectedOrder.customer?.email || 'N/A'}</span>
                    </div>
                    <div className="detail-group">
                      <label>Phone:</label>
                      <span>{selectedOrder.customer?.phone || 'N/A'}</span>
                    </div>
                    <div className="detail-group">
                      <label>Address:</label>
                      <span>{selectedOrder.customer?.address || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="order-section">
                  <h3>Payment Information</h3>
                  <div className="detail-grid">
                    <div className="detail-group">
                      <label>Amount:</label>
                      <span>{formatCurrency(selectedOrder.payment?.amount || 0)}</span>
                    </div>
                    <div className="detail-group">
                      <label>Status:</label>
                      <span className={`payment-badge ${selectedOrder.payment?.status}`}>
                        {selectedOrder.payment?.status?.charAt(0).toUpperCase() + selectedOrder.payment?.status?.slice(1) || 'N/A'}
                      </span>
                    </div>
                    <div className="detail-group">
                      <label>Method:</label>
                      <span>{selectedOrder.payment?.method || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {selectedOrder.shipping && (
                  <div className="order-section">
                    <h3>Shipping Information</h3>
                    <div className="detail-grid">
                      <div className="detail-group">
                        <label>Tracking Number:</label>
                        <span>{selectedOrder.shipping.trackingNumber || 'N/A'}</span>
                      </div>
                      <div className="detail-group">
                        <label>Status:</label>
                        <span>{selectedOrder.shipping.status || 'N/A'}</span>
                      </div>
                      <div className="detail-group">
                        <label>Company:</label>
                        <span>{selectedOrder.shipping.company || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="order-section">
                  <h3>Order Items</h3>
                  <div className="items-list">
                    {selectedOrder.items?.map((item, index) => (
                      <div key={index} className="order-item">
                        <div className="item-info">
                          <span className="item-name">{item.name}</span>
                          <span className="item-quantity">Qty: {item.quantity}</span>
                        </div>
                        <div className="item-price">
                          <span>{formatCurrency(item.price)} x {item.quantity}</span>
                          <span className="item-total">{formatCurrency(item.total)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => setShowDetailsModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersManagement; 