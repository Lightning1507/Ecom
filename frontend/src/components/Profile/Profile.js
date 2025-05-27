import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiEdit2, FiSettings, FiUser, FiMail, FiPhone, FiMapPin } from 'react-icons/fi';
import './Profile.css';

const Profile = () => {
  const [user, setUser] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1 234 567 8900',
    location: 'New York, USA',
    profilePic: 'https://via.placeholder.com/150',
    bio: 'Passionate about technology and innovation.'
  });

  const [isEditing, setIsEditing] = useState(false);

  const handleEdit = () => {
    setIsEditing(!isEditing);
  };

  const handleSave = (e) => {
    e.preventDefault();
    setIsEditing(false);
    // TODO: Implement save functionality
  };

  return (
    <motion.div 
      className="profile-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="profile-header">
        <motion.div 
          className="profile-pic-container"
          whileHover={{ scale: 1.05 }}
        >
          <img src={user.profilePic} alt="Profile" className="profile-pic" />
          <button className="edit-pic-button">
            <FiEdit2 />
          </button>
        </motion.div>
        
        <div className="profile-actions">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="edit-button"
            onClick={handleEdit}
          >
            <FiEdit2 /> Edit Profile
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="settings-button"
          >
            <FiSettings /> Settings
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
              <label>Bio:</label>
              <textarea
                value={user.bio}
                onChange={(e) => setUser({ ...user, bio: e.target.value })}
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              className="save-button"
            >
              Save Changes
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
            <div className="bio-section">
              <h3>Bio</h3>
              <p>{user.bio}</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Profile; 