import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
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
  const [timeRange, setTimeRange] = useState('7days');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState({
    metrics: {
      totalRevenue: 0,
      totalOrders: 0,
      totalCustomers: 0,
      averageOrderValue: 0,
      pendingOrders: 0,
      completedOrders: 0
    },
    charts: {
      revenueData: [],
      categoryData: [],
      dailyOrdersData: []
    }
  });

  // Helper function to get authentication token
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

  // Fetch analytics data from API
  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      
      if (!token) {
        setError('Authentication required. Please log in as an administrator.');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/admin/analytics?timeRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch analytics data');
      }

      if (data.success) {
        setAnalytics(data.analytics);
        setError(null);
      } else {
        throw new Error(data.message || 'Failed to fetch analytics data');
      }

    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError('Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  // Format chart data for Chart.js
  const formatChartData = () => {
    const formatDate = (dateStr) => {
      const date = new Date(dateStr);
      if (timeRange === '7days') {
        return date.toLocaleDateString('en-US', { weekday: 'short' });
      } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
    };

    // Revenue chart data
    const revenueData = {
      labels: analytics.charts.revenueData.map(item => formatDate(item.date)),
      datasets: [
        {
          label: 'Revenue',
          data: analytics.charts.revenueData.map(item => item.revenue),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.1)',
          tension: 0.4,
          fill: true
        }
      ]
    };

    // Category chart data
    const categoryData = {
      labels: analytics.charts.categoryData.map(item => item.category),
      datasets: [
        {
          label: 'Orders by Category',
          data: analytics.charts.categoryData.map(item => item.orders),
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

    // Daily orders chart data
    const ordersData = {
      labels: analytics.charts.dailyOrdersData.map(item => formatDate(item.date)),
      datasets: [
        {
          label: 'Orders',
          data: analytics.charts.dailyOrdersData.map(item => item.orders),
          backgroundColor: 'rgba(54, 162, 235, 0.8)'
        }
      ]
    };

    return { revenueData, categoryData, ordersData };
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
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

  if (loading) {
    return (
      <div className="analytics-dashboard">
        <div className="loading-state">
          <h2>Loading analytics...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-dashboard">
        <div className="error-state">
          <h2>Error loading analytics</h2>
          <p>{error}</p>
          <button onClick={fetchAnalyticsData} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const { revenueData, categoryData, ordersData } = formatChartData();

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
          <button className="btn-icon" title="Refresh Data" onClick={fetchAnalyticsData}>
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
            <p className="metric-value">{formatCurrency(analytics.metrics.totalRevenue)}</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon orders">
            <FiShoppingBag size={24} />
          </div>
          <div className="metric-content">
            <h3>Total Orders</h3>
            <p className="metric-value">{analytics.metrics.totalOrders}</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon customers">
            <FiUsers size={24} />
          </div>
          <div className="metric-content">
            <h3>Total Customers</h3>
            <p className="metric-value">{analytics.metrics.totalCustomers}</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon average">
            <FiTrendingUp size={24} />
          </div>
          <div className="metric-content">
            <h3>Average Order Value</h3>
            <p className="metric-value">{formatCurrency(analytics.metrics.averageOrderValue)}</p>
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
            <p className="status-value">{analytics.metrics.pendingOrders}</p>
            <div className="status-bar">
              <div 
                className="status-progress" 
                style={{ width: `${analytics.metrics.pendingOrders + analytics.metrics.completedOrders > 0 ? (analytics.metrics.pendingOrders / (analytics.metrics.pendingOrders + analytics.metrics.completedOrders)) * 100 : 0}%` }}
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
            <p className="status-value">{analytics.metrics.completedOrders}</p>
            <div className="status-bar">
              <div 
                className="status-progress" 
                style={{ width: `${analytics.metrics.pendingOrders + analytics.metrics.completedOrders > 0 ? (analytics.metrics.completedOrders / (analytics.metrics.pendingOrders + analytics.metrics.completedOrders)) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard; 