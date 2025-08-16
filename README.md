# 🌳 Family Tree Management Application

A comprehensive web application for managing and visualizing family trees with advanced features like member management, privacy controls, and data export capabilities.

## ✨ Features

### 🔐 Authentication & User Management
- User registration and login with JWT
- Profile management with image uploads
- Role-based access control (User/Admin)

### 🌳 Family Tree Management
- Create and manage multiple family trees
- Add, edit, and delete family members
- Hierarchical visualization with blood relations
- Privacy settings (Public/Private)
- Link multiple trees together

### 👥 Member Management
- Comprehensive member profiles
- Relationship mapping
- Contact information
- Professional details
- Profile pictures

### 📊 Dashboard & Analytics
- User dashboard with tree overview
- Admin panel for system management
- Data analytics and reporting
- Export to PDF and CSV

### 🎨 Modern UI/UX
- Responsive design with Tailwind CSS
- Interactive family tree visualization
- Zoom and navigation controls
- Professional color scheme

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Axios** for API calls
- **jsPDF** for PDF export

### Backend
- **Node.js** with Express
- **MongoDB** with Mongoose
- **JWT** for authentication
- **Cloudinary** for image storage
- **Multer** for file uploads

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB
- Cloudinary account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/optimus-prime-01/Family_tree.git
   cd Family_tree
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   cd family-tree-app/backend
   npm install
   
   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Backend (.env)
   cd ../backend
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Start the application**
   ```bash
   # Start backend (Port 5001)
   cd backend
   npm start
   
   # Start frontend (Port 3000)
   cd frontend
   npm start
   ```

## 📁 Project Structure

```
family-tree-app/
├── backend/                 # Node.js backend
│   ├── config/             # Configuration files
│   ├── middleware/          # Authentication middleware
│   ├── models/              # MongoDB schemas
│   ├── routes/              # API endpoints
│   ├── seeders/             # Sample data
│   └── server.js            # Main server file
├── frontend/                # React frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── services/        # API services
│   │   └── App.tsx          # Main app component
│   └── package.json
└── README.md
```

## 🔧 Configuration

### Backend Environment Variables
```env
PORT=5001
MONGODB_URI=mongodb://localhost:27017/family-tree-app
JWT_SECRET=your-secret-key
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Frontend Configuration
- API base URL: `http://localhost:5001/api`
- Default port: 3000

## 📱 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/update-profile` - Update profile

### Family Trees
- `GET /api/family-trees` - Get user's trees
- `POST /api/family-trees` - Create new tree
- `PUT /api/family-trees/:id` - Update tree
- `DELETE /api/family-trees/:id` - Delete tree

### Members
- `POST /api/family-trees/:id/members` - Add member
- `PUT /api/family-trees/:id/members/:memberId` - Update member
- `DELETE /api/family-trees/:id/members/:memberId` - Delete member

### Profile Management
- `POST /api/profile/upload-image` - Upload profile image
- `DELETE /api/profile/delete-image` - Delete profile image
- `GET /api/profile/image` - Get profile image

## 🎯 Key Features Explained

### Family Tree Visualization
- **Hierarchical Layout**: Displays family members in proper blood relation order
- **Generation-based Grouping**: Great Grandparents → Grandparents → Parents → Children → Grandchildren → Great Grandchildren
- **Interactive Controls**: Zoom in/out, fullscreen, navigation
- **Color Coding**: Different colors for each generation level

### Privacy & Security
- **JWT Authentication**: Secure token-based authentication
- **Role-based Access**: Different permissions for users and admins
- **Tree Privacy**: Public/private tree settings
- **Data Encryption**: Secure password hashing

### Data Export
- **PDF Export**: Generate comprehensive family tree reports
- **CSV Export**: Export member data for external analysis
- **Professional Formatting**: Clean, organized output

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with modern web technologies
- Designed for family history enthusiasts
- Professional-grade application architecture

## 📞 Support

For support and questions:
- Create an issue in this repository
- Contact the development team

---

**Made with ❤️ for families everywhere** 