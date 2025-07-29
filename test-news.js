const axios = require('axios');

// Simple test of our news fetching logic
async function testNewsFetching() {
  console.log('Testing news fetching...');
  
  try {
    // Test RSS with CORS proxy
    const rssUrl = 'https://feeds.bbci.co.uk/news/rss.xml';
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(rssUrl)}`;
    
    console.log('Trying to fetch BBC RSS via CORS proxy...');
    
    const response = await axios.get(proxyUrl, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    console.log(`Response status: ${response.status}`);
    console.log(`Response data length: ${response.data.length}`);
    
    // Simple RSS parsing
    const itemMatches = response.data.match(/<item[^>]*>([\s\S]*?)<\/item>/gi);
    
    if (itemMatches) {
      console.log(`Found ${itemMatches.length} RSS items`);
      
      // Parse first few items
      const articles = [];
      itemMatches.slice(0, 5).forEach((item, index) => {
        const titleMatch = item.match(/<title[^>]*>([^<]+)<\/title>/i);
        const linkMatch = item.match(/<link[^>]*>([^<]+)<\/link>/i);
        const pubDateMatch = item.match(/<pubDate[^>]*>([^<]+)<\/pubDate>/i);
        
        if (titleMatch && linkMatch) {
          const title = titleMatch[1].replace(/&[^;]+;/g, '').trim();
          const url = linkMatch[1].trim();
          const publishedAt = pubDateMatch ? new Date(pubDateMatch[1]).toISOString() : new Date().toISOString();
          
          articles.push({
            title,
            url,
            publishedAt
          });
        }
      });
      
      console.log('\nSample articles:');
      articles.forEach((article, index) => {
        console.log(`${index + 1}. ${article.title}`);
        console.log(`   Published: ${article.publishedAt}`);
        console.log(`   URL: ${article.url}`);
        console.log('');
      });
      
      console.log('✅ RSS fetching works! The issue is Docker rebuild.');
    } else {
      console.log('❌ No RSS items found in response');
    }
    
  } catch (error) {
    console.error('❌ Error fetching news:', error.message);
    
    // Try fallback API
    console.log('\nTrying fallback NewsAPI...');
    try {
      const apiResponse = await axios.get('https://newsapi.org/v2/top-headlines?country=us&apiKey=demo&pageSize=5');
      
      if (apiResponse.data && apiResponse.data.articles) {
        console.log(`✅ Found ${apiResponse.data.articles.length} articles from NewsAPI`);
        apiResponse.data.articles.forEach((article, index) => {
          console.log(`${index + 1}. ${article.title}`);
        });
      }
    } catch (apiError) {
      console.error('❌ NewsAPI also failed:', apiError.message);
    }
  }
}

testNewsFetching(); 