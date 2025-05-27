import React, { useState } from 'react';
import { 
  FiSearch, 
  FiEdit2, 
  FiTrash2, 
  FiUserX, 
  FiUserCheck,
  FiFilter,
  FiRefreshCw
} from 'react-icons/fi';
import './UserManagement.css';

const UserManagement = () => {
  // Mock data - replace with API calls
  const mockUsers = [
    { 
      id: 1, 
      name: 'John Doe', 
      email: 'john@example.com', 
      role: 'customer',
      status: 'active',
      joinDate: '2024-01-15',
      lastLogin: '2024-03-10'
    },
    { 
      id: 2, 
      name: 'Jane Smith', 
      email: 'jane@example.com', 
      role: 'seller',
      status: 'active',
      joinDate: '2024-02-01',
      lastLogin: '2024-03-12'
    },
    { 
      id: 3, 
      name: 'Mike Johnson', 
      email: 'mike@example.com', 
      role: 'customer',
      status: 'suspended',
      joinDate: '2024-01-20',
      lastLogin: '2024-02-15'
    },
    { 
      id: 4, 
      name: 'Sarah Wilson', 
      email: 'sarah@example.com', 
      role: 'admin',
      status: 'active',
      joinDate: '2023-12-01',
      lastLogin: '2024-03-11'
    }
  ];

  const [users, setUsers] = useState(mockUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    
    const filtered = mockUsers.filter(user => 
      user.name.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term)
    );
    setUsers(filtered);
  };

  const handleFilter = () => {
    let filtered = mockUsers;

    if (filterRole !== 'all') {
      filtered = filtered.filter(user => user.role === filterRole);
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(user => user.status === filterStatus);
    }

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setUsers(filtered);
  };

  const handleReset = () => {
    setSearchTerm('');
    setFilterRole('all');
    setFilterStatus('all');
    setUsers(mockUsers);
  };

  const handleStatusToggle = (userId) => {
    setUsers(users.map(user => {
      if (user.id === userId) {
        const newStatus = user.status === 'active' ? 'suspended' : 'active';
        return { ...user, status: newStatus };
      }
      return user;
    }));
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
              onChange={(e) => {
                setFilterRole(e.target.value);
                handleFilter();
              }}
            >
              <option value="all">All Roles</option>
              <option value="customer">Customer</option>
              <option value="seller">Seller</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Status:</label>
            <select 
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                handleFilter();
              }}
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

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Join Date</th>
              <th>Last Login</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <span className={`role-badge ${user.role}`}>
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${user.status}`}>
                    {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                  </span>
                </td>
                <td>{user.joinDate}</td>
                <td>{user.lastLogin}</td>
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
                    <button className="btn-icon delete" title="Delete User">
                      <FiTrash2 />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <div className="no-results">
          <p>No users found matching your search criteria.</p>
        </div>
      )}
    </div>
  );
};

export default UserManagement; 