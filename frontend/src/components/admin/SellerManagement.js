import React, { useState, useEffect, useContext, useCallback } from 'react';
import { 
  FiSearch, 
  FiEdit2, 
  FiTrash2, 
  FiUserX, 
  FiUserCheck,
  FiRefreshCw,
  FiEye
} from 'react-icons/fi';
import { AuthContext } from '../../context/AuthContext';
import './SellerManagement.css';
import './Modal.css';

const SellerManagement = () => {
  const { user } = useContext(AuthContext);
  const [sellers, setSellers] = useState([]);
  const [filteredSellers, setFilteredSellers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSeller, setEditingSeller] = useState(null);
  const [editForm, setEditForm] = useState({
    ownerName: '',
    email: '',
    phone: '',
    address: '',
    storeName: '',
    description: ''
  });

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Helper function to get auth token
  const getAuthToken = useCallback(() => {
    return user?.token || localStorage.getItem('token');
  }, [user?.token]);

  // Fetch sellers from API
  const fetchSellers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getAuthToken();

      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/sellers`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setSellers(data.sellers);
        setFilteredSellers(data.sellers);
      } else {
        setError(data.message || 'Failed to fetch sellers');
      }
    } catch (error) {
      console.error('Error fetching sellers:', error);
      setError('Failed to load sellers. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, getAuthToken]);

  // Load sellers on component mount
  useEffect(() => {
    fetchSellers();
  }, [fetchSellers]);

  // Filter sellers when search term or filters change
  useEffect(() => {
    let filtered = sellers;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(seller =>
        seller.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        seller.ownerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        seller.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(seller => seller.status === filterStatus);
    }

    setFilteredSellers(filtered);
  }, [sellers, searchTerm, filterStatus]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleReset = () => {
    setSearchTerm('');
    setFilterStatus('all');
  };

  const handleStatusToggle = async (sellerId) => {
    try {
      const token = getAuthToken();
      const sellerToUpdate = sellers.find(s => s.id === sellerId);
      const newLocked = sellerToUpdate.status === 'active';

      const response = await fetch(`${API_BASE_URL}/api/admin/sellers/${sellerId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ locked: newLocked })
      });

      const data = await response.json();

      if (data.success) {
        // Update the seller in the local state
        setSellers(sellers.map(seller => {
          if (seller.id === sellerId) {
            return { ...seller, status: newLocked ? 'suspended' : 'active' };
          }
          return seller;
        }));
      } else {
        alert(data.message || 'Failed to update seller status');
      }
    } catch (error) {
      console.error('Error updating seller status:', error);
      alert('Failed to update seller status');
    }
  };

  const handleDeleteSeller = async (sellerId) => {
    if (!window.confirm('Are you sure you want to delete this seller? This action cannot be undone.')) {
      return;
    }

    try {
      const token = getAuthToken();

      const response = await fetch(`${API_BASE_URL}/api/admin/sellers/${sellerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        // Remove the seller from local state
        setSellers(sellers.filter(seller => seller.id !== sellerId));
      } else {
        alert(data.message || 'Failed to delete seller');
      }
    } catch (error) {
      console.error('Error deleting seller:', error);
      alert('Failed to delete seller');
    }
  };

  const handleEditSeller = (seller) => {
    setEditingSeller(seller);
    setEditForm({
      ownerName: seller.ownerName || '',
      email: seller.email || '',
      phone: seller.phone || '',
      address: seller.address || '',
      storeName: seller.name || '',
      description: seller.description || ''
    });
    setShowEditModal(true);
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveSeller = async (e) => {
    e.preventDefault();
    
    try {
      const token = getAuthToken();

      const response = await fetch(`${API_BASE_URL}/api/admin/sellers/${editingSeller.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          full_name: editForm.ownerName,
          email: editForm.email,
          phone: editForm.phone,
          address: editForm.address,
          store_name: editForm.storeName,
          description: editForm.description
        })
      });

      const data = await response.json();

      if (data.success) {
        // Update the seller in local state
        setSellers(sellers.map(seller => 
          seller.id === editingSeller.id ? data.seller : seller
        ));
        setShowEditModal(false);
        setEditingSeller(null);
      } else {
        alert(data.message || 'Failed to update seller');
      }
    } catch (error) {
      console.error('Error updating seller:', error);
      alert('Failed to update seller');
    }
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingSeller(null);
    setEditForm({
      ownerName: '',
      email: '',
      phone: '',
      address: '',
      storeName: '',
      description: ''
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="seller-management">
      <div className="page-header">
        <h1>Seller Management</h1>
        <button className="btn-primary">
          Add New Seller
        </button>
      </div>

      <div className="filters-section">
        <div className="search-box">
          <FiSearch />
          <input
            type="text"
            placeholder="Search sellers..."
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>

        <div className="filters">
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
          <p>Loading sellers...</p>
        </div>
      ) : error ? (
        <div className="error">
          <p>Error: {error}</p>
          <button onClick={fetchSellers} className="btn-primary">
            Retry
          </button>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Store Name</th>
                  <th>Owner</th>
                  <th>Contact</th>
                  <th>Products</th>
                  <th>Sales</th>
                  <th>Rating</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSellers.map(seller => (
                  <tr key={seller.id}>
                    <td>{seller.name || 'N/A'}</td>
                    <td>{seller.ownerName || 'N/A'}</td>
                    <td>
                      <div className="contact-info">
                        <div>{seller.email || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{seller.phone || 'N/A'}</div>
                      </div>
                    </td>
                    <td>{seller.productsCount || 0}</td>
                    <td>{formatCurrency(seller.totalSales || 0)}</td>
                    <td>
                      <div className="rating">
                        <span className={`rating-value ${seller.rating >= 4 ? 'high' : seller.rating >= 3 ? 'medium' : 'low'}`}>
                          {seller.rating?.toFixed(1) || '0.0'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${seller.status}`}>
                        {seller.status?.charAt(0).toUpperCase() + seller.status?.slice(1)}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-icon" title="View Store">
                          <FiEye />
                        </button>
                        <button 
                          className="btn-icon" 
                          title="Edit Seller"
                          onClick={() => handleEditSeller(seller)}
                        >
                          <FiEdit2 />
                        </button>
                        <button 
                          className="btn-icon"
                          title={seller.status === 'active' ? 'Suspend Seller' : 'Activate Seller'}
                          onClick={() => handleStatusToggle(seller.id)}
                        >
                          {seller.status === 'active' ? <FiUserX /> : <FiUserCheck />}
                        </button>
                        <button 
                          className="btn-icon delete" 
                          title="Delete Seller"
                          onClick={() => handleDeleteSeller(seller.id)}
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

          {filteredSellers.length === 0 && !loading && (
            <div className="no-results">
              <p>No sellers found matching your search criteria.</p>
            </div>
          )}
        </>
      )}

      {/* Edit Seller Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Edit Seller</h2>
              <button className="modal-close" onClick={handleCancelEdit}>×</button>
            </div>
            <form onSubmit={handleSaveSeller}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="ownerName">Owner Name *</label>
                  <input
                    type="text"
                    id="ownerName"
                    name="ownerName"
                    value={editForm.ownerName}
                    onChange={handleEditFormChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={editForm.email}
                    onChange={handleEditFormChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="phone">Phone</label>
                  <input
                    type="text"
                    id="phone"
                    name="phone"
                    value={editForm.phone}
                    onChange={handleEditFormChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="address">Address</label>
                  <textarea
                    id="address"
                    name="address"
                    value={editForm.address}
                    onChange={handleEditFormChange}
                    rows="3"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="storeName">Store Name</label>
                  <input
                    type="text"
                    id="storeName"
                    name="storeName"
                    value={editForm.storeName}
                    onChange={handleEditFormChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="description">Store Description</label>
                  <textarea
                    id="description"
                    name="description"
                    value={editForm.description}
                    onChange={handleEditFormChange}
                    rows="4"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={handleCancelEdit}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerManagement; 