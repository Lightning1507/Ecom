import React, { useState } from 'react';
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
import { FiTrendingUp, FiDollarSign, FiShoppingBag, FiUsers, FiCalendar } from 'react-icons/fi';
import './SellerAnalytics.css';

// Mock data - replace with actual API calls in production
const mockData = {
  revenueData: [
    { month: 'Jan', revenue: 5200 },
    { month: 'Feb', revenue: 4800 },
    { month: 'Mar', revenue: 6100 },
    { month: 'Apr', revenue: 5900 },
    { month: 'May', revenue: 7200 },
    { month: 'Jun', revenue: 6800 }
  ],
  orderData: [
    { month: 'Jan', orders: 42 },
    { month: 'Feb', orders: 38 },
    { month: 'Mar', orders: 51 },
    { month: 'Apr', orders: 48 },
    { month: 'May', orders: 61 },
    { month: 'Jun', orders: 57 }
  ],
  categoryData: [
    { name: 'Electronics', value: 35 },
    { name: 'Clothing', value: 25 },
    { name: 'Books', value: 20 },
    { name: 'Home', value: 15 },
    { name: 'Other', value: 5 }
  ],
  topProducts: [
    { name: 'Product A', sales: 125, revenue: 3750 },
    { name: 'Product B', sales: 98, revenue: 2940 },
    { name: 'Product C', sales: 84, revenue: 2520 },
    { name: 'Product D', sales: 76, revenue: 2280 },
    { name: 'Product E', sales: 65, revenue: 1950 }
  ]
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const SellerAnalytics = () => {
  const [timeRange, setTimeRange] = useState('6m');
  
  // Calculate summary metrics
  const totalRevenue = mockData.revenueData.reduce((sum, item) => sum + item.revenue, 0);
  const totalOrders = mockData.orderData.reduce((sum, item) => sum + item.orders, 0);
  const averageOrderValue = totalRevenue / totalOrders;
  const topSellingProduct = mockData.topProducts[0];

  return (
    <div className="analytics-dashboard">
      <div className="analytics-header">
        <h1>Analytics Dashboard</h1>
        <div className="time-range-selector">
          <FiCalendar />
          <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
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
            <p className="card-value">${totalRevenue.toLocaleString()}</p>
            <p className="card-trend positive">
              <FiTrendingUp /> +15.3%
            </p>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon orders">
            <FiShoppingBag />
          </div>
          <div className="card-content">
            <h3>Total Orders</h3>
            <p className="card-value">{totalOrders}</p>
            <p className="card-trend positive">
              <FiTrendingUp /> +12.8%
            </p>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon avg-order">
            <FiDollarSign />
          </div>
          <div className="card-content">
            <h3>Average Order Value</h3>
            <p className="card-value">${averageOrderValue.toFixed(2)}</p>
            <p className="card-trend positive">
              <FiTrendingUp /> +2.4%
            </p>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon customers">
            <FiUsers />
          </div>
          <div className="card-content">
            <h3>Total Customers</h3>
            <p className="card-value">284</p>
            <p className="card-trend positive">
              <FiTrendingUp /> +8.7%
            </p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-grid">
        {/* Revenue Chart */}
        <div className="chart-card">
          <h3>Revenue Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={mockData.revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
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
            <BarChart data={mockData.orderData}>
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
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={mockData.categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {mockData.categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Products Table */}
        <div className="chart-card">
          <h3>Top Selling Products</h3>
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
                {mockData.topProducts.map((product, index) => (
                  <tr key={index}>
                    <td>{product.name}</td>
                    <td>{product.sales}</td>
                    <td>${product.revenue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerAnalytics; 