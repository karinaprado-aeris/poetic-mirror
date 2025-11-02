import React from 'react';

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex justify-center items-center" aria-label="Loading reflection">
      <div className="w-12 h-12 border-4 border-t-blue-500 border-r-blue-500 border-b-gray-800 border-l-gray-800 rounded-full animate-spin"></div>
    </div>
  );
};