import React, { useState } from 'react';
import { FiSearch, FiFilter, FiPackage, FiTruck, FiCheck, FiX } from 'react-icons/fi';
import './SellerOrders.css';

// Mock data - replace with actual API calls in production
const mockOrders = [
  {
    id: "ORD001",
    customer: "John Doe",
    items: [
      { name: "Product 1", quantity: 2, price: 29.99 },
      { name: "Product 2", quantity: 1, price: 49.99 }
    ],
    total: 109.97,
    status: "pending",
    date: "2024-03-15T10:30:00Z"
  },
  {
    id: "ORD002",
    customer: "Jane Smith",
    items: [
      { name: "Product 3", quantity: 1, price: 79.99 }
    ],
    total: 79.99,
    status: "processing",
    date: "2024-03-14T15:45:00Z"
  },
  {
    id: "ORD003",
    customer: "Mike Johnson",
    items: [
      { name: "Product 1", quantity: 3, price: 29.99 },
      { name: "Product 4", quantity: 2, price: 39.99 }
    ],
    total: 169.95,
    status: "shipped",
    date: "2024-03-13T09:15:00Z"
  }
];

const OrderStatusBadge = ({ status }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'pending':
        return 'status-pending';
      case 'processing':
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
  const [orders, setOrders] = useState(mockOrders);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const updateOrderStatus = (orderId, newStatus) => {
    setOrders(orders.map(order =>
      order.id === orderId ? { ...order, status: newStatus } : order
    ));
  };

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
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      <div className="orders-list">
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
                <td>{order.id}</td>
                <td>{order.customer}</td>
                <td>{new Date(order.date).toLocaleDateString()}</td>
                <td>{order.items.length} items</td>
                <td>${order.total.toFixed(2)}</td>
                <td>
                  <OrderStatusBadge status={order.status} />
                </td>
                <td>
                  <div className="order-actions">
                    <button
                      className="action-btn view-btn"
                      onClick={() => setSelectedOrder(order)}
                    >
                      View
                    </button>
                    {order.status === 'pending' && (
                      <button
                        className="action-btn process-btn"
                        onClick={() => updateOrderStatus(order.id, 'processing')}
                      >
                        Process
                      </button>
                    )}
                    {order.status === 'processing' && (
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
      </div>

      {selectedOrder && (
        <div className="order-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Order Details - {selectedOrder.id}</h2>
              <button className="close-btn" onClick={() => setSelectedOrder(null)}>
                <FiX />
              </button>
            </div>
            <div className="modal-body">
              <div className="order-info">
                <p><strong>Customer:</strong> {selectedOrder.customer}</p>
                <p><strong>Date:</strong> {new Date(selectedOrder.date).toLocaleString()}</p>
                <p><strong>Status:</strong> <OrderStatusBadge status={selectedOrder.status} /></p>
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
                        <td>${item.price.toFixed(2)}</td>
                        <td>${(item.quantity * item.price).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="3"><strong>Total</strong></td>
                      <td><strong>${selectedOrder.total.toFixed(2)}</strong></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerOrders; 