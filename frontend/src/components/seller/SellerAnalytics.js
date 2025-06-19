import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { FiTrendingUp, FiTrendingDown, FiDollarSign, FiShoppingBag, FiUsers, FiCalendar, FiLoader } from 'react-icons/fi';
import './SellerAnalytics.css';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

// Helper function to format VND currency
const formatVND = (amount) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

const SellerAnalytics = () => {
  const [timeRange, setTimeRange] = useState('6m');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper function to get authentication token
  const getAuthToken = useCallback(() => {
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
  }, []);

  // Fetch analytics data
  const fetchAnalyticsData = useCallback(async (selectedTimeRange) => {
    try {
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`http://localhost:5000/api/dashboard/seller/analytics?timeRange=${selectedTimeRange}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch analytics data');
      }

      const data = await response.json();
      if (data.success) {
        setAnalyticsData(data.analytics);
      } else {
        throw new Error(data.message || 'Failed to fetch analytics data');
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [getAuthToken]);

  // Fetch data when component mounts or time range changes
  useEffect(() => {
    fetchAnalyticsData(timeRange);
  }, [timeRange, fetchAnalyticsData]);

  // Handle time range change
  const handleTimeRangeChange = useCallback((e) => {
    const newTimeRange = e.target.value;
    setTimeRange(newTimeRange);
  }, []);

  // Format growth percentage with appropriate icon and color
  const formatGrowth = (growth) => {
    const value = parseFloat(growth);
    const isPositive = value >= 0;
    const icon = isPositive ? <FiTrendingUp /> : <FiTrendingDown />;
    const className = isPositive ? 'positive' : 'negative';
    return (
      <p className={`card-trend ${className}`}>
        {icon} {isPositive ? '+' : ''}{value}%
      </p>
    );
  };

  if (loading) {
    return (
      <div className="analytics-dashboard">
        <div className="analytics-header">
          <h1>Analytics Dashboard</h1>
        </div>
        <div className="loading-container">
          <FiLoader className="loading-spinner" />
          <p>Loading analytics data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-dashboard">
        <div className="analytics-header">
          <h1>Analytics Dashboard</h1>
        </div>
        <div className="error-container">
          <p>Error loading analytics data: {error}</p>
          <button onClick={() => fetchAnalyticsData(timeRange)} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="analytics-dashboard">
        <div className="analytics-header">
          <h1>Analytics Dashboard</h1>
        </div>
        <div className="no-data-container">
          <p>No analytics data available</p>
        </div>
      </div>
    );
  }

  const { revenueData, orderData, categoryData, topProducts, summary } = analyticsData;

  return (
    <div className="analytics-dashboard">
      <div className="analytics-header">
        <h1>Analytics Dashboard</h1>
        <div className="time-range-selector">
          <FiCalendar />
          <select value={timeRange} onChange={handleTimeRangeChange}>
            <option value="1m">Last Month</option>
            <option value="3m">Last 3 Months</option>
            <option value="6m">Last 6 Months</option>
            <option value="1y">Last Year</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="card-icon revenue">
            <FiDollarSign />
          </div>
          <div className="card-content">
            <h3>Total Revenue</h3>
            <p className="card-value">{formatVND(summary.totalRevenue)}</p>
            {formatGrowth(summary.revenueGrowth)}
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon orders">
            <FiShoppingBag />
          </div>
          <div className="card-content">
            <h3>Total Orders</h3>
            <p className="card-value">{summary.totalOrders}</p>
            {formatGrowth(summary.ordersGrowth)}
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon avg-order">
            <FiDollarSign />
          </div>
          <div className="card-content">
            <h3>Average Order Value</h3>
            <p className="card-value">{formatVND(summary.averageOrderValue)}</p>
            {formatGrowth(summary.avgOrderValueGrowth)}
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon customers">
            <FiUsers />
          </div>
          <div className="card-content">
            <h3>Total Customers</h3>
            <p className="card-value">{summary.totalCustomers}</p>
            {formatGrowth(summary.customersGrowth)}
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-grid">
        {/* Revenue Chart */}
        <div className="chart-card">
          <h3>Revenue Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [formatVND(value), 'Revenue']} />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#0088FE"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Orders Chart */}
        <div className="chart-card">
          <h3>Orders Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={orderData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="orders" fill="#00C49F" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category Distribution */}
        <div className="chart-card">
          <h3>Sales by Category</h3>
          {categoryData && categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-data">
              <p>No category data available</p>
            </div>
          )}
        </div>

        {/* Top Products Table */}
        <div className="chart-card">
          <h3>Top Selling Products</h3>
          {topProducts && topProducts.length > 0 ? (
            <div className="top-products-table">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Sales</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((product, index) => (
                    <tr key={index}>
                      <td>{product.name}</td>
                      <td>{product.sales}</td>
                      <td>{formatVND(product.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="no-data">
              <p>No product data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerAnalytics; 