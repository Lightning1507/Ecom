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
  FiRefreshCw,
  FiEye,
  FiEdit3,
  FiCheck,
  FiX,
  FiAlertTriangle
} from 'react-icons/fi';

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [estimatedDelivery, setEstimatedDelivery] = useState('');
  const [updating, setUpdating] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const getAuthToken = () => {
    try {
      // First try to get token directly from localStorage
      let token = localStorage.getItem('token');
      if (token) {
        console.log('Found token in localStorage:', token.substring(0, 20) + '...');
        return token;
      }

      // Then try to get from user object
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        console.log('User object from localStorage:', user);
        if (user.token) {
          console.log('Found token in user object:', user.token.substring(0, 20) + '...');
          return user.token;
        }
        if (user.accessToken) {
          console.log('Found accessToken in user object:', user.accessToken.substring(0, 20) + '...');
          return user.accessToken;
        }
      }

      // Try alternative storage keys
      const authToken = localStorage.getItem('authToken');
      if (authToken) {
        console.log('Found authToken:', authToken.substring(0, 20) + '...');
        return authToken;
      }

      console.log('No token found in localStorage');
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
      
      console.log('Fetching orders...');
      console.log('API_BASE_URL:', API_BASE_URL);
      
      const token = getAuthToken();
      
      if (!token) {
        console.log('No authentication token found');
        setError('Authentication required. Please log in as a shipper.');
        return;
      }

      const params = new URLSearchParams({
        status: statusFilter,
        page: page.toString(),
        limit: '10'
      });

      const url = `${API_BASE_URL}/api/shipper/orders?${params}`;
      console.log('Request URL:', url);
      console.log('Request headers:', {
        'Authorization': `Bearer ${token.substring(0, 20)}...`,
        'Content-Type': 'application/json'
      });

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('Response data:', data);

      if (data.success) {
        setOrders(data.orders || []);
        setTotalPages(data.pagination?.pages || 1);
        console.log(`Loaded ${data.orders?.length || 0} orders`);
      } else {
        console.error('API returned error:', data.message);
        setError(data.message || 'Failed to fetch orders');
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(`Failed to load orders: ${err.message}`);
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

  const updateOrderStatus = async (orderId, newStatus, additionalData = {}) => {
    try {
      setUpdating(true);
      const token = getAuthToken();
      
      if (!token) {
        setError('Authentication required. Please log in as a shipper.');
        return;
      }

      const updateData = {
        shipping_status: newStatus,
        ...additionalData
      };

      const response = await fetch(`${API_BASE_URL}/api/shipper/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();

      if (data.success) {
        // Refresh orders list
        await fetchOrders();
        setShowTrackingModal(false);
        setTrackingNumber('');
        setEstimatedDelivery('');
      } else {
        setError(data.message || 'Failed to update order status');
      }
    } catch (err) {
      console.error('Error updating order status:', err);
      setError('Failed to update order status. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleStartDelivery = (order) => {
    setSelectedOrder(order);
    setTrackingNumber(order.tracking_number || '');
    setEstimatedDelivery('');
    setShowTrackingModal(true);
  };

  const handleMarkDelivered = async (orderId) => {
    if (window.confirm('Are you sure you want to mark this order as delivered?')) {
      await updateOrderStatus(orderId, 'delivered');
    }
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const handleTrackingSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;

    const additionalData = {};
    if (trackingNumber.trim()) {
      additionalData.tracking_number = trackingNumber.trim();
    }
    if (estimatedDelivery) {
      additionalData.estimated_delivery = estimatedDelivery;
    }

    await updateOrderStatus(selectedOrder.order_id, 'in_transit', additionalData);
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
        <button 
          onClick={() => {
            console.log('=== DEBUG INFO ===');
            console.log('API_BASE_URL:', API_BASE_URL);
            console.log('localStorage keys:', Object.keys(localStorage));
            console.log('localStorage.token:', localStorage.getItem('token'));
            console.log('localStorage.user:', localStorage.getItem('user'));
            console.log('localStorage.authToken:', localStorage.getItem('authToken'));
            const user = localStorage.getItem('user');
            if (user) {
              try {
                const userObj = JSON.parse(user);
                console.log('Parsed user object:', userObj);
              } catch (e) {
                console.log('Error parsing user object:', e);
              }
            }
            console.log('Current user role check...');
            const token = getAuthToken();
            console.log('Retrieved token:', token);
          }}
          className="refresh-btn"
          style={{ marginLeft: '0.5rem', background: '#f59e0b' }}
        >
          <FiAlertTriangle /> Debug
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
                <button 
                  className="action-btn primary"
                  onClick={() => handleViewDetails(order)}
                >
                  <FiEye /> View Details
                </button>
                {order.shipping_status === 'preparing' && (
                  <button 
                    className="action-btn secondary"
                    onClick={() => handleStartDelivery(order)}
                    disabled={updating}
                  >
                    <FiTruck /> Start Delivery
                  </button>
                )}
                {order.shipping_status === 'in_transit' && (
                  <button 
                    className="action-btn success"
                    onClick={() => handleMarkDelivered(order.order_id)}
                    disabled={updating}
                  >
                    <FiCheck /> Mark Delivered
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

      {/* Tracking Number Modal */}
      {showTrackingModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowTrackingModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Start Delivery - Order #{selectedOrder.order_id}</h3>
              <button 
                className="modal-close"
                onClick={() => setShowTrackingModal(false)}
              >
                <FiX />
              </button>
            </div>
            <form onSubmit={handleTrackingSubmit} className="modal-form">
              <div className="form-group">
                <label htmlFor="tracking-number">Tracking Number (Optional)</label>
                <input
                  id="tracking-number"
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Enter tracking number"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="estimated-delivery">Estimated Delivery Date (Optional)</label>
                <input
                  id="estimated-delivery"
                  type="date"
                  value={estimatedDelivery}
                  onChange={(e) => setEstimatedDelivery(e.target.value)}
                  className="form-input"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => setShowTrackingModal(false)}
                  disabled={updating}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={updating}
                >
                  {updating ? 'Starting...' : 'Start Delivery'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowOrderDetails(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Order Details - #{selectedOrder.order_id}</h3>
              <button 
                className="modal-close"
                onClick={() => setShowOrderDetails(false)}
              >
                <FiX />
              </button>
            </div>
            <div className="order-details-content">
              <div className="details-section">
                <h4>Order Information</h4>
                <div className="details-grid">
                  <div className="detail-item">
                    <span className="label">Order ID:</span>
                    <span className="value">#{selectedOrder.order_id}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Order Date:</span>
                    <span className="value">
                      {new Date(selectedOrder.order_date).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Status:</span>
                    <span 
                      className="value status-badge"
                      style={{ color: getStatusColor(selectedOrder.shipping_status) }}
                    >
                      {getStatusLabel(selectedOrder.shipping_status)}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Total Amount:</span>
                    <span className="value">{formatCurrency(selectedOrder.total_amount)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Tracking Number:</span>
                    <span className="value">{selectedOrder.tracking_number || 'Not assigned'}</span>
                  </div>
                  {selectedOrder.estimated_delivery && (
                    <div className="detail-item">
                      <span className="label">Est. Delivery:</span>
                      <span className="value">
                        {new Date(selectedOrder.estimated_delivery).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="details-section">
                <h4>Customer Information</h4>
                <div className="details-grid">
                  <div className="detail-item">
                    <FiUser className="detail-icon" />
                    <span className="label">Name:</span>
                    <span className="value">{selectedOrder.customer_name}</span>
                  </div>
                  <div className="detail-item">
                    <FiPhone className="detail-icon" />
                    <span className="label">Phone:</span>
                    <span className="value">{selectedOrder.customer_phone}</span>
                  </div>
                  <div className="detail-item">
                    <FiMail className="detail-icon" />
                    <span className="label">Email:</span>
                    <span className="value">{selectedOrder.customer_email}</span>
                  </div>
                  <div className="detail-item">
                    <FiMapPin className="detail-icon" />
                    <span className="label">Address:</span>
                    <span className="value">{selectedOrder.customer_address}</span>
                  </div>
                </div>
              </div>

              <div className="details-section">
                <h4>Store Information</h4>
                <div className="details-grid">
                  <div className="detail-item">
                    <FiPackage className="detail-icon" />
                    <span className="label">Store Name:</span>
                    <span className="value">{selectedOrder.store_name}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManagement; 