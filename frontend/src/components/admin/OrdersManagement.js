import React, { useState } from 'react';
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
import './OrdersManagement.css';

const OrdersManagement = () => {
  // Mock data - replace with API calls
  const mockOrders = [
    {
      id: "ORD-2024-001",
      customer: "John Doe",
      date: "2024-03-15",
      total: 299.99,
      items: 3,
      status: "pending",
      paymentStatus: "paid",
      shippingAddress: "123 Main St, City, Country",
      trackingNumber: null
    },
    {
      id: "ORD-2024-002",
      customer: "Jane Smith",
      date: "2024-03-14",
      total: 159.50,
      items: 2,
      status: "processing",
      paymentStatus: "paid",
      shippingAddress: "456 Oak Ave, Town, Country",
      trackingNumber: "TRK123456789"
    },
    {
      id: "ORD-2024-003",
      customer: "Mike Johnson",
      date: "2024-03-13",
      total: 499.99,
      items: 5,
      status: "shipped",
      paymentStatus: "paid",
      shippingAddress: "789 Pine Rd, Village, Country",
      trackingNumber: "TRK987654321"
    },
    {
      id: "ORD-2024-004",
      customer: "Sarah Wilson",
      date: "2024-03-12",
      total: 89.99,
      items: 1,
      status: "delivered",
      paymentStatus: "paid",
      shippingAddress: "321 Elm St, City, Country",
      trackingNumber: "TRK456789123"
    },
    {
      id: "ORD-2024-005",
      customer: "Robert Brown",
      date: "2024-03-11",
      total: 199.99,
      items: 2,
      status: "cancelled",
      paymentStatus: "refunded",
      shippingAddress: "654 Maple Dr, Town, Country",
      trackingNumber: null
    }
  ];

  const [orders, setOrders] = useState(mockOrders);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    applyFilters(term, statusFilter, dateFilter);
  };

  const getDateRange = (range) => {
    const today = new Date();
    const dates = {
      today: new Date(today.setHours(0, 0, 0, 0)),
      yesterday: new Date(today.setDate(today.getDate() - 1)),
      week: new Date(today.setDate(today.getDate() - 7)),
      month: new Date(today.setMonth(today.getMonth() - 1)),
    };
    return dates[range];
  };

  const applyFilters = (search = searchTerm, status = statusFilter, date = dateFilter) => {
    let filtered = mockOrders;

    // Search filter
    if (search) {
      filtered = filtered.filter(order =>
        order.id.toLowerCase().includes(search) ||
        order.customer.toLowerCase().includes(search) ||
        (order.trackingNumber && order.trackingNumber.toLowerCase().includes(search))
      );
    }

    // Status filter
    if (status !== 'all') {
      filtered = filtered.filter(order => order.status === status);
    }

    // Date filter
    if (date !== 'all') {
      const dateThreshold = getDateRange(date);
      filtered = filtered.filter(order => new Date(order.date) >= dateThreshold);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = new Date(b.date) - new Date(a.date);
          break;
        case 'total':
          comparison = b.total - a.total;
          break;
        case 'items':
          comparison = b.items - a.items;
          break;
        default:
          comparison = 0;
      }
      return sortOrder === 'asc' ? -comparison : comparison;
    });

    setOrders(filtered);
  };

  const handleReset = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDateFilter('all');
    setSortBy('date');
    setSortOrder('desc');
    setOrders(mockOrders);
  };

  const handleStatusUpdate = (orderId, newStatus) => {
    setOrders(orders.map(order => {
      if (order.id === orderId) {
        return { ...order, status: newStatus };
      }
      return order;
    }));
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <FiAlertCircle />;
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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="orders-management">
      <div className="page-header">
        <h1>Orders Management</h1>
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
              onChange={(e) => {
                setStatusFilter(e.target.value);
                applyFilters(searchTerm, e.target.value, dateFilter);
              }}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Date:</label>
            <select 
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                applyFilters(searchTerm, statusFilter, e.target.value);
              }}
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
                applyFilters();
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
            {orders.map(order => (
              <tr key={order.id}>
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
                  <span className={`payment-badge ${order.paymentStatus}`}>
                    {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-icon" title="View Order Details">
                      <FiEye />
                    </button>
                    {order.status !== 'delivered' && order.status !== 'cancelled' && (
                      <select
                        className="status-update"
                        value={order.status}
                        onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                      >
                        <option value="pending">Mark Pending</option>
                        <option value="processing">Mark Processing</option>
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

      {orders.length === 0 && (
        <div className="no-results">
          <p>No orders found matching your search criteria.</p>
        </div>
      )}
    </div>
  );
};

export default OrdersManagement; 