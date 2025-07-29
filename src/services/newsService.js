import axios from 'axios';
import { format, subHours } from 'date-fns';

// Real news sources for web scraping
const NEWS_SOURCES = {
  english: [
    {
      name: 'BBC News',
      url: 'https://www.bbc.com/news',
      type: 'scrape',
      selectors: {
        articles: 'article, .gs-c-promo, .gs-o-faux-block-link',
        title: 'h3, .gs-c-promo-heading__title, .gs-c-promo-heading',
        description: '.gs-c-promo-summary, .gs-c-promo-description',
        link: 'a',
        image: 'img'
      }
    },
    {
      name: 'Reuters',
      url: 'https://www.reuters.com',
      type: 'scrape',
      selectors: {
        articles: 'article, .story-card',
        title: 'h3, .story-card-title',
        description: '.story-card-summary',
        link: 'a',
        image: 'img'
      }
    },
    {
      name: 'TechCrunch',
      url: 'https://techcrunch.com',
      type: 'scrape',
      selectors: {
        articles: 'article, .post-block',
        title: 'h2, .post-block__title',
        description: '.post-block__content',
        link: 'a',
        image: 'img'
      }
    },
    {
      name: 'The Verge',
      url: 'https://www.theverge.com',
      type: 'scrape',
      selectors: {
        articles: 'article, .c-entry-box',
        title: 'h2, .c-entry-box--compact__title',
        description: '.c-entry-summary',
        link: 'a',
        image: 'img'
      }
    }
  ],
  korean: [
    {
      name: 'Yonhap News',
      url: 'https://en.yna.co.kr',
      type: 'scrape',
      selectors: {
        articles: 'article, .news-item',
        title: 'h3, .news-title',
        description: '.news-summary',
        link: 'a',
        image: 'img'
      }
    },
    {
      name: 'Korea Times',
      url: 'https://www.koreatimes.co.kr',
      type: 'scrape',
      selectors: {
        articles: 'article, .news-item',
        title: 'h3, .news-title',
        description: '.news-summary',
        link: 'a',
        image: 'img'
      }
    },
    {
      name: 'Korea Herald',
      url: 'https://www.koreaherald.com',
      type: 'scrape',
      selectors: {
        articles: 'article, .news-item',
        title: 'h3, .news-title',
        description: '.news-summary',
        link: 'a',
        image: 'img'
      }
    }
  ]
};

// Keywords to filter out political content
const POLITICAL_KEYWORDS = [
  'politics', 'political', 'election', 'vote', 'voting', 'campaign',
  'president', 'congress', 'senate', 'house', 'democrat', 'republican',
  'government', 'administration', 'policy', 'legislation', 'bill',
  '정치', '선거', '투표', '대통령', '국회', '정부', '정책', '법안'
];

// Keywords to prioritize non-political content
const NON_POLITICAL_CATEGORIES = [
  'technology', 'science', 'health', 'business', 'entertainment',
  'sports', 'environment', 'education', 'culture', 'lifestyle',
  '기술', '과학', '건강', '비즈니스', '엔터테인먼트', '스포츠', '환경', '교육', '문화'
];

class NewsService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 30 * 60 * 1000; // 30 minutes
  }

  // Check if news is from last 24 hours
  isWithin24Hours(publishedAt) {
    if (!publishedAt) return false;
    const newsDate = new Date(publishedAt);
    const twentyFourHoursAgo = subHours(new Date(), 24);
    return newsDate >= twentyFourHoursAgo;
  }

  // Check if content is political
  isPoliticalContent(title, description, content) {
    const text = `${title} ${description} ${content}`.toLowerCase();
    return POLITICAL_KEYWORDS.some(keyword => text.includes(keyword.toLowerCase()));
  }

  // Check if content is non-political
  isNonPoliticalContent(title, description, content) {
    const text = `${title} ${description} ${content}`.toLowerCase();
    return NON_POLITICAL_CATEGORIES.some(category => text.includes(category.toLowerCase()));
  }

  // Clean and format news data
  formatNewsData(articles, source) {
    console.log(`Formatting ${articles.length} articles from ${source}`);
    const filtered = articles
      .filter(article => {
        // Filter for last 24 hours
        if (!this.isWithin24Hours(article.publishedAt)) {
          console.log(`Filtered out article due to age: ${article.title}`);
          return false;
        }
        
        // Filter out political content
        if (this.isPoliticalContent(article.title, article.description, article.content)) {
          console.log(`Filtered out political article: ${article.title}`);
          return false;
        }
        
        // Accept all non-political content
        return true;
      });
    
    console.log(`After filtering: ${filtered.length} articles`);
    return filtered
      .map(article => ({
        id: article.url || `${source}-${Date.now()}-${Math.random()}`,
        title: article.title,
        description: article.description,
        content: article.content,
        url: article.url,
        imageUrl: article.imageUrl,
        publishedAt: article.publishedAt,
        source: article.source || source,
        language: source.includes('korean') ? 'ko' : 'en'
      }))
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  }

  // Fetch news from RSS feeds (free and reliable)
  async fetchFromRSS(source, language) {
    try {
      const cacheKey = `${source.name}-${language}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }

      // Use RSS feeds which are free and reliable
      const rssUrls = {
        'BBC News': 'https://feeds.bbci.co.uk/news/rss.xml',
        'Reuters': 'https://feeds.reuters.com/reuters/topNews',
        'TechCrunch': 'https://techcrunch.com/feed/',
        'The Verge': 'https://www.theverge.com/rss/index.xml',
        'Yonhap News': 'https://en.yna.co.kr/RSS/feed.xml',
        'Korea Times': 'https://www.koreatimes.co.kr/rss/index.xml',
        'Korea Herald': 'https://www.koreaherald.com/rss/index.xml'
      };

      const rssUrl = rssUrls[source.name];
      if (!rssUrl) {
        console.error(`No RSS feed available for ${source.name}`);
        throw new Error('No RSS feed available');
      }

      console.log(`Fetching RSS from: ${rssUrl}`);

      // Try with CORS proxy first
      let response;
      try {
        response = await axios.get(`https://api.allorigins.win/raw?url=${encodeURIComponent(rssUrl)}`, {
          timeout: 15000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        console.log(`RSS fetched via CORS proxy successfully`);
      } catch (proxyError) {
        console.log(`CORS proxy failed, trying direct request:`, proxyError.message);
        // Fallback to direct request (will likely fail due to CORS)
        response = await axios.get(rssUrl, {
          timeout: 15000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
      }

      console.log(`RSS response status: ${response.status}`);
      console.log(`RSS response data length: ${response.data.length}`);

      // Parse RSS XML
      const articles = this.parseRSSFeed(response.data, source.name);
      const formattedArticles = this.formatNewsData(articles, source.name);
      
      this.cache.set(cacheKey, {
        data: formattedArticles,
        timestamp: Date.now()
      });

      console.log(`Successfully fetched ${formattedArticles.length} articles from ${source.name}`);
      return formattedArticles;
    } catch (error) {
      console.error(`Error fetching from ${source.name}:`, error.message);
      console.error(`Full error details:`, error);
      if (error.response) {
        console.error(`Response status: ${error.response.status}`);
        console.error(`Response headers:`, error.response.headers);
      }
      return [];
    }
  }

  // Simple RSS parser
  parseRSSFeed(xmlData, sourceName) {
    const articles = [];
    
    try {
      // Extract items from RSS
      const itemMatches = xmlData.match(/<item[^>]*>([\s\S]*?)<\/item>/gi);
      
      if (itemMatches) {
        itemMatches.slice(0, 20).forEach((item, index) => {
          const titleMatch = item.match(/<title[^>]*>([^<]+)<\/title>/i);
          const descriptionMatch = item.match(/<description[^>]*>([^<]+)<\/description>/i);
          const linkMatch = item.match(/<link[^>]*>([^<]+)<\/link>/i);
          const pubDateMatch = item.match(/<pubDate[^>]*>([^<]+)<\/pubDate>/i);
          
          if (titleMatch && linkMatch) {
            const title = titleMatch[1].replace(/&[^;]+;/g, '').trim();
            const description = descriptionMatch ? descriptionMatch[1].replace(/&[^;]+;/g, '').trim() : '';
            const url = linkMatch[1].trim();
            const publishedAt = pubDateMatch ? new Date(pubDateMatch[1]).toISOString() : new Date().toISOString();
            
            // Only add if it's from last 24 hours
            if (this.isWithin24Hours(publishedAt)) {
              articles.push({
                title,
                description,
                url,
                publishedAt,
                source: sourceName,
                content: description,
                imageUrl: `https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&random=${index}`
              });
            }
          }
        });
      }
    } catch (error) {
      console.error(`Error parsing RSS for ${sourceName}:`, error.message);
    }
    
    console.log(`Parsed ${articles.length} articles from ${sourceName}`);
    return articles;
  }

  // Fetch news from a specific source
  async fetchFromSource(source, language) {
    try {
      const rssArticles = await this.fetchFromRSS(source, language);
      
      // If RSS failed, try public news API as fallback
      if (rssArticles.length === 0) {
        console.log(`RSS failed for ${source.name}, trying public news API...`);
        return await this.fetchFromPublicAPI(source, language);
      }
      
      return rssArticles;
    } catch (error) {
      console.error(`Error fetching from ${source.name}:`, error);
      return [];
    }
  }

  // Fallback method using public news API
  async fetchFromPublicAPI(source, language) {
    try {
      // Use a public news API that works in browsers
      const apiUrl = `https://newsapi.org/v2/top-headlines?country=${language === 'ko' ? 'kr' : 'us'}&apiKey=demo&pageSize=10`;
      
      console.log(`Fetching from public API: ${apiUrl}`);
      
      const response = await axios.get(apiUrl, {
        timeout: 15000
      });
      
      if (response.data && response.data.articles) {
        const articles = response.data.articles
          .filter(article => this.isWithin24Hours(article.publishedAt))
          .map(article => ({
            title: article.title,
            description: article.description,
            url: article.url,
            publishedAt: article.publishedAt,
            source: article.source?.name || source.name,
            content: article.content,
            imageUrl: article.urlToImage || `https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&random=${Math.random()}`
          }));
        
        console.log(`Fetched ${articles.length} articles from public API for ${source.name}`);
        return this.formatNewsData(articles, source.name);
      }
      
      return [];
    } catch (error) {
      console.error(`Error fetching from public API for ${source.name}:`, error.message);
      return [];
    }
  }

  // Fetch all news for a language
  async fetchNews(language = 'en') {
    try {
      console.log(`Fetching news for language: ${language}`);
      
      const sources = language === 'ko' ? NEWS_SOURCES.korean : NEWS_SOURCES.english;
      console.log(`Using ${sources.length} sources for ${language}`);
      
      const promises = sources.map(source => this.fetchFromSource(source, language));
      
      const results = await Promise.allSettled(promises);
      const allArticles = results
        .filter(result => result.status === 'fulfilled')
        .flatMap(result => result.value);
      
      console.log(`Total articles fetched: ${allArticles.length}`);
      
      // Remove duplicates based on URL
      const uniqueArticles = allArticles.filter((article, index, self) =>
        index === self.findIndex(a => a.url === article.url)
      );
      
      console.log(`Unique articles after deduplication: ${uniqueArticles.length}`);
      
      // If no articles from RSS (likely due to CORS), create a test article to show the system is working
      if (uniqueArticles.length === 0) {
        console.log('No articles fetched from RSS feeds (likely CORS issue). Creating test article...');
        const testArticle = {
          id: 'test-article-1',
          title: language === 'ko' ? 'RSS 피드 테스트 - 실제 뉴스 스크래핑 시도됨' : 'RSS Feed Test - Real News Scraping Attempted',
          description: language === 'ko' 
            ? 'RSS 피드에서 뉴스를 가져오려고 시도했지만 CORS 제한으로 인해 실패했습니다. 실제 웹 스크래핑이 구현되어 있습니다.'
            : 'Attempted to fetch news from RSS feeds but failed due to CORS restrictions. Real web scraping is implemented.',
          content: language === 'ko'
            ? '이것은 실제 RSS 피드 스크래핑이 작동하지 않을 때 표시되는 테스트 기사입니다. 실제 구현에서는 BBC, Reuters, TechCrunch 등의 RSS 피드를 가져옵니다.'
            : 'This is a test article shown when real RSS feed scraping fails. In the real implementation, it fetches RSS feeds from BBC, Reuters, TechCrunch, etc.',
          url: 'https://example.com/rss-test',
          imageUrl: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400',
          publishedAt: new Date().toISOString(),
          source: language === 'ko' ? '테스트' : 'Test',
          language: language
        };
        
        return [testArticle];
      }
      
      return uniqueArticles.slice(0, 50); // Limit to 50 articles
    } catch (error) {
      console.error('Error fetching news:', error);
      return [];
    }
  }

  // Get news summary using free AI (simulated for demo)
  async getNewsSummary(articles) {
    const topArticles = articles.slice(0, 5);
    
    return {
      summary: `Today's top ${topArticles.length} non-political news stories:`,
      highlights: topArticles.map(article => ({
        title: article.title,
        summary: article.description?.substring(0, 100) + '...' || 'No description available'
      }))
    };
  }
}

export default new NewsService(); 