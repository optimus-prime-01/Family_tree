# Family Tree Management Application

A comprehensive web application for managing family trees, genealogy research, and family history documentation.

## 🌟 Features

### ✅ **Implemented Features**
- **User Authentication & Authorization**
  - JWT-based authentication
  - User registration and login
  - Role-based access control (User/Admin)
  - Secure password hashing

- **Family Tree Management**
  - Create, edit, and delete family trees
  - Add, edit, and remove family members
  - Privacy settings (Public/Private/Restricted)
  - Member details with 20+ fields
  - Family tree visualization

- **Dashboard & Analytics**
  - User dashboard with family tree overview
  - Family tree statistics and member counts
  - Admin panel for user management
  - Comprehensive reporting system

- **Data Management**
  - MongoDB database with Mongoose ODM
  - Cloudinary integration for image storage
  - File upload handling (profile pictures, member photos)
  - Data export capabilities (PDF/CSV)

- **API & Backend**
  - RESTful API with Express.js
  - Comprehensive middleware (auth, validation)
  - Error handling and logging
  - CORS support for frontend integration

### 🚧 **Planned Features**
- Payment & Subscription integration
- Advanced tree visualization with D3.js
- Email verification system
- Tree linking and merging
- Advanced search and filtering
- Mobile app development

## 🛠️ Tech Stack

### **Frontend**
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Axios** for API communication

### **Backend**
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Cloudinary** for image storage
- **Multer** for file uploads

### **Development Tools**
- **Nodemon** for backend development
- **PostCSS** and **Autoprefixer**
- **ESLint** and **Prettier** (recommended)

## 📁 Project Structure

```
family-tree-app/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── LoginPage.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   └── FamilyTreeView.tsx
│   │   ├── services/        # API services
│   │   │   └── api.ts
│   │   ├── App.tsx          # Main app component
│   │   └── index.tsx        # Entry point
│   ├── package.json
│   ├── tailwind.config.js
│   └── postcss.config.js
│
├── backend/                  # Node.js backend application
│   ├── models/              # Mongoose models
│   │   ├── User.js
│   │   └── FamilyTree.js
│   ├── routes/              # API routes
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── familyTrees.js
│   │   ├── dashboard.js
│   │   └── upload.js
│   ├── middleware/          # Custom middleware
│   │   └── auth.js
│   ├── config/              # Configuration files
│   │   └── cloudinary.js
│   ├── seeders/             # Database seeders
│   │   └── sampleData.js
│   ├── server.js            # Main server file
│   ├── package.json
│   └── .env                 # Environment variables
│
└── README.md                # Project documentation
```

## 🚀 Quick Start

### **Prerequisites**
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### **1. Clone the Repository**
```bash
git clone <repository-url>
cd family-tree-app
```

### **2. Backend Setup**
```bash
cd backend
npm install

# Create environment file
cp env.example .env

# Update .env with your configuration
# MONGODB_URI=mongodb://localhost:27017/family-tree-app
# JWT_SECRET=your-secret-key
# CLOUDINARY_CLOUD_NAME=your-cloud-name
# CLOUDINARY_API_KEY=your-api-key
# CLOUDINARY_API_SECRET=your-api-secret

# Seed the database with sample data
npm run seed

# Start the backend server
npm run dev
```

### **3. Frontend Setup**
```bash
cd frontend
npm install

# Start the frontend development server
npm start
```

### **4. Access the Application**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5001
- **Sample Login**: john@example.com / password123

## 📊 Sample Data

The application comes with pre-populated sample data:

### **Sample Users**
- **John Doe** (john@example.com) - Regular user with family trees
- **Admin User** (admin@example.com) - Administrator account

### **Sample Family Trees**
1. **Johnson Family Tree** (Private) - 6 members
2. **Smith Heritage** (Public) - 2 members  
3. **Williams Ancestry** (Restricted) - 1 member
4. **Brown Family Legacy** (Private) - 1 member
5. **Davis Lineage** (Public) - 1 member
6. **Miller Roots** (Restricted) - 1 member

## 🔐 Authentication

### **JWT Token Flow**
1. User registers/logs in
2. Server validates credentials
3. JWT token generated and returned
4. Frontend stores token in localStorage
5. Token included in subsequent API requests

### **Protected Routes**
- All family tree operations require authentication
- Admin routes require admin role
- User can only access their own trees (unless public)

## 🌐 API Endpoints

### **Base URL**: `http://localhost:5001/api`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | User registration | No |
| POST | `/auth/login` | User login | No |
| GET | `/auth/me` | Get user profile | Yes |
| POST | `/auth/logout` | User logout | Yes |
| GET | `/family-trees` | Get user's trees | Yes |
| GET | `/family-trees/:id` | Get specific tree | Yes |
| POST | `/family-trees` | Create new tree | Yes |
| PUT | `/family-trees/:id` | Update tree | Yes |
| DELETE | `/family-trees/:id` | Delete tree | Yes |
| POST | `/family-trees/:id/members` | Add member | Yes |
| PUT | `/family-trees/:id/members/:memberId` | Update member | Yes |
| DELETE | `/family-trees/:id/members/:memberId` | Delete member | Yes |

## 🗄️ Database Schema

### **User Model**
- Basic info (name, email, password)
- Role-based access control
- Subscription management
- Profile picture support

### **FamilyTree Model**
- Tree metadata (name, description, privacy)
- Member management with subdocuments
- Privacy and access control
- Settings and configuration

### **FamilyMember Model**
- Personal information (name, dates, gender)
- Contact details and location
- Professional information
- Biography and notes

## 🔧 Configuration

### **Environment Variables**
```bash
# Server Configuration
PORT=5001
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/family-tree-app

# Authentication
JWT_SECRET=your-super-secret-jwt-key

# Cloudinary (Image Storage)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Optional: SMTP for email verification
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## 📱 Frontend Features

### **Responsive Design**
- Mobile-first approach
- Tailwind CSS for consistent styling
- Responsive navigation and layouts

### **User Experience**
- Intuitive dashboard interface
- Interactive family tree visualization
- Smooth navigation between views
- Loading states and error handling

### **Component Architecture**
- Modular React components
- Reusable UI components
- State management with React hooks
- API integration services

## 🚀 Deployment

### **Backend Deployment**
1. Set production environment variables
2. Build and deploy to your hosting service
3. Configure MongoDB connection
4. Set up Cloudinary account

### **Frontend Deployment**
1. Build the production bundle
2. Deploy to static hosting (Netlify, Vercel, etc.)
3. Update API base URL for production

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the API documentation
- Review the sample data structure

## 🔮 Future Enhancements

- **Advanced Visualization**: Interactive family tree charts
- **DNA Integration**: Connect with DNA testing services
- **Collaboration**: Multi-user tree editing
- **Mobile App**: React Native mobile application
- **AI Features**: Smart relationship suggestions
- **Internationalization**: Multi-language support 