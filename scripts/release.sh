#!/bin/bash

# AI News Curator Release Script
# Usage: ./scripts/release.sh [patch|minor|major]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_error "Not in a git repository"
    exit 1
fi

# Check if we have uncommitted changes
if ! git diff-index --quiet HEAD --; then
    print_warning "You have uncommitted changes. Please commit or stash them first."
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
print_status "Current version: $CURRENT_VERSION"

# Determine version bump type
BUMP_TYPE=${1:-patch}
if [[ ! "$BUMP_TYPE" =~ ^(patch|minor|major)$ ]]; then
    print_error "Invalid bump type. Use patch, minor, or major"
    exit 1
fi

print_status "Bumping version: $BUMP_TYPE"

# Bump version
NEW_VERSION=$(npm version $BUMP_TYPE --no-git-tag-version)
NEW_VERSION=${NEW_VERSION#v}

print_success "New version: $NEW_VERSION"

# Update package.json version
print_status "Updating package.json..."

# Create git tag
TAG_NAME="v$NEW_VERSION"
print_status "Creating git tag: $TAG_NAME"

git add package.json
git commit -m "chore: bump version to $NEW_VERSION"
git tag -a "$TAG_NAME" -m "Release $TAG_NAME"

# Push changes and tags
print_status "Pushing changes and tags..."
git push origin main
git push origin "$TAG_NAME"

print_success "Release $TAG_NAME has been created and pushed!"
print_status "GitHub Actions will now build and release the application."

# Show next steps
echo
print_status "Next steps:"
echo "1. GitHub Actions will automatically build and release the application"
echo "2. Check the Actions tab in your GitHub repository"
echo "3. The release will be available at: https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\([^/]*\/[^/]*\).*/\1/')/releases"
echo "4. Docker image will be available at: ghcr.io/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\([^/]*\/[^/]*\).*/\1/')"

# Optional: Show release notes template
echo
print_status "Release notes template:"
echo "## What's New in $TAG_NAME"
echo "- "
echo ""
echo "## Features"
echo "- ✅ Free AI integration"
echo "- ✅ 24-hour news filter"
echo "- ✅ No political content"
echo "- ✅ Korean & English support"
echo "- ✅ Multiple free sources"
echo "- ✅ Desktop & mobile ready"
echo ""
echo "## Installation"
echo "### Docker"
echo "\`\`\`bash"
echo "docker pull ghcr.io/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\([^/]*\/[^/]*\).*/\1/'):$NEW_VERSION"
echo "docker run -p 3000:80 ghcr.io/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\([^/]*\/[^/]*\).*/\1/'):$NEW_VERSION"
echo "\`\`\`"
echo ""
echo "### Desktop App"
echo "Download the appropriate file for your platform from the releases page." 