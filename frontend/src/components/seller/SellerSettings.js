import React, { useState, useEffect, useCallback } from 'react';
import { FiUser, FiShoppingBag, FiBell, FiCreditCard, FiTruck, FiSave } from 'react-icons/fi';
import './SellerSettings.css';

const SellerSettings = () => {
  const [settings, setSettings] = useState({
    profile: {
      name: '',
      email: '',
      phone: '',
      address: '',
      avatar: null
    },
    store: {
      name: '',
      description: '',
      address: '',
      businessHours: '9:00 AM - 6:00 PM',
      category: 'Electronics'
    },
    notifications: {
      orderUpdates: true,
      newMessages: true,
      promotionalEmails: false,
      stockAlerts: true
    },
    shipping: {
      freeShippingThreshold: 50,
      defaultShippingMethod: 'standard',
      processingTime: '1-2 business days'
    },
    payment: {
      acceptedMethods: ['credit_card', 'paypal'],
      autoPayouts: true,
      payoutSchedule: 'weekly'
    }
  });

  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState(settings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      
      if (!token) {
        setError('Authentication required. Please log in as a seller.');
        return;
      }

      const response = await fetch('http://localhost:5000/api/dashboard/seller/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setSettings(data.profile);
        setFormData(data.profile);
        setError(null);
      } else {
        setError(data.message || 'Failed to fetch profile data');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch profile data on component mount
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleInputChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleToggle = (section, field) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: !prev[section][field]
      }
    }));
  };

  const handleSave = async (section) => {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found. Please log in.');
      }

      const response = await fetch('http://localhost:5000/api/dashboard/seller/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          section: section,
          data: formData[section]
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `Failed to save ${section} settings`);
      }

      // Update local state
      setSettings(prev => ({
        ...prev,
        [section]: formData[section]
      }));
      
      alert(`${section.charAt(0).toUpperCase() + section.slice(1)} settings saved successfully!`);
    } catch (error) {
      console.error('Error saving settings:', error);
      alert(error.message || 'Failed to save settings. Please try again.');
    }
  };

  const renderProfileSettings = () => (
    <div className="settings-section">
      <h2>Profile Settings</h2>
      <div className="settings-form">
        <div className="form-group">
          <label>Full Name</label>
          <input
            type="text"
            value={formData.profile.name}
            onChange={(e) => handleInputChange('profile', 'name', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={formData.profile.email}
            onChange={(e) => handleInputChange('profile', 'email', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Phone</label>
          <input
            type="tel"
            value={formData.profile.phone}
            onChange={(e) => handleInputChange('profile', 'phone', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Address</label>
          <textarea
            value={formData.profile.address}
            onChange={(e) => handleInputChange('profile', 'address', e.target.value)}
            placeholder="Enter your address"
          />
        </div>
        <div className="form-group">
          <label>Profile Picture</label>
          <input type="file" accept="image/*" />
        </div>
      </div>
    </div>
  );

  const renderStoreSettings = () => (
    <div className="settings-section">
      <h2>Store Settings</h2>
      <div className="settings-form">
        <div className="form-group">
          <label>Store Name</label>
          <input
            type="text"
            value={formData.store.name}
            onChange={(e) => handleInputChange('store', 'name', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea
            value={formData.store.description}
            onChange={(e) => handleInputChange('store', 'description', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Address</label>
          <input
            type="text"
            value={formData.store.address}
            onChange={(e) => handleInputChange('store', 'address', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Business Hours</label>
          <input
            type="text"
            value={formData.store.businessHours}
            onChange={(e) => handleInputChange('store', 'businessHours', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Category</label>
          <select
            value={formData.store.category}
            onChange={(e) => handleInputChange('store', 'category', e.target.value)}
          >
            <option value="Electronics">Electronics</option>
            <option value="Fashion">Fashion</option>
            <option value="Home">Home & Garden</option>
            <option value="Books">Books</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="settings-section">
      <h2>Notification Preferences</h2>
      <div className="settings-form">
        <div className="toggle-group">
          <label>
            <span>Order Updates</span>
            <input
              type="checkbox"
              checked={formData.notifications.orderUpdates}
              onChange={() => handleToggle('notifications', 'orderUpdates')}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
        <div className="toggle-group">
          <label>
            <span>New Messages</span>
            <input
              type="checkbox"
              checked={formData.notifications.newMessages}
              onChange={() => handleToggle('notifications', 'newMessages')}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
        <div className="toggle-group">
          <label>
            <span>Promotional Emails</span>
            <input
              type="checkbox"
              checked={formData.notifications.promotionalEmails}
              onChange={() => handleToggle('notifications', 'promotionalEmails')}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
        <div className="toggle-group">
          <label>
            <span>Stock Alerts</span>
            <input
              type="checkbox"
              checked={formData.notifications.stockAlerts}
              onChange={() => handleToggle('notifications', 'stockAlerts')}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>
    </div>
  );

  const renderShippingSettings = () => (
    <div className="settings-section">
      <h2>Shipping Settings</h2>
      <div className="settings-form">
        <div className="form-group">
          <label>Free Shipping Threshold ($)</label>
          <input
            type="number"
            value={formData.shipping.freeShippingThreshold}
            onChange={(e) => handleInputChange('shipping', 'freeShippingThreshold', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Default Shipping Method</label>
          <select
            value={formData.shipping.defaultShippingMethod}
            onChange={(e) => handleInputChange('shipping', 'defaultShippingMethod', e.target.value)}
          >
            <option value="standard">Standard Shipping</option>
            <option value="express">Express Shipping</option>
            <option value="overnight">Overnight Shipping</option>
          </select>
        </div>
        <div className="form-group">
          <label>Processing Time</label>
          <input
            type="text"
            value={formData.shipping.processingTime}
            onChange={(e) => handleInputChange('shipping', 'processingTime', e.target.value)}
          />
        </div>
      </div>
    </div>
  );

  const renderPaymentSettings = () => (
    <div className="settings-section">
      <h2>Payment Settings</h2>
      <div className="settings-form">
        <div className="form-group">
          <label>Accepted Payment Methods</label>
          <div className="checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={formData.payment.acceptedMethods.includes('credit_card')}
                onChange={(e) => {
                  const methods = e.target.checked
                    ? [...formData.payment.acceptedMethods, 'credit_card']
                    : formData.payment.acceptedMethods.filter(m => m !== 'credit_card');
                  handleInputChange('payment', 'acceptedMethods', methods);
                }}
              />
              Credit Card
            </label>
            <label>
              <input
                type="checkbox"
                checked={formData.payment.acceptedMethods.includes('paypal')}
                onChange={(e) => {
                  const methods = e.target.checked
                    ? [...formData.payment.acceptedMethods, 'paypal']
                    : formData.payment.acceptedMethods.filter(m => m !== 'paypal');
                  handleInputChange('payment', 'acceptedMethods', methods);
                }}
              />
              PayPal
            </label>
          </div>
        </div>
        <div className="toggle-group">
          <label>
            <span>Automatic Payouts</span>
            <input
              type="checkbox"
              checked={formData.payment.autoPayouts}
              onChange={() => handleToggle('payment', 'autoPayouts')}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
        <div className="form-group">
          <label>Payout Schedule</label>
          <select
            value={formData.payment.payoutSchedule}
            onChange={(e) => handleInputChange('payment', 'payoutSchedule', e.target.value)}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="biweekly">Bi-weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="seller-settings">
        <div className="loading-state">
          <h2>Loading profile...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="seller-settings">
        <div className="error-state">
          <h2>Error loading profile</h2>
          <p>{error}</p>
          <button onClick={fetchProfile} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="seller-settings">
      <div className="settings-container">
        <div className="settings-sidebar">
          <button
            className={`settings-tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <FiUser /> Profile
          </button>
          <button
            className={`settings-tab ${activeTab === 'store' ? 'active' : ''}`}
            onClick={() => setActiveTab('store')}
          >
            <FiShoppingBag /> Store
          </button>
          <button
            className={`settings-tab ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <FiBell /> Notifications
          </button>
          <button
            className={`settings-tab ${activeTab === 'shipping' ? 'active' : ''}`}
            onClick={() => setActiveTab('shipping')}
          >
            <FiTruck /> Shipping
          </button>
          <button
            className={`settings-tab ${activeTab === 'payment' ? 'active' : ''}`}
            onClick={() => setActiveTab('payment')}
          >
            <FiCreditCard /> Payment
          </button>
        </div>

        <div className="settings-content">
          {activeTab === 'profile' && renderProfileSettings()}
          {activeTab === 'store' && renderStoreSettings()}
          {activeTab === 'notifications' && renderNotificationSettings()}
          {activeTab === 'shipping' && renderShippingSettings()}
          {activeTab === 'payment' && renderPaymentSettings()}

          <div className="settings-actions">
            <button className="save-button" onClick={() => handleSave(activeTab)}>
              <FiSave /> Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerSettings; 