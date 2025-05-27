import React, { useState } from 'react';
import './Settings.css';

const Settings = () => {
  const [generalSettings, setGeneralSettings] = useState({
    siteName: '',
    siteDescription: '',
    contactEmail: '',
    timezone: '',
  });

  const [emailSettings, setEmailSettings] = useState({
    smtpServer: '',
    smtpPort: '',
    smtpUsername: '',
    smtpPassword: '',
    senderEmail: '',
    senderName: '',
  });

  const [notifications, setNotifications] = useState({
    newOrders: true,
    newReviews: true,
    lowStock: true,
    systemUpdates: true,
  });

  const handleGeneralSettingsChange = (e) => {
    setGeneralSettings({
      ...generalSettings,
      [e.target.name]: e.target.value,
    });
  };

  const handleEmailSettingsChange = (e) => {
    setEmailSettings({
      ...emailSettings,
      [e.target.name]: e.target.value,
    });
  };

  const handleNotificationToggle = (setting) => {
    setNotifications({
      ...notifications,
      [setting]: !notifications[setting],
    });
  };

  const handleSave = (e) => {
    e.preventDefault();
    // TODO: Implement settings save functionality
    console.log('Settings saved:', {
      generalSettings,
      emailSettings,
      notifications,
    });
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>Admin Settings</h1>
      </div>

      <div className="settings-content">
        <form onSubmit={handleSave} className="settings-sections">
          <section className="settings-section">
            <div className="section-header">
              <h2>General Settings</h2>
              <p>Configure basic information about your store</p>
            </div>
            <div className="settings-form">
              <div className="form-group">
                <label htmlFor="siteName">Site Name</label>
                <input
                  type="text"
                  id="siteName"
                  name="siteName"
                  value={generalSettings.siteName}
                  onChange={handleGeneralSettingsChange}
                  placeholder="Enter site name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="siteDescription">Site Description</label>
                <textarea
                  id="siteDescription"
                  name="siteDescription"
                  value={generalSettings.siteDescription}
                  onChange={handleGeneralSettingsChange}
                  placeholder="Enter site description"
                />
              </div>
              <div className="form-group">
                <label htmlFor="contactEmail">Contact Email</label>
                <input
                  type="email"
                  id="contactEmail"
                  name="contactEmail"
                  value={generalSettings.contactEmail}
                  onChange={handleGeneralSettingsChange}
                  placeholder="Enter contact email"
                />
              </div>
              <div className="form-group">
                <label htmlFor="timezone">Timezone</label>
                <select
                  id="timezone"
                  name="timezone"
                  value={generalSettings.timezone}
                  onChange={handleGeneralSettingsChange}
                >
                  <option value="">Select timezone</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                </select>
              </div>
            </div>
          </section>

          <section className="settings-section">
            <div className="section-header">
              <h2>Email Settings</h2>
              <p>Configure email server settings for notifications</p>
            </div>
            <div className="settings-form">
              <div className="form-group">
                <label htmlFor="smtpServer">SMTP Server</label>
                <input
                  type="text"
                  id="smtpServer"
                  name="smtpServer"
                  value={emailSettings.smtpServer}
                  onChange={handleEmailSettingsChange}
                  placeholder="Enter SMTP server"
                />
              </div>
              <div className="form-group">
                <label htmlFor="smtpPort">SMTP Port</label>
                <input
                  type="text"
                  id="smtpPort"
                  name="smtpPort"
                  value={emailSettings.smtpPort}
                  onChange={handleEmailSettingsChange}
                  placeholder="Enter SMTP port"
                />
              </div>
              <div className="form-group">
                <label htmlFor="smtpUsername">SMTP Username</label>
                <input
                  type="text"
                  id="smtpUsername"
                  name="smtpUsername"
                  value={emailSettings.smtpUsername}
                  onChange={handleEmailSettingsChange}
                  placeholder="Enter SMTP username"
                />
              </div>
              <div className="form-group">
                <label htmlFor="smtpPassword">SMTP Password</label>
                <input
                  type="password"
                  id="smtpPassword"
                  name="smtpPassword"
                  value={emailSettings.smtpPassword}
                  onChange={handleEmailSettingsChange}
                  placeholder="Enter SMTP password"
                />
              </div>
            </div>
          </section>

          <section className="settings-section">
            <div className="section-header">
              <h2>Notification Preferences</h2>
              <p>Choose which notifications you want to receive</p>
            </div>
            <div className="settings-form">
              <div className="toggle-group">
                <div className="toggle-label">
                  <span>New Orders</span>
                  <span>Get notified when new orders are placed</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.newOrders}
                  onChange={() => handleNotificationToggle('newOrders')}
                />
              </div>
              <div className="toggle-group">
                <div className="toggle-label">
                  <span>New Reviews</span>
                  <span>Get notified when customers leave reviews</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.newReviews}
                  onChange={() => handleNotificationToggle('newReviews')}
                />
              </div>
              <div className="toggle-group">
                <div className="toggle-label">
                  <span>Low Stock Alerts</span>
                  <span>Get notified when product stock is low</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.lowStock}
                  onChange={() => handleNotificationToggle('lowStock')}
                />
              </div>
              <div className="toggle-group">
                <div className="toggle-label">
                  <span>System Updates</span>
                  <span>Get notified about system updates and maintenance</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.systemUpdates}
                  onChange={() => handleNotificationToggle('systemUpdates')}
                />
              </div>
            </div>
          </section>

          <div className="settings-actions">
            <button type="button" className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings; 