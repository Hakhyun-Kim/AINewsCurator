#!/bin/bash

echo "========================================"
echo "AI News Curator - Installation Script"
echo "========================================"
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org/"
    echo "Then run this script again."
    exit 1
fi

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "ERROR: npm is not available!"
    exit 1
fi

echo "Node.js found. Checking npm..."
echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"
echo

echo "Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install dependencies!"
    exit 1
fi

echo
echo "========================================"
echo "Installation completed successfully!"
echo "========================================"
echo
echo "To start the application:"
echo "  1. Run: npm start"
echo "  2. Open: http://localhost:3000"
echo
echo "For desktop app:"
echo "  1. Run: npm run electron-dev"
echo 