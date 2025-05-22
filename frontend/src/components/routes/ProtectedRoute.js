import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const ProtectedRoute = ({ children, roles = [] }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  // If roles are specified, check if user has the required role
  if (roles.length > 0 && (!user.role || !roles.includes(user.role))) {
    return <Navigate to="/" />;
  }

  return children;
};

export default ProtectedRoute;