import React, { useState, useEffect } from 'react';
import { FiSearch, FiFilter, FiPackage, FiTruck, FiCheck, FiX } from 'react-icons/fi';
import './SellerOrders.css';

const OrderStatusBadge = ({ status }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'pending':
        return 'status-pending';
      case 'confirmed':
        return 'status-processing';
      case 'shipped':
        return 'status-shipped';
      case 'delivered':
        return 'status-delivered';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return '';
    }
  };

  return (
    <span className={`status-badge ${getStatusColor()}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const SellerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Helper function to get authentication token
  const getAuthToken = () => {
    try {
      // First check for direct token storage
      let token = localStorage.getItem('token');
      if (token) return token;

      // Then check for token inside user object
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

  // Helper function to get user info
  const getUserInfo = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        return JSON.parse(userStr);
      }
      return null;
    } catch (error) {
      console.error('Error getting user info:', error);
      return null;
    }
  };

  // Fetch orders from API
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const user = getUserInfo();
      
      // Debug information
      console.log('Debug Info:');
      console.log('Token exists:', !!token);
      console.log('Token value:', token ? token.substring(0, 20) + '...' : 'null');
      console.log('User exists:', !!user);
      console.log('User info:', user);
      console.log('All localStorage keys:', Object.keys(localStorage));
      
      if (!token) {
        setError('Authentication required. Please log in as a seller.');
        return;
      }

      if (!user || user.role !== 'seller') {
        setError('Access denied. This page is only available for sellers.');
        return;
      }

      const response = await fetch('http://localhost:5000/api/orders/seller/orders', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      const data = await response.json();
      console.log('Response data:', data);

      if (data.success) {
        setOrders(data.orders);
        setError(null);
      } else {
        setError(data.message || 'Failed to fetch orders');
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const token = getAuthToken();
      
      const response = await fetch(`http://localhost:5000/api/orders/seller/orders/${orderId}/status`, {
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
        setOrders(orders.map(order =>
          order.id === orderId ? { ...order, status: newStatus } : order
        ));
        
        // Update selectedOrder if it's the one being updated
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus });
        }
      } else {
        setError(data.message || 'Failed to update order status');
      }
    } catch (err) {
      console.error('Error updating order status:', err);
      setError('Failed to update order status. Please try again.');
    }
  };

  const fetchOrderDetails = async (orderId) => {
    try {
      const token = getAuthToken();
      
      const response = await fetch(`http://localhost:5000/api/orders/seller/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setSelectedOrder(data.order);
      } else {
        setError(data.message || 'Failed to fetch order details');
      }
    } catch (err) {
      console.error('Error fetching order details:', err);
      setError('Failed to load order details. Please try again.');
    }
  };

  const handleViewOrder = (order) => {
    // For basic view, we can use the order data we already have
    // For detailed view, we could fetch additional details
    setSelectedOrder(order);
    // Uncomment the line below if you want to fetch fresh details each time
    // fetchOrderDetails(order.id);
  };

  if (loading) {
    return (
      <div className="seller-orders">
        <div className="loading-state">
          <p>Loading orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const user = getUserInfo();
    return (
      <div className="seller-orders">
        <div className="error-state">
          <p>Error: {error}</p>
          <button onClick={fetchOrders} className="retry-btn">
            Try Again
          </button>
          <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#666' }}>
            <p>Debug Info (check browser console for more details):</p>
            <p>Token in localStorage: {getAuthToken() ? 'Yes' : 'No'}</p>
            <p>User in localStorage: {user ? 'Yes' : 'No'}</p>
            {user && (
              <p>User role: {user.role} {user.role !== 'seller' && '(Need seller role)'}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="seller-orders">
      <div className="orders-header">
        <h1>Orders Management</h1>
        <div className="orders-actions">
          <div className="search-bar">
            <FiSearch />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-dropdown">
            <FiFilter />
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
          <button onClick={fetchOrders} className="refresh-btn">
            Refresh
          </button>
        </div>
      </div>

      <div className="orders-list">
        {filteredOrders.length === 0 ? (
          <div className="empty-state">
            <p>No orders found.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => (
                <tr key={order.id}>
                  <td>#{order.id}</td>
                  <td>{order.customer}</td>
                  <td>{new Date(order.date).toLocaleDateString()}</td>
                  <td>{order.items.length} items</td>
                  <td>{new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  }).format(order.total)}</td>
                  <td>
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td>
                    <div className="order-actions">
                      <button
                        className="action-btn view-btn"
                        onClick={() => handleViewOrder(order)}
                      >
                        View
                      </button>
                      {order.status === 'pending' && (
                        <button
                          className="action-btn process-btn"
                          onClick={() => updateOrderStatus(order.id, 'confirmed')}
                        >
                          Confirm
                        </button>
                      )}
                      {order.status === 'confirmed' && (
                        <button
                          className="action-btn ship-btn"
                          onClick={() => updateOrderStatus(order.id, 'shipped')}
                        >
                          Ship
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedOrder && (
        <div className="order-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Order Details - #{selectedOrder.id}</h2>
              <button className="close-btn" onClick={() => setSelectedOrder(null)}>
                <FiX />
              </button>
            </div>
            <div className="modal-body">
              <div className="order-info">
                <p><strong>Customer:</strong> {selectedOrder.customer}</p>
                <p><strong>Date:</strong> {new Date(selectedOrder.date).toLocaleString()}</p>
                <p><strong>Status:</strong> <OrderStatusBadge status={selectedOrder.status} /></p>
                {selectedOrder.customer_email && (
                  <p><strong>Email:</strong> {selectedOrder.customer_email}</p>
                )}
                {selectedOrder.payment_method && (
                  <p><strong>Payment Method:</strong> {selectedOrder.payment_method}</p>
                )}
                {selectedOrder.payment_status && (
                  <p><strong>Payment Status:</strong> {selectedOrder.payment_status}</p>
                )}
              </div>
              <div className="order-items">
                <h3>Items</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Quantity</th>
                      <th>Price</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items.map((item, index) => (
                      <tr key={index}>
                        <td>{item.name}</td>
                        <td>{item.quantity}</td>
                        <td>{new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        }).format(item.price)}</td>
                        <td>{new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        }).format(item.quantity * item.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="3"><strong>Total</strong></td>
                      <td><strong>{new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      }).format(selectedOrder.total)}</strong></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div className="order-actions-modal">
                {selectedOrder.status === 'pending' && (
                  <button
                    className="action-btn process-btn"
                    onClick={() => updateOrderStatus(selectedOrder.id, 'confirmed')}
                  >
                    Confirm Order
                  </button>
                )}
                {selectedOrder.status === 'confirmed' && (
                  <button
                    className="action-btn ship-btn"
                    onClick={() => updateOrderStatus(selectedOrder.id, 'shipped')}
                  >
                    Mark as Shipped
                  </button>
                )}
                {selectedOrder.status === 'shipped' && (
                  <button
                    className="action-btn deliver-btn"
                    onClick={() => updateOrderStatus(selectedOrder.id, 'delivered')}
                  >
                    Mark as Delivered
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerOrders; 