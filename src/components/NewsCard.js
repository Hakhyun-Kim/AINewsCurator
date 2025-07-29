import React from 'react';
import { ExternalLink, Calendar, Clock } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

const NewsCard = ({ article, darkMode, language }) => {
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return format(date, 'HH:mm');
  };

  const handleReadMore = () => {
    if (article.url) {
      window.open(article.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <article className={`rounded-lg shadow-md overflow-hidden card-hover ${
      darkMode 
        ? 'bg-gray-800 border border-gray-700 hover:border-gray-600' 
        : 'bg-white border border-gray-200 hover:border-gray-300'
    }`}>
      {/* Image */}
      {article.imageUrl && (
        <div className="relative h-48 overflow-hidden">
          <img
            src={article.imageUrl}
            alt={article.title}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <div className="absolute top-2 right-2">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              darkMode 
                ? 'bg-gray-800 text-gray-200' 
                : 'bg-white text-gray-700'
            } shadow-sm`}>
              {article.source}
            </span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {/* Title */}
        <h3 className="text-lg font-semibold mb-3 line-clamp-2 leading-tight">
          {article.title}
        </h3>

        {/* Description */}
        {article.description && (
          <p className={`text-sm mb-4 line-clamp-3 ${
            darkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {article.description}
          </p>
        )}

        {/* Meta Information */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(article.publishedAt)}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="h-3 w-3" />
            <span>{formatTime(article.publishedAt)}</span>
          </div>
        </div>

        {/* Read More Button */}
        <button
          onClick={handleReadMore}
          disabled={!article.url}
          className={`w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-md btn-hover ${
            article.url
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <span>{language === 'ko' ? '더 보기' : 'Read More'}</span>
          <ExternalLink className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
};

export default NewsCard; 