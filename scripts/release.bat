@echo off
setlocal enabledelayedexpansion

REM AI News Curator Release Script for Windows
REM Usage: scripts\release.bat [patch|minor|major]

set "BUMP_TYPE=%1"
if "%BUMP_TYPE%"=="" set "BUMP_TYPE=patch"

echo ========================================
echo AI News Curator - Release Script
echo ========================================
echo.

REM Check if we're in a git repository
git rev-parse --git-dir >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Not in a git repository
    exit /b 1
)

REM Check if we have uncommitted changes
git diff-index --quiet HEAD --
if %errorlevel% neq 0 (
    echo [WARNING] You have uncommitted changes. Please commit or stash them first.
    set /p "CONTINUE=Continue anyway? (y/N): "
    if /i not "!CONTINUE!"=="y" exit /b 1
)

REM Get current version
for /f "tokens=*" %%i in ('node -p "require('./package.json').version"') do set "CURRENT_VERSION=%%i"
echo [INFO] Current version: !CURRENT_VERSION!

REM Validate bump type
if not "!BUMP_TYPE!"=="patch" if not "!BUMP_TYPE!"=="minor" if not "!BUMP_TYPE!"=="major" (
    echo [ERROR] Invalid bump type. Use patch, minor, or major
    exit /b 1
)

echo [INFO] Bumping version: !BUMP_TYPE!

REM Bump version
for /f "tokens=*" %%i in ('npm version !BUMP_TYPE! --no-git-tag-version') do set "NEW_VERSION=%%i"
set "NEW_VERSION=!NEW_VERSION:v=!"

echo [SUCCESS] New version: !NEW_VERSION!

REM Update package.json version
echo [INFO] Updating package.json...

REM Create git tag
set "TAG_NAME=v!NEW_VERSION!"
echo [INFO] Creating git tag: !TAG_NAME!

git add package.json
git commit -m "chore: bump version to !NEW_VERSION!"
git tag -a "!TAG_NAME!" -m "Release !TAG_NAME!"

REM Push changes and tags
echo [INFO] Pushing changes and tags...
git push origin main
git push origin "!TAG_NAME!"

echo [SUCCESS] Release !TAG_NAME! has been created and pushed!
echo [INFO] GitHub Actions will now build and release the application.

REM Show next steps
echo.
echo [INFO] Next steps:
echo 1. GitHub Actions will automatically build and release the application
echo 2. Check the Actions tab in your GitHub repository
echo 3. The release will be available at: https://github.com/your-repo/releases
echo 4. Docker image will be available at: ghcr.io/your-repo

REM Show release notes template
echo.
echo [INFO] Release notes template:
echo ## What's New in !TAG_NAME!
echo - 
echo.
echo ## Features
echo - ✅ Free AI integration
echo - ✅ 24-hour news filter
echo - ✅ No political content
echo - ✅ Korean ^& English support
echo - ✅ Multiple free sources
echo - ✅ Desktop ^& mobile ready
echo.
echo ## Installation
echo ### Docker
echo ```bash
echo docker pull ghcr.io/your-repo:!NEW_VERSION!
echo docker run -p 3000:80 ghcr.io/your-repo:!NEW_VERSION!
echo ```
echo.
echo ### Desktop App
echo Download the appropriate file for your platform from the releases page.

pause 