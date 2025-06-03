import React, { useState } from 'react';
import { 
  FiSearch, 
  FiEdit2, 
  FiTrash2, 
  FiUserX, 
  FiUserCheck,
  FiRefreshCw,
  FiEye,
  FiDollarSign
} from 'react-icons/fi';
import './SellerManagement.css';

const SellerManagement = () => {
  // Mock data - replace with API calls
  const mockSellers = [
    { 
      id: 1, 
      name: 'Tech Store',
      ownerName: 'John Smith',
      email: 'john@techstore.com',
      phone: '+1 (555) 123-4567',
      status: 'active',
      productsCount: 45,
      totalSales: 15800,
      rating: 4.5,
      joinDate: '2024-01-15',
      lastActive: '2024-03-10',
      verificationStatus: 'verified'
    },
    { 
      id: 2, 
      name: 'Fashion Boutique',
      ownerName: 'Sarah Wilson',
      email: 'sarah@fashionboutique.com',
      phone: '+1 (555) 234-5678',
      status: 'active',
      productsCount: 78,
      totalSales: 25600,
      rating: 4.8,
      joinDate: '2024-02-01',
      lastActive: '2024-03-12',
      verificationStatus: 'verified'
    },
    { 
      id: 3, 
      name: 'Home Decor Plus',
      ownerName: 'Mike Johnson',
      email: 'mike@homedecor.com',
      phone: '+1 (555) 345-6789',
      status: 'suspended',
      productsCount: 32,
      totalSales: 8900,
      rating: 3.9,
      joinDate: '2024-01-20',
      lastActive: '2024-02-15',
      verificationStatus: 'pending'
    }
  ];

  const [sellers, setSellers] = useState(mockSellers);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterVerification, setFilterVerification] = useState('all');
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    
    const filtered = mockSellers.filter(seller => 
      seller.name.toLowerCase().includes(term) ||
      seller.ownerName.toLowerCase().includes(term) ||
      seller.email.toLowerCase().includes(term)
    );
    setSellers(filtered);
  };

  const handleFilter = () => {
    let filtered = mockSellers;

    if (filterStatus !== 'all') {
      filtered = filtered.filter(seller => seller.status === filterStatus);
    }

    if (filterVerification !== 'all') {
      filtered = filtered.filter(seller => seller.verificationStatus === filterVerification);
    }

    if (searchTerm) {
      filtered = filtered.filter(seller =>
        seller.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        seller.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        seller.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setSellers(filtered);
  };

  const handleReset = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setFilterVerification('all');
    setSellers(mockSellers);
  };

  const handleStatusToggle = (sellerId) => {
    setSellers(sellers.map(seller => {
      if (seller.id === sellerId) {
        const newStatus = seller.status === 'active' ? 'suspended' : 'active';
        return { ...seller, status: newStatus };
      }
      return seller;
    }));
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

          <div className="filter-group">
            <label>Verification:</label>
            <select 
              value={filterVerification}
              onChange={(e) => {
                setFilterVerification(e.target.value);
                handleFilter();
              }}
            >
              <option value="all">All</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
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
              <th>Store Name</th>
              <th>Owner</th>
              <th>Contact</th>
              <th>Products</th>
              <th>Sales</th>
              <th>Rating</th>
              <th>Status</th>
              <th>Verification</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sellers.map(seller => (
              <tr key={seller.id}>
                <td>{seller.name}</td>
                <td>{seller.ownerName}</td>
                <td>
                  <div className="contact-info">
                    <div>{seller.email}</div>
                    <div className="text-sm text-gray-500">{seller.phone}</div>
                  </div>
                </td>
                <td>{seller.productsCount}</td>
                <td>{formatCurrency(seller.totalSales)}</td>
                <td>
                  <div className="rating">
                    <span className={`rating-value ${seller.rating >= 4 ? 'high' : seller.rating >= 3 ? 'medium' : 'low'}`}>
                      {seller.rating.toFixed(1)}
                    </span>
                  </div>
                </td>
                <td>
                  <span className={`status-badge ${seller.status}`}>
                    {seller.status.charAt(0).toUpperCase() + seller.status.slice(1)}
                  </span>
                </td>
                <td>
                  <span className={`verification-badge ${seller.verificationStatus}`}>
                    {seller.verificationStatus.charAt(0).toUpperCase() + seller.verificationStatus.slice(1)}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-icon" title="View Store">
                      <FiEye />
                    </button>
                    <button className="btn-icon" title="Edit Seller">
                      <FiEdit2 />
                    </button>
                    <button 
                      className="btn-icon"
                      title={seller.status === 'active' ? 'Suspend Seller' : 'Activate Seller'}
                      onClick={() => handleStatusToggle(seller.id)}
                    >
                      {seller.status === 'active' ? <FiUserX /> : <FiUserCheck />}
                    </button>
                    <button className="btn-icon delete" title="Delete Seller">
                      <FiTrash2 />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sellers.length === 0 && (
        <div className="no-results">
          <p>No sellers found matching your search criteria.</p>
        </div>
      )}
    </div>
  );
};

export default SellerManagement; 