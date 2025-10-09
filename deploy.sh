#!/bin/bash

# GIMP-S Deployment Script for Netlify
# This script automates the deployment process

echo "🦅 GIMP-S Deployment Script"
echo "=============================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js version: $(node -v)"
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm version: $(npm -v)"
echo ""

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
    echo "✅ Dependencies installed"
    echo ""
fi

# Build the project
echo "🔨 Building the project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi

echo "✅ Build successful!"
echo ""

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "⚠️  Netlify CLI is not installed."
    echo "📥 Installing Netlify CLI..."
    npm install -g netlify-cli
    
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install Netlify CLI"
        echo "Please install manually: npm install -g netlify-cli"
        exit 1
    fi
fi

echo "✅ Netlify CLI is ready"
echo ""

# Check if user is logged in
echo "🔐 Checking Netlify authentication..."
netlify status &> /dev/null

if [ $? -ne 0 ]; then
    echo "⚠️  Not logged in to Netlify"
    echo "🔓 Opening login page..."
    netlify login
    
    if [ $? -ne 0 ]; then
        echo "❌ Login failed"
        exit 1
    fi
fi

echo "✅ Authenticated with Netlify"
echo ""

# Deploy
echo "🚀 Deploying to Netlify..."
netlify deploy --prod --dir=dist

if [ $? -ne 0 ]; then
    echo "❌ Deployment failed"
    exit 1
fi

echo ""
echo "=============================="
echo "✅ Deployment successful! 🎉"
echo "=============================="
echo ""
echo "📝 Next steps:"
echo "1. Set environment variables in Netlify dashboard:"
echo "   - VITE_SUPABASE_URL"
echo "   - VITE_SUPABASE_ANON_KEY"
echo "2. Visit your site and test the functionality"
echo "3. Configure custom domain (optional)"
echo ""
echo "📖 For detailed instructions, see DEPLOYMENT.md"
echo ""

