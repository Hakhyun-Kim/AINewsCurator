import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
      <p className="mt-4 text-sm text-gray-500">Loading latest news...</p>
    </div>
  );
};

export default LoadingSpinner; 