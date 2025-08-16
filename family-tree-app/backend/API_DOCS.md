# Family Tree API Documentation

## Base URL
```
http://localhost:5001/api
```

## Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### Authentication

#### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "jwt-token-here",
  "user": {
    "_id": "user-id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

#### POST /auth/login
Login with existing credentials.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "jwt-token-here",
  "user": {
    "_id": "user-id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

#### GET /auth/me
Get current user profile (protected).

**Response:**
```json
{
  "user": {
    "_id": "user-id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "isEmailVerified": true,
    "subscription": {
      "plan": "premium",
      "status": "active"
    }
  }
}
```

#### POST /auth/logout
Logout user (protected).

### Family Trees

#### GET /family-trees
Get all family trees for the authenticated user (protected).

**Response:**
```json
[
  {
    "_id": "tree-id",
    "name": "Johnson Family Tree",
    "privacy": "private",
    "description": "The Johnson family heritage",
    "memberCount": 6,
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "owner": {
      "_id": "user-id",
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
]
```

#### GET /family-trees/:id
Get a specific family tree by ID (protected).

**Response:**
```json
{
  "_id": "tree-id",
  "name": "Johnson Family Tree",
  "privacy": "private",
  "description": "The Johnson family heritage",
  "owner": {
    "_id": "user-id",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "members": [
    {
      "_id": "member-id",
      "name": "Robert Johnson",
      "dateOfBirth": "1945-03-15T00:00:00.000Z",
      "dateOfDeath": "2020-11-20T00:00:00.000Z",
      "gender": "male",
      "relationship": "Grandfather",
      "birthPlace": "Chicago, IL",
      "occupation": "Engineer",
      "education": "Bachelor's Degree",
      "currentLocation": "Chicago, IL",
      "contactInfo": {
        "email": "robert.johnson@email.com",
        "phone": "+1 555-0101",
        "address": "123 Main St, Chicago, IL 60601"
      },
      "bio": "Retired engineer who loved building things and spending time with family.",
      "isAlive": false
    }
  ],
  "memberCount": 6,
  "settings": {
    "allowMemberEditing": false,
    "allowMemberAddition": true,
    "maxMembers": 1000
  },
  "tags": [],
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### POST /family-trees
Create a new family tree (protected).

**Request Body:**
```json
{
  "name": "New Family Tree",
  "description": "Description of the family tree",
  "privacy": "private"
}
```

#### PUT /family-trees/:id
Update a family tree (protected, owner only).

**Request Body:**
```json
{
  "name": "Updated Family Tree Name",
  "description": "Updated description",
  "privacy": "public"
}
```

#### DELETE /family-trees/:id
Delete a family tree (protected, owner only).

### Family Tree Members

#### POST /family-trees/:id/members
Add a new member to the family tree (protected, owner only).

**Request Body:**
```json
{
  "name": "New Member",
  "dateOfBirth": "1990-01-01",
  "gender": "male",
  "relationship": "Son",
  "birthPlace": "New York, NY",
  "occupation": "Engineer",
  "education": "Bachelor's Degree",
  "currentLocation": "New York, NY",
  "contactInfo": {
    "email": "member@email.com",
    "phone": "+1 555-0123",
    "address": "123 Main St, New York, NY 10001"
  },
  "bio": "Member bio information"
}
```

#### PUT /family-trees/:id/members/:memberId
Update a member in the family tree (protected, owner only).

**Request Body:**
```json
{
  "name": "Updated Member Name",
  "occupation": "Updated Occupation"
}
```

#### DELETE /family-trees/:id/members/:memberId
Delete a member from the family tree (protected, owner only).

### Public Endpoints

#### GET /family-trees/public/list
Get list of public family trees (no authentication required).

**Response:**
```json
[
  {
    "_id": "tree-id",
    "name": "Smith Heritage",
    "description": "The Smith family legacy and history",
    "memberCount": 2,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "owner": {
      "_id": "user-id",
      "name": "John Doe"
    }
  }
]
```

### Users (Admin Only)

#### GET /users
Get all users (protected, admin only).

#### GET /users/:id
Get user by ID (protected, admin only).

#### PUT /users/profile
Update current user profile (protected).

#### PATCH /users/:id/role
Change user role (protected, admin only).

#### DELETE /users/:id
Delete user (protected, admin only).

### Dashboard

#### GET /dashboard/stats
Get user dashboard statistics (protected).

#### GET /dashboard/analytics/trees/:treeId
Get analytics for a specific tree (protected).

#### POST /dashboard/reports/generate
Generate a report (protected).

#### GET /dashboard/admin/stats
Get admin dashboard statistics (protected, admin only).

#### GET /dashboard/admin/user-activity
Get user activity report (protected, admin only).

### File Uploads

#### POST /upload/profile-picture
Upload profile picture (protected).

#### POST /upload/member-photo
Upload member photo (protected).

#### DELETE /upload/:publicId
Delete uploaded image (protected).

#### GET /upload/info/:publicId
Get image information (protected).

## Data Models

### User
```json
{
  "_id": "ObjectId",
  "name": "String",
  "email": "String",
  "password": "String (hashed)",
  "role": "String (user|admin)",
  "isEmailVerified": "Boolean",
  "subscription": {
    "plan": "String",
    "status": "String",
    "startDate": "Date",
    "endDate": "Date"
  },
  "profilePicture": "String (Cloudinary URL)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### FamilyTree
```json
{
  "_id": "ObjectId",
  "name": "String",
  "owner": "ObjectId (ref: User)",
  "privacy": "String (public|private|restricted)",
  "description": "String",
  "members": ["Array of FamilyMember"],
  "memberCount": "Number",
  "settings": {
    "allowMemberEditing": "Boolean",
    "allowMemberAddition": "Boolean",
    "maxMembers": "Number"
  },
  "tags": ["Array of String"],
  "isActive": "Boolean",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### FamilyMember
```json
{
  "_id": "ObjectId",
  "name": "String",
  "dateOfBirth": "Date",
  "dateOfDeath": "Date",
  "gender": "String (male|female|other|prefer-not-to-say)",
  "relationship": "String",
  "birthPlace": "String",
  "occupation": "String",
  "education": "String",
  "currentLocation": "String",
  "contactInfo": {
    "email": "String",
    "phone": "String",
    "address": "String"
  },
  "bio": "String",
  "profilePicture": "String",
  "isAlive": "Boolean",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

## Error Responses

### Standard Error Format
```json
{
  "message": "Error description"
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting
- Authentication endpoints: 5 requests per minute
- Other endpoints: 100 requests per minute

## File Upload Limits
- Profile pictures: 5MB max
- Member photos: 10MB max
- Supported formats: JPG, PNG, GIF

## Pagination
For endpoints that return lists, use query parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

## Search
Some endpoints support text search using the `search` query parameter.

## Security Features
- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Input validation and sanitization
- CORS protection
- Environment variable configuration 