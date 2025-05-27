import React from 'react';
import { motion } from 'framer-motion';
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

const StatCard = ({ icon, title, value, change, changeType = 'increase', loading = false }) => {
  return (
    <motion.div
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      {loading ? (
        <div className="animate-pulse">
          <div className="h-8 w-8 bg-gray-200 rounded-full mb-4"></div>
          <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
          <div className="h-6 w-16 bg-gray-200 rounded"></div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-lg bg-gray-50">
              {icon}
            </div>
            {change && (
              <div className={`flex items-center text-sm ${
                changeType === 'increase' ? 'text-green-600' : 'text-red-600'
              }`}>
                {changeType === 'increase' ? (
                  <FiTrendingUp className="mr-1" />
                ) : (
                  <FiTrendingDown className="mr-1" />
                )}
                {change}
              </div>
            )}
          </div>
          <h3 className="mt-4 text-sm font-medium text-gray-500">{title}</h3>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>
        </>
      )}
    </motion.div>
  );
};

export default StatCard;
