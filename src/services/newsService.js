import axios from 'axios';
import { format, subHours } from 'date-fns';

// Economy/business section feeds only — the app's default (and only) view.
// Shared with scripts/fetch-news.js, which snapshots the same feeds
// server-side at deploy time.
import NEWS_SOURCES from '../newsSources.json';

// Keywords to filter out political content
const POLITICAL_KEYWORDS = [
  'politics', 'political', 'election', 'vote', 'voting', 'campaign',
  'president', 'congress', 'senate', 'house', 'democrat', 'republican',
  'government', 'administration', 'policy', 'legislation', 'bill',
  '정치', '선거', '투표', '대통령', '국회', '정부', '정책', '법안'
];

// Keywords to filter out sports content
const SPORTS_KEYWORDS = [
  'sports', 'football', 'soccer', 'baseball', 'basketball', 'volleyball',
  'tennis', 'golf', 'olympic', 'olympics', 'world cup', 'premier league',
  'champions league', 'nba', 'nfl', 'mlb', 'fifa', 'formula 1', 'grand slam',
  '스포츠', '축구', '야구', '농구', '배구', '골프', '올림픽', '월드컵'
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

  // ASCII keywords match on word boundaries ("bill" must not hit "billion",
  // "house" must not hit "household"); Korean keywords match as substrings
  // since Korean text has no usable word boundaries.
  matchesKeyword(text, keyword) {
    if (/^[\x20-\x7E]+$/.test(keyword)) {
      const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(`\\b${escaped}\\b`).test(text);
    }
    return text.includes(keyword);
  }

  // Check if content is political
  isPoliticalContent(title, description, content) {
    const text = `${title} ${description} ${content}`.toLowerCase();
    return POLITICAL_KEYWORDS.some(keyword => this.matchesKeyword(text, keyword.toLowerCase()));
  }

  // Check if content is sports
  isSportsContent(title, description, content) {
    const text = `${title} ${description} ${content}`.toLowerCase();
    return SPORTS_KEYWORDS.some(keyword => this.matchesKeyword(text, keyword.toLowerCase()));
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

        // Filter out sports content
        if (this.isSportsContent(article.title, article.description, article.content)) {
          console.log(`Filtered out sports article: ${article.title}`);
          return false;
        }

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

      if (!source.rss) {
        console.error(`No RSS feed available for ${source.name}`);
        throw new Error('No RSS feed available');
      }

      console.log(`Fetching RSS from: ${source.rss}`);

      // Browsers cannot read most RSS feeds directly (no CORS headers), so go
      // through services that add them: rss2json first, then the allorigins
      // raw proxy, then a direct request as a last resort.
      let articles;
      try {
        articles = await this.fetchViaRss2Json(source.rss, source.name);
        console.log(`RSS fetched via rss2json successfully`);
      } catch (rss2jsonError) {
        console.log(`rss2json failed for ${source.name} (${rss2jsonError.message}), trying CORS proxy...`);
        const response = await axios
          .get(`https://api.allorigins.win/raw?url=${encodeURIComponent(source.rss)}`, { timeout: 15000 })
          .catch(() => axios.get(source.rss, { timeout: 15000 }));
        articles = this.parseRSSFeed(response.data, source.name);
      }

      const formattedArticles = this.formatNewsData(articles, source.name);

      this.cache.set(cacheKey, {
        data: formattedArticles,
        timestamp: Date.now()
      });

      console.log(`Successfully fetched ${formattedArticles.length} articles from ${source.name}`);
      return formattedArticles;
    } catch (error) {
      console.error(`Error fetching from ${source.name}:`, error.message);
      return [];
    }
  }

  // rss2json converts any RSS feed to JSON and sends CORS headers
  async fetchViaRss2Json(rssUrl, sourceName) {
    const response = await axios.get(
      `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`,
      { timeout: 15000 }
    );
    const data = response.data;
    if (!data || data.status !== 'ok' || !Array.isArray(data.items)) {
      throw new Error(`unexpected rss2json status: ${data && data.status}`);
    }
    return data.items.slice(0, 20).map((item, index) => ({
      title: this.stripHtml(item.title),
      description: this.stripHtml(item.description).slice(0, 300),
      url: item.link,
      publishedAt: this.parseRss2JsonDate(item.pubDate),
      source: sourceName,
      content: this.stripHtml(item.content || item.description),
      imageUrl:
        item.thumbnail ||
        (item.enclosure && item.enclosure.link) ||
        `https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&random=${index}`
    }));
  }

  // rss2json normalizes pubDate to UTC "YYYY-MM-DD HH:mm:ss"
  parseRss2JsonDate(pubDate) {
    if (!pubDate) return new Date().toISOString();
    const date = new Date(`${pubDate.replace(' ', 'T')}Z`);
    return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
  }

  stripHtml(html) {
    if (!html) return '';
    return html
      .replace(/<[^>]*>/g, ' ')
      .replace(/&[^;\s]{1,10};/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
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

  // The deploy workflow periodically fetches all feeds server-side and ships
  // them as a static news.json next to the app (see scripts/fetch-news.js).
  // Same-origin, so immune to CORS and third-party proxy outages.
  async fetchFromSnapshot(language) {
    try {
      const base = process.env.PUBLIC_URL || '';
      const response = await axios.get(`${base}/news.json`, { timeout: 8000 });
      const articles = response.data && response.data[language === 'ko' ? 'korean' : 'english'];
      if (!Array.isArray(articles)) return [];
      return this.formatNewsData(articles, 'snapshot');
    } catch (error) {
      console.log(`No news snapshot available (${error.message})`);
      return [];
    }
  }

  // Fetch all news for a language
  async fetchNews(language = 'en') {
    try {
      console.log(`Fetching news for language: ${language}`);

      // Prefer the static snapshot; fall back to live RSS fetching (dev
      // servers and stale deployments don't have a fresh snapshot).
      const snapshotArticles = await this.fetchFromSnapshot(language);
      if (snapshotArticles.length > 0) {
        console.log(`Using ${snapshotArticles.length} articles from static snapshot`);
        return snapshotArticles.slice(0, 50);
      }

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
      summary: `Today's top ${topArticles.length} economy & business stories:`,
      highlights: topArticles.map(article => ({
        title: article.title,
        summary: article.description?.substring(0, 100) + '...' || 'No description available'
      }))
    };
  }
}

export default new NewsService(); 