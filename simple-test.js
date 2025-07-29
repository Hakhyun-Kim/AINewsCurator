const https = require('https');
const http = require('http');

// Simple test using Node.js built-in modules
async function testNewsFetching() {
  console.log('Testing news fetching with Node.js built-in modules...');
  
  try {
    // Test RSS with CORS proxy
    const rssUrl = 'https://feeds.bbci.co.uk/news/rss.xml';
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(rssUrl)}`;
    
    console.log('Trying to fetch BBC RSS via CORS proxy...');
    console.log('URL:', proxyUrl);
    
    const response = await makeRequest(proxyUrl);
    
    console.log(`Response received, data length: ${response.length}`);
    
    // Simple RSS parsing
    const itemMatches = response.match(/<item[^>]*>([\s\S]*?)<\/item>/gi);
    
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
          
          // Check if it's from last 24 hours
          const newsDate = new Date(publishedAt);
          const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          const isRecent = newsDate >= twentyFourHoursAgo;
          
          articles.push({
            title,
            url,
            publishedAt,
            isRecent
          });
        }
      });
      
      console.log('\nSample articles from BBC RSS:');
      articles.forEach((article, index) => {
        console.log(`${index + 1}. ${article.title}`);
        console.log(`   Published: ${article.publishedAt}`);
        console.log(`   Recent (24h): ${article.isRecent ? '✅' : '❌'}`);
        console.log(`   URL: ${article.url.substring(0, 60)}...`);
        console.log('');
      });
      
      const recentCount = articles.filter(a => a.isRecent).length;
      console.log(`✅ RSS fetching works! Found ${recentCount} recent articles from last 24 hours.`);
      console.log('📝 The issue is that Docker container needs to be rebuilt with this code.');
      
    } else {
      console.log('❌ No RSS items found in response');
      console.log('Response preview:', response.substring(0, 500));
    }
    
  } catch (error) {
    console.error('❌ Error fetching news:', error.message);
    
    // Try direct BBC RSS (will likely fail due to CORS in browser, but works in Node.js)
    console.log('\nTrying direct BBC RSS feed...');
    try {
      const directResponse = await makeRequest('https://feeds.bbci.co.uk/news/rss.xml');
      console.log(`✅ Direct RSS also works! Data length: ${directResponse.length}`);
      
      const directItems = directResponse.match(/<item[^>]*>([\s\S]*?)<\/item>/gi);
      if (directItems) {
        console.log(`Found ${directItems.length} items from direct RSS feed`);
      }
    } catch (directError) {
      console.error('❌ Direct RSS also failed:', directError.message);
    }
  }
}

// Simple HTTP request function using Node.js built-in modules
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    };
    
    const req = protocol.get(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve(data);
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

testNewsFetching(); 