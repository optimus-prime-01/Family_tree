# Deployment Guide

This guide will help you deploy your Family Tree application with the frontend on Vercel and backend on Render.

## Prerequisites

1. **GitHub Account**: Your code should be in a GitHub repository
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
3. **Render Account**: Sign up at [render.com](https://render.com)
4. **MongoDB Atlas**: Your database should be accessible from external services

## Backend Deployment on Render

### Step 1: Prepare Backend for Render

1. **Update Environment Variables**:
   - Copy `env.production` to `.env` in your backend directory
   - Update the following values:
     - `MONGODB_URI`: Your MongoDB Atlas connection string
     - `JWT_SECRET`: A strong, unique secret key
     - `CLOUDINARY_*`: Your Cloudinary credentials
     - `CORS_ORIGIN`: Will be updated after frontend deployment

2. **Commit and Push Changes**:
   ```bash
   cd backend
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```

### Step 2: Deploy on Render

1. **Connect GitHub Repository**:
   - Go to [render.com](https://render.com) and sign in
   - Click "New +" and select "Web Service"
   - Connect your GitHub account and select your repository

2. **Configure Service**:
   - **Name**: `family-tree-backend` (or your preferred name)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (or choose based on your needs)

3. **Set Environment Variables**:
   - `NODE_ENV`: `production`
   - `PORT`: `10000`
   - `MONGODB_URI`: Your MongoDB connection string
   - `JWT_SECRET`: Your JWT secret
   - `CLOUDINARY_CLOUD_NAME`: Your Cloudinary cloud name
   - `CLOUDINARY_API_KEY`: Your Cloudinary API key
   - `CLOUDINARY_API_SECRET`: Your Cloudinary API secret
   - `CORS_ORIGIN`: Leave empty for now (will update after frontend deployment)

4. **Deploy**:
   - Click "Create Web Service"
   - Render will automatically build and deploy your backend
   - Note the generated URL (e.g., `https://your-backend-name.onrender.com`)

## Frontend Deployment on Vercel

### Step 1: Prepare Frontend for Vercel

1. **Update API Configuration**:
   - The frontend is already configured to use environment variables
   - We'll set the production API URL in Vercel

2. **Commit and Push Changes**:
   ```bash
   cd frontend
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

### Step 2: Deploy on Vercel

1. **Connect GitHub Repository**:
   - Go to [vercel.com](https://vercel.com) and sign in
   - Click "New Project"
   - Import your GitHub repository

2. **Configure Project**:
   - **Framework Preset**: Create React App
   - **Root Directory**: `family-tree-app/frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
   - **Install Command**: `npm install`

3. **Set Environment Variables**:
   - `REACT_APP_API_URL`: `https://your-backend-name.onrender.com/api`
   - Replace `your-backend-name` with your actual Render backend name

4. **Deploy**:
   - Click "Deploy"
   - Vercel will build and deploy your frontend
   - Note the generated URL (e.g., `https://your-project.vercel.app`)

### Step 3: Update Backend CORS

1. **Go back to Render**:
   - Navigate to your backend service
   - Go to "Environment" tab
   - Update `CORS_ORIGIN` with your Vercel frontend URL
   - Redeploy the service

## Post-Deployment

### Testing Your Deployment

1. **Test Backend**:
   - Visit `https://your-backend-name.onrender.com/health`
   - Should return a health status

2. **Test Frontend**:
   - Visit your Vercel URL
   - Try to register/login
   - Check if API calls are working

### Monitoring

1. **Render Dashboard**: Monitor backend performance and logs
2. **Vercel Dashboard**: Monitor frontend performance and analytics
3. **MongoDB Atlas**: Monitor database performance

## Troubleshooting

### Common Issues

1. **CORS Errors**:
   - Ensure `CORS_ORIGIN` is set correctly in Render
   - Check that the frontend URL matches exactly

2. **Environment Variables**:
   - Verify all environment variables are set in Render
   - Check that sensitive data is not exposed in logs

3. **Build Failures**:
   - Check build logs in both Vercel and Render
   - Ensure all dependencies are properly listed in package.json

4. **Database Connection**:
   - Verify MongoDB Atlas network access allows Render's IPs
   - Check connection string format

### Support

- **Vercel**: [vercel.com/docs](https://vercel.com/docs)
- **Render**: [render.com/docs](https://render.com/docs)
- **MongoDB Atlas**: [docs.atlas.mongodb.com](https://docs.atlas.mongodb.com)

## Security Notes

1. **Environment Variables**: Never commit sensitive data to Git
2. **JWT Secrets**: Use strong, unique secrets in production
3. **CORS**: Restrict CORS origins to only your frontend domain
4. **Database**: Ensure MongoDB Atlas has proper security settings
5. **HTTPS**: Both Vercel and Render provide HTTPS by default
