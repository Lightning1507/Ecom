import React, { useState, useEffect, useContext, useCallback } from 'react';
import { 
  FiSearch, 
  FiEdit2, 
  FiTrash2, 
  FiUserX, 
  FiUserCheck,
  FiRefreshCw
} from 'react-icons/fi';
import { AuthContext } from '../../context/AuthContext';
import './UserManagement.css';

const UserManagement = () => {
  const { user } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Helper function to get auth token
  const getAuthToken = useCallback(() => {
    return user?.token || localStorage.getItem('token');
  }, [user?.token]);

  // Fetch users from API
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getAuthToken();

      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setUsers(data.users);
        setFilteredUsers(data.users);
      } else {
        setError(data.message || 'Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, getAuthToken]);

  // Load users on component mount
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Filter users when search term or filters change
  useEffect(() => {
    let filtered = users;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply role filter
    if (filterRole !== 'all') {
      filtered = filtered.filter(user => user.role === filterRole);
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(user => user.status === filterStatus);
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, filterRole, filterStatus]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleReset = () => {
    setSearchTerm('');
    setFilterRole('all');
    setFilterStatus('all');
  };

  const handleStatusToggle = async (userId) => {
    try {
      const token = getAuthToken();
      const userToUpdate = users.find(u => u.id === userId);
      const newLocked = userToUpdate.status === 'active';

      const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ locked: newLocked })
      });

      const data = await response.json();

      if (data.success) {
        // Update the user in the local state
        setUsers(users.map(user => {
          if (user.id === userId) {
            return { ...user, status: newLocked ? 'suspended' : 'active' };
          }
          return user;
        }));
      } else {
        alert(data.message || 'Failed to update user status');
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Failed to update user status');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const token = getAuthToken();

      const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        // Remove the user from local state
        setUsers(users.filter(user => user.id !== userId));
      } else {
        alert(data.message || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  return (
    <div className="user-management">
      <div className="page-header">
        <h1>User Management</h1>
        <button className="btn-primary">
          Add New User
        </button>
      </div>

      <div className="filters-section">
        <div className="search-box">
          <FiSearch />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>

        <div className="filters">
          <div className="filter-group">
            <label>Role:</label>
            <select 
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="customer">Customer</option>
              <option value="seller">Seller</option>
              <option value="admin">Admin</option>
              <option value="shipper">Shipper</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Status:</label>
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          <button className="btn-icon" onClick={handleReset} title="Reset Filters">
            <FiRefreshCw />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading">
          <p>Loading users...</p>
        </div>
      ) : error ? (
        <div className="error">
          <p>Error: {error}</p>
          <button onClick={fetchUsers} className="btn-primary">
            Retry
          </button>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id}>
                    <td>{user.name || 'N/A'}</td>
                    <td>{user.username || 'N/A'}</td>
                    <td>{user.email || 'N/A'}</td>
                    <td>{user.phone || 'N/A'}</td>
                    <td>
                      <span className={`role-badge ${user.role}`}>
                        {user.role?.charAt(0).toUpperCase() + user.role?.slice(1)}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${user.status}`}>
                        {user.status?.charAt(0).toUpperCase() + user.status?.slice(1)}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-icon" title="Edit User">
                          <FiEdit2 />
                        </button>
                        <button 
                          className="btn-icon"
                          title={user.status === 'active' ? 'Suspend User' : 'Activate User'}
                          onClick={() => handleStatusToggle(user.id)}
                        >
                          {user.status === 'active' ? <FiUserX /> : <FiUserCheck />}
                        </button>
                        <button 
                          className="btn-icon delete" 
                          title="Delete User"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && !loading && (
            <div className="no-results">
              <p>No users found matching your search criteria.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UserManagement; 