import React from 'react';
import { Sparkles, TrendingUp } from 'lucide-react';

const NewsSummary = ({ summary, darkMode }) => {
  return (
    <div className={`rounded-lg p-6 ${
      darkMode 
        ? 'bg-gray-800 border border-gray-700' 
        : 'bg-white border border-gray-200'
    } shadow-sm`}>
      <div className="flex items-center space-x-3 mb-4">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold">AI News Summary</h2>
        </div>
        <div className="flex items-center space-x-1 text-sm text-gray-500">
          <TrendingUp className="h-4 w-4" />
          <span>Top Stories</span>
        </div>
      </div>

      <p className={`text-sm mb-4 ${
        darkMode ? 'text-gray-300' : 'text-gray-600'
      }`}>
        {summary.summary}
      </p>

      {summary.highlights && summary.highlights.length > 0 && (
        <div className="space-y-3">
          {summary.highlights.map((highlight, index) => (
            <div key={index} className="flex items-start space-x-3">
              <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                darkMode ? 'bg-blue-500' : 'bg-blue-600'
              }`} />
              <div className="flex-1">
                <h4 className="text-sm font-medium mb-1">
                  {highlight.title}
                </h4>
                <p className={`text-xs ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {highlight.summary}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NewsSummary; 