#!/bin/bash

echo "🚀 Family Tree App Deployment Script"
echo "====================================="

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git repository not found. Please initialize git first."
    exit 1
fi

# Check if changes are committed
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  You have uncommitted changes. Please commit them first:"
    git status --short
    echo ""
    echo "Run: git add . && git commit -m 'Your commit message'"
    exit 1
fi

echo "✅ All changes are committed"
echo ""

# Push to remote
echo "📤 Pushing to remote repository..."
git push origin main

if [ $? -eq 0 ]; then
    echo "✅ Successfully pushed to remote"
else
    echo "❌ Failed to push to remote"
    exit 1
fi

echo ""
echo "🎯 Next Steps:"
echo "==============="
echo ""
echo "1. Backend Deployment (Render):"
echo "   - Go to https://render.com"
echo "   - Create new Web Service"
echo "   - Connect your GitHub repository"
echo "   - Set environment variables from env.production"
echo "   - Deploy and note the URL"
echo ""
echo "2. Frontend Deployment (Vercel):"
echo "   - Go to https://vercel.com"
echo "   - Import your GitHub repository"
echo "   - Set REACT_APP_API_URL to your Render backend URL"
echo "   - Deploy"
echo ""
echo "3. Update Backend CORS:"
echo "   - Go back to Render"
echo "   - Update CORS_ORIGIN with your Vercel frontend URL"
echo "   - Redeploy"
echo ""
echo "📖 See DEPLOYMENT.md for detailed instructions"
echo ""
echo "�� Happy deploying!"
