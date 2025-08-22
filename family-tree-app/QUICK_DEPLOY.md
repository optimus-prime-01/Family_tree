# Quick Deployment Checklist

## 🚀 Backend (Render)

- [ ] Sign up at [render.com](https://render.com)
- [ ] Create new Web Service
- [ ] Connect GitHub repository
- [ ] Set environment variables:
  - `NODE_ENV`: `production`
  - `PORT`: `10000`
  - `MONGODB_URI`: Your MongoDB connection string
  - `JWT_SECRET`: Strong secret key
  - `CLOUDINARY_*`: Your Cloudinary credentials
- [ ] Deploy and note the URL

## 🌐 Frontend (Vercel)

- [ ] Sign up at [vercel.com](https://vercel.com)
- [ ] Import GitHub repository
- [ ] Set root directory: `family-tree-app/frontend`
- [ ] Set environment variable:
  - `REACT_APP_API_URL`: `https://your-backend-name.onrender.com/api`
- [ ] Deploy and note the URL

## 🔗 Connect Services

- [ ] Go back to Render backend
- [ ] Update `CORS_ORIGIN` with Vercel frontend URL
- [ ] Redeploy backend

## ✅ Test Deployment

- [ ] Test backend health: `/health` endpoint
- [ ] Test frontend: Register/login functionality
- [ ] Verify API calls work between services

## 📁 Files Created

- `vercel.json` - Vercel configuration
- `render.yaml` - Render configuration
- `DEPLOYMENT.md` - Detailed instructions
- `deploy.sh` - Deployment script
- `env.production` - Production environment template

## 🔧 Commands

```bash
# Make deployment script executable
chmod +x deploy.sh

# Run deployment script
./deploy.sh

# Or manually commit and push
git add .
git commit -m "Prepare for deployment"
git push origin main
```
