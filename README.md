# AI News Curator

[한국어 README](README.ko.md)

A modern, AI-powered news curator that aggregates economy & business news from multiple sources, showing only the last 24 hours with politics and sports filtered out. Available as both a web application and desktop app.

## Features

### ✅ Core Requirements Met
- **Free AI Integration**: On-device embeddings for semantic search (no API key), free news APIs, simulated headline summaries
- **Economy by Default**: the feed is built from economy/business section feeds only
- **24-Hour News Filter**: Only shows news from the last 24 hours
- **No Politics, No Sports**: keyword filters drop political and sports stories
- **Korean & English Support**: Supports both Korean and English newspapers
- **Multiple News Sources**: Aggregates from multiple free news APIs
- **Desktop & Mobile Ready**: Runs as desktop app or web application

### 🚀 Additional Features
- **Ask the News (RAG)**: semantic search over today's articles with in-browser embeddings — type a question in English or Korean and get a retrieval-grounded digest where every line links to its source
- **Modern UI**: Beautiful, responsive design with dark/light mode
- **Real-time Updates**: Auto-refresh with manual refresh option
- **Smart Filtering**: AI-powered content categorization
- **Session Caching**: 30-minute in-memory cache to limit repeat fetches
- **Cross-platform**: Works on Windows, macOS, and Linux

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd AINewsCurator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Open in browser**
   Navigate to `http://localhost:3000`

### Desktop App

To run as a desktop application:

```bash
# Development mode
npm run electron-dev

# Build for production
npm run build
npm run electron-pack
```

## Usage

### Language Selection
- Use the language dropdown in the header to switch between English and Korean
- The app will automatically fetch news from appropriate sources for each language

### Features
- **Dark/Light Mode**: Toggle theme using the moon/sun icon
- **Refresh**: Click the refresh button to get latest news
- **News Cards**: Click "Read More" to open full articles
- **AI Summary**: View AI-generated summaries of top stories

### News Sources

News is fetched from public RSS feeds — no API key required. Because browsers
cannot read most feeds directly (no CORS headers), requests go through
[rss2json](https://rss2json.com) first, falling back to the allorigins CORS
proxy and then a direct request.

#### English Sources (business sections)
- BBC Business
- The Guardian Business
- CNBC Business

#### Korean Sources (경제 sections, Korean-language)
- 연합뉴스 경제
- 한국경제
- 매일경제

If every fetch fails, the app shows a placeholder article explaining the
failure instead of an empty page.

## Technical Details

### Architecture
- **Frontend**: React 18 with Tailwind CSS
- **Desktop**: Electron for cross-platform desktop app
- **News APIs**: Free tier APIs with fallback mechanisms
- **Caching**: 30-minute cache for performance

### News Filtering
The app uses intelligent filtering to:
- Show only news from the last 24 hours
- Exclude political and sports content using keyword filtering (English
  keywords match on word boundaries so e.g. "bill" doesn't hit "billion")
- Keep the feed economy-only by sourcing from business/economy section feeds

### AI Integration
**Semantic search / RAG (real, on-device):** the "Ask the News" panel embeds each
article (title + description) and your query with `Xenova/multilingual-e5-small`
running in the browser via [Transformers.js](https://huggingface.co/docs/transformers.js)
(ONNX/WASM, quantized ~112 MB, downloaded once and cached). Retrieval is
cosine similarity over an in-memory vector index (E5 `query:` / `passage:`
prefixes applied), and the digest is extractive and fully grounded — every line
cites its source article. No API key, no server; works in the web app and the
Electron build. See `src/services/embeddingService.js` and `src/services/ragService.js`.

**Headline summaries** remain simulated. Natural next step: feed the retrieved
articles to an LLM API (Claude, OpenAI) with a user-supplied key for generative,
cited answers on top of the same retrieval layer.

## Configuration

No API keys or environment variables are required — all sources are public
RSS feeds and the embedding model runs on-device.

### Customization
- Add or edit news sources in the `NEWS_SOURCES` map in `src/services/newsService.js`
- Update the political-keyword filter lists in the same file
- Adjust cache duration via `cacheTimeout` (default 30 minutes, in-memory)
- Customize UI in `src/components/`

## Building for Production

### Web App
```bash
npm run build
```

### Desktop App
```bash
npm run build
npm run electron-pack
```

The built app will be in the `dist` folder.

## Mobile Support

The web app is fully responsive and works on mobile devices. For native mobile apps, consider:
- React Native for cross-platform mobile
- Capacitor for web-to-mobile conversion
- PWA features for app-like experience

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
1. Check the documentation
2. Search existing issues
3. Create a new issue with detailed information

---

**Note**: This app relies on free public RSS feeds and free RSS-to-JSON/CORS services (rss2json, allorigins). For production use, consider running your own proxy or a small backend that fetches the feeds server-side. 