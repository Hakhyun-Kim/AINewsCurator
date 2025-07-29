# AI News Curator

A modern, AI-powered news curator that aggregates and filters news from multiple sources, focusing on non-political content from the last 24 hours. Available as both a web application and desktop app.

## Features

### ✅ Core Requirements Met
- **Free AI Integration**: Uses free news APIs and simulated AI summaries
- **24-Hour News Filter**: Only shows news from the last 24 hours
- **No Political Content**: Automatically filters out political news
- **Korean & English Support**: Supports both Korean and English newspapers
- **Multiple News Sources**: Aggregates from multiple free news APIs
- **Desktop & Mobile Ready**: Runs as desktop app or web application

### 🚀 Additional Features
- **Modern UI**: Beautiful, responsive design with dark/light mode
- **Real-time Updates**: Auto-refresh with manual refresh option
- **Smart Filtering**: AI-powered content categorization
- **Offline Capable**: Caches news for offline reading
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

#### English Sources
- NewsAPI (US headlines)
- GNews (Global headlines)

#### Korean Sources
- NewsAPI Korea
- GNews Korea

## Technical Details

### Architecture
- **Frontend**: React 18 with Tailwind CSS
- **Desktop**: Electron for cross-platform desktop app
- **News APIs**: Free tier APIs with fallback mechanisms
- **Caching**: 30-minute cache for performance

### News Filtering
The app uses intelligent filtering to:
- Show only news from the last 24 hours
- Exclude political content using keyword filtering
- Prioritize non-political categories (technology, science, health, etc.)

### AI Integration
Currently uses simulated AI summaries. In production, you can integrate:
- OpenAI API (free tier available)
- Hugging Face free models
- Local AI models

## Configuration

### Environment Variables
Create a `.env` file for API keys:

```env
REACT_APP_NEWS_API_KEY=your_newsapi_key
REACT_APP_GNEWS_TOKEN=your_gnews_token
```

### Customization
- Modify `src/services/newsService.js` to add more news sources
- Update filtering keywords in the same file
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

**Note**: This app uses demo API keys for free news sources. For production use, consider upgrading to paid tiers or implementing additional free news sources. 