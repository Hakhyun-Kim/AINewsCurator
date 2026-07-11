import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Globe, Newspaper, Settings, RefreshCw, Moon, Sun } from 'lucide-react';
import NewsService from './services/newsService';
import NewsCard from './components/NewsCard';
import NewsSummary from './components/NewsSummary';
import AskNews from './components/AskNews';
import LoadingSpinner from './components/LoadingSpinner';

function App() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState('en');
  const [darkMode, setDarkMode] = useState(false);
  const [summary, setSummary] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    // Load saved preferences
    const savedLanguage = localStorage.getItem('newsLanguage') || 'en';
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    
    setLanguage(savedLanguage);
    setDarkMode(savedDarkMode);
    
    // Apply dark mode
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  useEffect(() => {
    // Save preferences
    localStorage.setItem('newsLanguage', language);
    localStorage.setItem('darkMode', darkMode);
    
    // Apply dark mode
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [language, darkMode]);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const newsData = await NewsService.fetchNews(language);
      setNews(newsData);
      setLastUpdated(new Date());
      
      // Get AI summary
      const summaryData = await NewsService.getNewsSummary(newsData);
      setSummary(summaryData);
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, [language]);

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
  };

  const handleRefresh = () => {
    fetchNews();
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <Router>
      <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        {/* Header */}
        <header className={`sticky top-0 z-50 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b shadow-sm`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <Newspaper className="h-8 w-8 text-blue-600" />
                <h1 className="text-xl font-bold">AI News Curator</h1>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Language Selector */}
                <div className="flex items-center space-x-2">
                  <Globe className="h-5 w-5" />
                  <select
                    value={language}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    className={`px-3 py-1 rounded-md border ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  >
                    <option value="en">English</option>
                    <option value="ko">한국어</option>
                  </select>
                </div>

                {/* Dark Mode Toggle */}
                <button
                  onClick={toggleDarkMode}
                  className={`p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors`}
                  title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                  {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </button>

                {/* Refresh Button */}
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className={`p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
                    loading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  title="Refresh News"
                >
                  <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={
              <div className="space-y-8">
                {/* Last Updated Info */}
                {lastUpdated && (
                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Last updated: {lastUpdated.toLocaleString()}
                  </div>
                )}

                {/* AI Summary */}
                {summary && <NewsSummary summary={summary} darkMode={darkMode} />}

                {/* Semantic search over today's articles (in-browser RAG) */}
                {!loading && news.length > 0 && (
                  <AskNews articles={news} darkMode={darkMode} language={language} />
                )}

                {/* News Grid */}
                {loading ? (
                  <LoadingSpinner />
                ) : news.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {news.map((article) => (
                      <NewsCard 
                        key={article.id} 
                        article={article} 
                        darkMode={darkMode}
                        language={language}
                      />
                    ))}
                  </div>
                ) : (
                  <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    <Newspaper className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">No news available at the moment.</p>
                    <p className="text-sm mt-2">Try refreshing or check your internet connection.</p>
                  </div>
                )}
              </div>
            } />
          </Routes>
        </main>

        {/* Footer */}
        <footer className={`mt-16 py-8 border-t ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                AI News Curator - Bringing you the latest non-political news from around the world
              </p>
              <p className={`text-xs mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                Powered by free news APIs • Updated every 30 minutes
              </p>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App; 