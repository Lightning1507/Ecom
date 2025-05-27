import React from 'react';
import { FiArrowUp, FiArrowDown } from 'react-icons/fi';

const TableHeader = ({ name, sortConfig, onSort, sortable = true, className = '' }) => {
  const canSort = sortable && onSort;
  const isSorted = sortConfig?.key === name.toLowerCase();
  const isAscending = isSorted && sortConfig.direction === 'asc';
  const isDescending = isSorted && sortConfig.direction === 'desc';

  const handleClick = () => {
    if (!canSort) return;
    
    const direction = isDescending ? 'asc' : 'desc';
    onSort(name.toLowerCase(), direction);
  };

  return (
    <th 
      scope="col" 
      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${className} ${
        canSort ? 'cursor-pointer select-none group' : ''
      }`}
      onClick={handleClick}
    >
      <div className="flex items-center">
        {name}
        {canSort && (
          <span className="ml-1 flex flex-col">
            <FiArrowUp 
              className={`h-3 w-3 -mb-0.5 ${
                isAscending ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
              }`} 
            />
            <FiArrowDown 
              className={`h-3 w-3 -mt-0.5 ${
                isDescending ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
              }`} 
            />
          </span>
        )}
      </div>
    </th>
  );
};

export default TableHeader;
