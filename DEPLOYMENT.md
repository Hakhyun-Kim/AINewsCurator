# AI News Curator - Deployment Guide

This document explains how to deploy the AI News Curator application using GitHub Actions, Docker, and various deployment options.

## 🚀 Quick Start

### 1. Create a Release

```bash
# Unix/Linux/macOS
npm run release patch    # v1.0.1
npm run release minor    # v1.1.0
npm run release major    # v2.0.0

# Windows
npm run release:win patch
```

### 2. Docker Deployment

```bash
# Build and run locally
npm run docker:build
npm run docker:run

# Or use docker-compose
npm run docker:prod
```

## 📋 GitHub Actions Workflows

### Release Workflow (`.github/workflows/release.yml`)

**Triggers:**
- Push tags starting with `v*` (e.g., `v1.0.0`)
- Manual workflow dispatch with version input

**Jobs:**
1. **Test** - Builds and tests the application
2. **Build Desktop** - Creates desktop apps for Windows, macOS, Linux
3. **Build Docker** - Builds and pushes Docker image to GitHub Container Registry
4. **Release** - Creates GitHub release with all artifacts
5. **Deploy Pages** - Deploys to GitHub Pages (main branch only)

### CI Workflow (`.github/workflows/ci.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` branch

**Jobs:**
1. **Lint and Test** - Code quality checks
2. **Security Audit** - npm security audit
3. **Docker Test** - Docker build verification
4. **Coverage** - Code coverage reporting (if tests exist)

## 🐳 Docker Deployment

### Production Image

```bash
# Pull the latest image
docker pull ghcr.io/your-username/ainewscurator:latest

# Run the application
docker run -p 3000:80 ghcr.io/your-username/ainewscurator:latest

# With custom environment
docker run -p 3000:80 \
  -e NODE_ENV=production \
  ghcr.io/your-username/ainewscurator:latest
```

### Development with Docker Compose

```bash
# Start development environment
npm run docker:dev

# Start production environment
npm run docker:prod

# Stop all services
npm run docker:stop
```

### Docker Compose Services

- **ai-news-curator**: Production web application
- **ai-news-curator-dev**: Development server with hot reload
- **nginx-proxy**: Reverse proxy (optional)

## 🌐 Deployment Options

### 1. GitHub Pages

Automatically deployed from the `main` branch.

**URL:** `https://your-username.github.io/ainewscurator`

### 2. Docker Registry

Images are automatically pushed to GitHub Container Registry.

**Registry:** `ghcr.io/your-username/ainewscurator`

### 3. Desktop Applications

Built for multiple platforms:
- **Windows**: `.exe` installer
- **macOS**: `.dmg` package
- **Linux**: `.AppImage`, `.deb`, `.rpm`

## 🔧 Configuration

### Environment Variables

```bash
# Production
NODE_ENV=production
REACT_APP_NEWS_API_KEY=your_api_key
REACT_APP_GNEWS_TOKEN=your_token

# Development
NODE_ENV=development
CHOKIDAR_USEPOLLING=true
```

### Docker Configuration

The application uses a multi-stage Docker build:

1. **Builder Stage**: Node.js environment for building
2. **Production Stage**: Nginx server for serving static files
3. **Development Stage**: Node.js development server

### Nginx Configuration

Optimized for React SPA with:
- Gzip compression
- Security headers
- Static asset caching
- Health check endpoint
- SPA routing support

## 📊 Monitoring

### Health Checks

```bash
# Docker health check
curl http://localhost:3000/health

# Application status
curl http://localhost:3000/
```

### Logs

```bash
# Docker logs
docker logs ai-news-curator

# Nginx logs
docker exec ai-news-curator tail -f /var/log/nginx/access.log
```

## 🔒 Security

### Security Headers

- `X-Frame-Options`: SAMEORIGIN
- `X-XSS-Protection`: 1; mode=block
- `X-Content-Type-Options`: nosniff
- `Referrer-Policy`: no-referrer-when-downgrade
- `Content-Security-Policy`: Restrictive CSP

### Container Security

- Non-root user in containers
- Minimal base images (alpine)
- Multi-stage builds to reduce attack surface
- Regular security audits

## 🚀 Release Process

### 1. Version Bumping

```bash
# Patch release (bug fixes)
npm run release patch

# Minor release (new features)
npm run release minor

# Major release (breaking changes)
npm run release major
```

### 2. Automated Release

1. Script creates git tag
2. Pushes to GitHub
3. GitHub Actions triggers
4. Builds all platforms
5. Creates GitHub release
6. Deploys to GitHub Pages

### 3. Release Artifacts

- Desktop applications for all platforms
- Docker image
- Source code archive
- Release notes

## 🔄 Continuous Integration

### Pre-commit Checks

- Code linting
- Unit tests
- Security audit
- Build verification
- Docker build test

### Quality Gates

- All tests must pass
- No security vulnerabilities
- Build must succeed
- Docker image must be valid

## 📈 Performance

### Optimization

- **Bundle Size**: < 2MB (gzipped)
- **Load Time**: < 2 seconds
- **Cache Strategy**: 30-minute news cache
- **CDN**: GitHub Pages CDN

### Monitoring

- GitHub Actions metrics
- Docker container metrics
- Application performance
- Error tracking

## 🛠️ Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Clear cache
   npm run build -- --reset-cache
   
   # Check dependencies
   npm audit fix
   ```

2. **Docker Issues**
   ```bash
   # Rebuild without cache
   docker build --no-cache -t ai-news-curator .
   
   # Check logs
   docker logs ai-news-curator
   ```

3. **Release Issues**
   ```bash
   # Check git status
   git status
   
   # Verify tags
   git tag -l
   ```

### Support

- Check GitHub Actions logs
- Review Docker build logs
- Verify environment variables
- Test locally before release

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Documentation](https://docs.docker.com/)
- [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [GitHub Pages](https://pages.github.com/)

---

**Note**: Replace `your-username` with your actual GitHub username in all examples. 