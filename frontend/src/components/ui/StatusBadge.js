import React from 'react';
import { FiCheck, FiX, FiClock, FiAlertCircle } from 'react-icons/fi';

const statusStyles = {
  active: {
    bg: 'bg-green-50',
    text: 'text-green-800',
    icon: <FiCheck className="h-3 w-3" />,
  },
  inactive: {
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    icon: <FiX className="h-3 w-3" />,
  },
  pending: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-800',
    icon: <FiClock className="h-3 w-3" />,
  },
  low_stock: {
    bg: 'bg-orange-50',
    text: 'text-orange-800',
    icon: <FiAlertCircle className="h-3 w-3" />,
  },
  out_of_stock: {
    bg: 'bg-red-50',
    text: 'text-red-800',
    icon: <FiX className="h-3 w-3" />,
  },
};

const StatusBadge = ({ status }) => {
  const statusKey = status.toLowerCase().replace(/\s+/g, '_');
  const { bg, text, icon } = statusStyles[statusKey] || statusStyles.inactive;
  
  const getDisplayText = (status) => {
    const statusMap = {
      active: 'Active',
      inactive: 'Inactive',
      pending: 'Pending',
      low_stock: 'Low Stock',
      out_of_stock: 'Out of Stock',
    };
    
    return statusMap[statusKey] || status;
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}>
      <span className="mr-1">{icon}</span>
      {getDisplayText(status)}
    </span>
  );
};

export default StatusBadge;
