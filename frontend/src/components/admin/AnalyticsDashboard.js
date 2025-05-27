import React, { useState, Suspense, lazy } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { 
  FiTrendingUp, 
  FiUsers, 
  FiShoppingBag, 
  FiDollarSign,
  FiPackage,
  FiRefreshCw
} from 'react-icons/fi';
import './AnalyticsDashboard.css';

// Lazy load chart components
const LineChart = lazy(() => import('./charts/LineChart'));
const BarChart = lazy(() => import('./charts/BarChart'));
const DoughnutChart = lazy(() => import('./charts/DoughnutChart'));

// Register ChartJS components
ChartJS.register(
  CategoryScale,    // x-axis
  LinearScale,      // y-axis
  PointElement,     // scatter/line chart points
  LineElement,      // lines in line chart
  BarElement,       // bars in bar chart
  ArcElement,       // pie/doughnut chart segments
  Title,            // chart title
  Tooltip,          // tooltips
  Legend,           // legend
  Filler            // area fill
);

const LoadingChart = () => (
  <div className="chart-loading">
    <p>Loading chart...</p>
  </div>
);

const AnalyticsDashboard = () => {
  // Mock data - replace with API calls
  const [timeRange, setTimeRange] = useState('7days');
  
  // Mock metrics data
  const metrics = {
    totalRevenue: 152849.99,
    totalOrders: 1234,
    totalCustomers: 856,
    averageOrderValue: 123.86,
    pendingOrders: 45,
    completedOrders: 1189
  };

  // Mock data for revenue chart
  const revenueData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Revenue',
        data: [12500, 14200, 11800, 15600, 13200, 16800, 14500],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  // Mock data for orders by category
  const categoryData = {
    labels: ['Electronics', 'Clothing', 'Books', 'Home & Living', 'Sports', 'Beauty'],
    datasets: [
      {
        label: 'Orders by Category',
        data: [350, 274, 156, 198, 142, 114],
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
          'rgba(255, 159, 64, 0.8)'
        ]
      }
    ]
  };

  // Mock data for daily orders
  const ordersData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Orders',
        data: [65, 78, 52, 83, 72, 93, 76],
        backgroundColor: 'rgba(54, 162, 235, 0.8)'
      }
    ]
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        display: true
      },
      tooltip: {
        enabled: true
      }
    },
    scales: {
      y: {
        type: 'linear',
        beginAtZero: true,
        grid: {
          drawBorder: false
        }
      },
      x: {
        type: 'category',
        grid: {
          display: false
        }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        display: true
      },
      tooltip: {
        enabled: true
      }
    },
    cutout: '70%'
  };

  return (
    <div className="analytics-dashboard">
      <div className="dashboard-header">
        <h1>Analytics Dashboard</h1>
        <div className="time-range-selector">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="year">This Year</option>
          </select>
          <button className="btn-icon" title="Refresh Data">
            <FiRefreshCw size={16} />
          </button>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon revenue">
            <FiDollarSign size={24} />
          </div>
          <div className="metric-content">
            <h3>Total Revenue</h3>
            <p className="metric-value">{formatCurrency(metrics.totalRevenue)}</p>
            <p className="metric-change positive">+12.5% from last period</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon orders">
            <FiShoppingBag size={24} />
          </div>
          <div className="metric-content">
            <h3>Total Orders</h3>
            <p className="metric-value">{metrics.totalOrders}</p>
            <p className="metric-change positive">+8.2% from last period</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon customers">
            <FiUsers size={24} />
          </div>
          <div className="metric-content">
            <h3>Total Customers</h3>
            <p className="metric-value">{metrics.totalCustomers}</p>
            <p className="metric-change positive">+5.8% from last period</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon average">
            <FiTrendingUp size={24} />
          </div>
          <div className="metric-content">
            <h3>Average Order Value</h3>
            <p className="metric-value">{formatCurrency(metrics.averageOrderValue)}</p>
            <p className="metric-change positive">+3.2% from last period</p>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card wide">
          <h3>Revenue Overview</h3>
          <div className="chart-container">
            <Suspense fallback={<LoadingChart />}>
              <LineChart data={revenueData} options={chartOptions} />
            </Suspense>
          </div>
        </div>

        <div className="chart-card">
          <h3>Orders by Category</h3>
          <div className="chart-container">
            <Suspense fallback={<LoadingChart />}>
              <DoughnutChart data={categoryData} options={doughnutOptions} />
            </Suspense>
          </div>
        </div>

        <div className="chart-card">
          <h3>Daily Orders</h3>
          <div className="chart-container">
            <Suspense fallback={<LoadingChart />}>
              <BarChart data={ordersData} options={chartOptions} />
            </Suspense>
          </div>
        </div>
      </div>

      <div className="order-status-section">
        <div className="status-card">
          <div className="status-icon pending">
            <FiPackage size={24} />
          </div>
          <div className="status-content">
            <h3>Pending Orders</h3>
            <p className="status-value">{metrics.pendingOrders}</p>
            <div className="status-bar">
              <div 
                className="status-progress" 
                style={{ width: `${(metrics.pendingOrders / (metrics.pendingOrders + metrics.completedOrders)) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="status-card">
          <div className="status-icon completed">
            <FiShoppingBag size={24} />
          </div>
          <div className="status-content">
            <h3>Completed Orders</h3>
            <p className="status-value">{metrics.completedOrders}</p>
            <div className="status-bar">
              <div 
                className="status-progress" 
                style={{ width: `${(metrics.completedOrders / (metrics.pendingOrders + metrics.completedOrders)) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard; 