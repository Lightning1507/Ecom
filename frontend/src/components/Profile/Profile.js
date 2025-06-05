import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FiEdit2, FiUser, FiMail, FiPhone, FiMapPin, FiShield } from 'react-icons/fi';
import './Profile.css';

const Profile = () => {
  const [user, setUser] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    location: '',
    role: '',
    accountStatus: ''
  });

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

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
        setError('Authentication required. Please log in.');
        return;
      }

      const response = await fetch('http://localhost:5000/api/dashboard/user/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.profile);
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

  const handleEdit = () => {
    setIsEditing(!isEditing);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      const token = getAuthToken();
      
      if (!token) {
        alert('Authentication required. Please log in.');
        return;
      }

      const response = await fetch('http://localhost:5000/api/dashboard/user/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: user.name,
          email: user.email,
          phone: user.phone,
          location: user.location
        })
      });

      const data = await response.json();

      if (data.success) {
        setIsEditing(false);
        alert('Profile updated successfully!');
      } else {
        alert(data.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      alert('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="loading-state">
          <h2>Loading profile...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-container">
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
    <motion.div 
      className="profile-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="profile-header">
        <div className="profile-info-header">
          <h1>{user.name || 'User Profile'}</h1>
          <p className="username">@{user.username}</p>
          <span className={`role-badge ${user.role}`}>{user.role}</span>
        </div>
        
        <div className="profile-actions">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="edit-button"
            onClick={handleEdit}
          >
            <FiEdit2 /> Edit Profile
          </motion.button>
        </div>
      </div>

      <div className="profile-content">
        {isEditing ? (
          <form onSubmit={handleSave} className="edit-form">
            <div className="form-group">
              <label>Name:</label>
              <input
                type="text"
                value={user.name}
                onChange={(e) => setUser({ ...user, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Username:</label>
              <input
                type="text"
                value={user.username}
                disabled
                className="readonly-field"
              />
              <small>Username cannot be changed</small>
            </div>
            <div className="form-group">
              <label>Email:</label>
              <input
                type="email"
                value={user.email}
                onChange={(e) => setUser({ ...user, email: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Phone:</label>
              <input
                type="tel"
                value={user.phone}
                onChange={(e) => setUser({ ...user, phone: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Location:</label>
              <input
                type="text"
                value={user.location}
                onChange={(e) => setUser({ ...user, location: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Role:</label>
              <input
                type="text"
                value={user.role}
                disabled
                className="readonly-field"
              />
              <small>Role cannot be changed</small>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              className="save-button"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </motion.button>
          </form>
        ) : (
          <div className="info-container">
            <div className="info-item">
              <FiUser className="info-icon" />
              <div>
                <h3>Name</h3>
                <p>{user.name}</p>
              </div>
            </div>
            <div className="info-item">
              <FiUser className="info-icon" />
              <div>
                <h3>Username</h3>
                <p>@{user.username}</p>
              </div>
            </div>
            <div className="info-item">
              <FiMail className="info-icon" />
              <div>
                <h3>Email</h3>
                <p>{user.email}</p>
              </div>
            </div>
            <div className="info-item">
              <FiPhone className="info-icon" />
              <div>
                <h3>Phone</h3>
                <p>{user.phone}</p>
              </div>
            </div>
            <div className="info-item">
              <FiMapPin className="info-icon" />
              <div>
                <h3>Location</h3>
                <p>{user.location}</p>
              </div>
            </div>
            <div className="info-item">
              <FiShield className="info-icon" />
              <div>
                <h3>Role</h3>
                <p className={`role-text ${user.role}`}>{user.role}</p>
              </div>
            </div>
            <div className="info-item">
              <FiShield className="info-icon" />
              <div>
                <h3>Account Status</h3>
                <p className={`status-text ${user.accountStatus.toLowerCase()}`}>{user.accountStatus}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Profile; 