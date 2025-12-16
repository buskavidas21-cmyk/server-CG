# CleanGuard QC - API Documentation

## 📋 Overview

CleanGuard QC is a cloud-based inspection and quality control API for janitorial companies, building maintenance teams, and facility managers.

**Base URL:** `http://localhost:5000/api`

---

## 🔐 Authentication

All protected endpoints require a JWT token in the Authorization header.

### Authentication Header Format
```
Authorization: Bearer <your_jwt_token>
```

### Token Expiration
- Tokens expire after **30 days**
- Use the refresh token endpoint to get a new token

---

## 📚 Table of Contents

1. [Authentication Endpoints](#authentication-endpoints)
2. [User Endpoints](#user-endpoints)
3. [Location Endpoints](#location-endpoints)
4. [Template Endpoints](#template-endpoints)
5. [Inspection Endpoints](#inspection-endpoints)
6. [Ticket Endpoints](#ticket-endpoints)
7. [Upload Endpoints](#upload-endpoints)
8. [Report Endpoints](#report-endpoints)
9. [Data Models](#data-models)
10. [Error Handling](#error-handling)

---

## 🔑 Authentication Endpoints

### 1. Login
**POST** `/api/users/login`

Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "admin@cleanguard.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Admin User",
  "email": "admin@cleanguard.com",
  "role": "admin",
  "assignedLocations": [],
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Response (401):**
```json
{
  "message": "Invalid email or password"
}
```

---

### 2. Register User
**POST** `/api/users`

Register a new user (public endpoint).

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "supervisor"
}
```

**Response (201 Created):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "supervisor",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Response (400):**
```json
{
  "message": "User already exists"
}
```

---

### 3. Logout
**POST** `/api/users/logout`

**Access:** Private

**Response (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

---

### 4. Refresh Token
**POST** `/api/users/refresh`

Get a new JWT token using existing token.

**Request Body:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Admin User",
  "email": "admin@cleanguard.com",
  "role": "admin",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 👥 User Endpoints

### 1. Get All Users
**GET** `/api/users`

**Access:** Private

**Response (200 OK):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Admin User",
    "email": "admin@cleanguard.com",
    "role": "admin",
    "assignedLocations": [],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### 2. Update User
**PUT** `/api/users/:id`

**Access:** Private, Admin Only

**Request Body:**
```json
{
  "name": "Updated Name",
  "email": "updated@example.com",
  "role": "supervisor",
  "assignedLocations": ["507f1f77bcf86cd799439012"]
}
```

**Response (200 OK):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Updated Name",
  "email": "updated@example.com",
  "role": "supervisor"
}
```

---

### 3. Delete User
**DELETE** `/api/users/:id`

**Access:** Private, Admin Only

**Response (200 OK):**
```json
{
  "message": "User removed"
}
```

---

## 📍 Location Endpoints

### 1. Get All Locations
**GET** `/api/locations`

**Access:** Private

**Query Parameters:**
- `type` (optional): Filter by location type
- `parent` (optional): Filter by parent location ID

**Response (200 OK):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "name": "ABC Plaza",
    "type": "client",
    "parent": null,
    "address": "123 Main St, Downtown",
    "clientContact": "contact@abcplaza.com",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

**Location Types:**
- `client`, `building`, `floor`, `area`, `office`, `retail`, `warehouse`, `restroom`, `healthcare`

---

### 2. Create Location
**POST** `/api/locations`

**Access:** Private, Admin or Sub-Admin

**Request Body:**
```json
{
  "name": "ABC Plaza - 5th Floor",
  "type": "floor",
  "parent": "507f1f77bcf86cd799439011",
  "address": "123 Main St, Floor 5",
  "clientContact": "contact@example.com"
}
```

**Response (201 Created):**
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "name": "ABC Plaza - 5th Floor",
  "type": "floor",
  "parent": "507f1f77bcf86cd799439011",
  "address": "123 Main St, Floor 5",
  "clientContact": "contact@example.com",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

### 3. Get Location by ID
**GET** `/api/locations/:id`

**Access:** Private

**Response (200 OK):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "ABC Plaza",
  "type": "client",
  "parent": null,
  "address": "123 Main St, Downtown",
  "clientContact": "contact@abcplaza.com",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

### 4. Update Location
**PUT** `/api/locations/:id`

**Access:** Private, Admin or Sub-Admin

**Request Body:**
```json
{
  "name": "Updated Location Name",
  "address": "Updated Address"
}
```

**Response (200 OK):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Updated Location Name",
  "type": "client",
  "address": "Updated Address",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

### 5. Delete Location
**DELETE** `/api/locations/:id`

**Access:** Private, Admin or Sub-Admin

**Response (200 OK):**
```json
{
  "message": "Location removed"
}
```

---

## 📝 Template Endpoints

### 1. Get All Templates
**GET** `/api/templates`

**Access:** Private

**Response (200 OK):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "name": "General Office Cleaning",
    "description": "Standard office cleaning checklist",
    "sections": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Reception & Lobby",
        "items": [
          {
            "_id": "507f1f77bcf86cd799439013",
            "name": "Floors vacuumed and mopped",
            "type": "pass_fail",
            "weight": 10
          }
        ]
      }
    ],
    "createdBy": "507f1f77bcf86cd799439014",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

**Item Types:**
- `pass_fail`: Boolean pass/fail
- `rating_1_5`: Numeric rating 1-5
- `yes_no`: Yes/No answer

---

### 2. Get Template by ID
**GET** `/api/templates/:id`

**Access:** Private

**Response:** Same as Get All Templates (single object)

---

### 3. Create Template
**POST** `/api/templates`

**Access:** Private, Admin or Sub-Admin

**Request Body:**
```json
{
  "name": "Restroom Deep Clean",
  "description": "Thorough restroom cleaning checklist",
  "sections": [
    {
      "name": "Fixtures",
      "items": [
        {
          "name": "Toilets scrubbed and disinfected",
          "type": "rating_1_5",
          "weight": 15
        },
        {
          "name": "Sinks cleaned",
          "type": "pass_fail",
          "weight": 10
        }
      ]
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Restroom Deep Clean",
  "description": "Thorough restroom cleaning checklist",
  "sections": [...],
  "createdBy": "507f1f77bcf86cd799439014",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

---

### 4. Update Template
**PUT** `/api/templates/:id`

**Access:** Private, Admin or Sub-Admin

**Request Body:** Same as Create Template

**Response (200 OK):** Updated template object

---

### 5. Delete Template
**DELETE** `/api/templates/:id`

**Access:** Private, Admin or Sub-Admin

**Response (200 OK):**
```json
{
  "message": "Template removed"
}
```

---

## 🔍 Inspection Endpoints

### 1. Get All Inspections
**GET** `/api/inspections`

**Access:** Private

**Role-based Filtering:**
- **Admin/Sub-Admin:** See all inspections
- **Supervisor:** See only their own inspections
- **Client:** See only inspections for their assigned locations

**Query Parameters:**
- `location` (optional): Filter by location ID
- `inspector` (optional): Filter by inspector ID
- `status` (optional): Filter by status (`in_progress`, `completed`, `submitted`)
- `startDate` (optional): Filter by start date
- `endDate` (optional): Filter by end date

**Response (200 OK):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "template": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "General Office Cleaning"
    },
    "location": {
      "_id": "507f1f77bcf86cd799439013",
      "name": "ABC Plaza - 5th Floor"
    },
    "inspector": {
      "_id": "507f1f77bcf86cd799439014",
      "name": "John Supervisor"
    },
    "sections": [
      {
        "sectionId": "507f1f77bcf86cd799439015",
        "name": "Reception & Lobby",
        "sectionScore": 95,
        "items": [
          {
            "itemId": "507f1f77bcf86cd799439016",
            "name": "Floors vacuumed and mopped",
            "score": null,
            "status": "pass",
            "comment": "",
            "photos": []
          }
        ]
      }
    ],
    "totalScore": 92,
    "appaScore": 4.6,
    "status": "completed",
    "summaryComment": "Excellent work!",
    "scheduledDate": null,
    "date": "2024-01-01T00:00:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

**Status Values:**
- `in_progress`: Inspection started but not completed
- `completed`: Inspection finished but not submitted
- `submitted`: Inspection submitted and finalized

---

### 2. Get Inspection by ID
**GET** `/api/inspections/:id`

**Access:** Private

**Response (200 OK):** Single inspection object (same structure as above)

---

### 3. Create Inspection
**POST** `/api/inspections`

**Access:** Private, Admin, Sub-Admin, or Supervisor

**Request Body:**
```json
{
  "template": "507f1f77bcf86cd799439012",
  "location": "507f1f77bcf86cd799439013",
  "inspector": "507f1f77bcf86cd799439014",
  "sections": [
    {
      "sectionId": "507f1f77bcf86cd799439015",
      "name": "Reception & Lobby",
      "items": [
        {
          "itemId": "507f1f77bcf86cd799439016",
          "name": "Floors vacuumed and mopped",
          "score": null,
          "status": "pass",
          "comment": "Looks good",
          "photos": ["/uploads/photo1.jpg"]
        }
      ]
    }
  ],
  "totalScore": 92,
  "status": "completed",
  "summaryComment": "Excellent work!"
}
```

**Note:** 
- If user is Admin/Sub-Admin, `inspector` can be specified
- If user is Supervisor, `inspector` defaults to logged-in user

**Response (201 Created):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "template": "507f1f77bcf86cd799439012",
  "location": "507f1f77bcf86cd799439013",
  "inspector": "507f1f77bcf86cd799439014",
  "sections": [...],
  "totalScore": 92,
  "status": "completed",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

---

### 4. Update Inspection
**PUT** `/api/inspections/:id`

**Access:** Private

**Request Body:** Same as Create Inspection (all fields optional)

**Response (200 OK):** Updated inspection object

---

### 5. Delete Inspection
**DELETE** `/api/inspections/:id`

**Access:** Private, Admin Only

**Response (200 OK):**
```json
{
  "message": "Inspection removed"
}
```

---

### 6. Generate Inspection PDF
**GET** `/api/inspections/:id/pdf`

**Access:** Private

**Response:** PDF file download

---

### 7. Assign Inspection
**PATCH** `/api/inspections/:id/assign`

**Access:** Private, Admin or Sub-Admin

**Request Body:**
```json
{
  "inspector": "507f1f77bcf86cd799439014"
}
```

**Response (200 OK):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "inspector": "507f1f77bcf86cd799439014",
  "message": "Inspection assigned successfully"
}
```

---

### 8. Schedule Inspection
**PATCH** `/api/inspections/:id/schedule`

**Access:** Private, Admin or Sub-Admin

**Request Body:**
```json
{
  "scheduledDate": "2024-01-15T10:00:00.000Z"
}
```

**Response (200 OK):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "scheduledDate": "2024-01-15T10:00:00.000Z",
  "message": "Inspection scheduled successfully"
}
```

---

## 🎫 Ticket Endpoints

### 1. Get All Tickets
**GET** `/api/tickets`

**Access:** Private

**Query Parameters:**
- `status` (optional): Filter by status (`open`, `in_progress`, `resolved`, `verified`)
- `priority` (optional): Filter by priority (`low`, `medium`, `high`, `urgent`)
- `category` (optional): Filter by category (`Cleaning`, `Maintenance`, `Safety`, `Other`)
- `location` (optional): Filter by location ID
- `assignedTo` (optional): Filter by assigned user ID
- `createdBy` (optional): Filter by creator ID

**Response (200 OK):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Restroom floor sticky",
    "description": "Floor needs deep cleaning",
    "category": "Cleaning",
    "priority": "high",
    "status": "open",
    "location": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "ABC Plaza - Restrooms Floor 5"
    },
    "inspection": {
      "_id": "507f1f77bcf86cd799439013",
      "totalScore": 85
    },
    "createdBy": {
      "_id": "507f1f77bcf86cd799439014",
      "name": "John Supervisor"
    },
    "assignedTo": {
      "_id": "507f1f77bcf86cd799439015",
      "name": "Jane Inspector"
    },
    "photos": ["/uploads/ticket-photo1.jpg"],
    "dueDate": "2024-01-10T00:00:00.000Z",
    "scheduledDate": null,
    "firstResponseAt": null,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

**Status Values:**
- `open`: Ticket created, not started
- `in_progress`: Work in progress
- `resolved`: Issue fixed, awaiting verification
- `verified`: Verified and closed

**Priority Values:**
- `low`, `medium`, `high`, `urgent`

**Category Values:**
- `Cleaning`, `Maintenance`, `Safety`, `Other`

---

### 2. Create Ticket
**POST** `/api/tickets`

**Access:** Private, Admin or Sub-Admin

**Request Body:**
```json
{
  "title": "Broken AC Unit",
  "description": "AC unit in office not working",
  "category": "Maintenance",
  "priority": "urgent",
  "location": "507f1f77bcf86cd799439012",
  "inspection": "507f1f77bcf86cd799439013",
  "assignedTo": "507f1f77bcf86cd799439015",
  "photos": ["/uploads/ac-photo.jpg"],
  "dueDate": "2024-01-10T00:00:00.000Z"
}
```

**Response (201 Created):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "title": "Broken AC Unit",
  "description": "AC unit in office not working",
  "category": "Maintenance",
  "priority": "urgent",
  "status": "open",
  "location": "507f1f77bcf86cd799439012",
  "inspection": "507f1f77bcf86cd799439013",
  "createdBy": "507f1f77bcf86cd799439014",
  "assignedTo": "507f1f77bcf86cd799439015",
  "photos": ["/uploads/ac-photo.jpg"],
  "dueDate": "2024-01-10T00:00:00.000Z",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

---

### 3. Update Ticket
**PUT** `/api/tickets/:id`

**Access:** Private

**Request Body:**
```json
{
  "status": "in_progress",
  "priority": "high",
  "description": "Updated description",
  "photos": ["/uploads/new-photo.jpg"]
}
```

**Response (200 OK):** Updated ticket object

---

### 4. Assign Ticket
**PATCH** `/api/tickets/:id/assign`

**Access:** Private, Admin or Sub-Admin

**Request Body:**
```json
{
  "assignedTo": "507f1f77bcf86cd799439015"
}
```

**Response (200 OK):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "assignedTo": "507f1f77bcf86cd799439015",
  "message": "Ticket assigned successfully"
}
```

---

### 5. Schedule Ticket
**PATCH** `/api/tickets/:id/schedule`

**Access:** Private, Admin or Sub-Admin

**Request Body:**
```json
{
  "scheduledDate": "2024-01-15T14:00:00.000Z",
  "dueDate": "2024-01-16T00:00:00.000Z"
}
```

**Response (200 OK):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "scheduledDate": "2024-01-15T14:00:00.000Z",
  "dueDate": "2024-01-16T00:00:00.000Z",
  "message": "Ticket scheduled successfully"
}
```

---

## 📤 Upload Endpoints

### 1. Upload Single Photo
**POST** `/api/upload`

**Access:** Private

**Content-Type:** `multipart/form-data`

**Form Data:**
- `photo` (file): Image file to upload

**Response (200 OK):**
```json
{
  "message": "Photo uploaded successfully",
  "filename": "photo-1234567890.jpg",
  "path": "/uploads/photo-1234567890.jpg",
  "url": "http://localhost:5000/uploads/photo-1234567890.jpg"
}
```

**Error Response (400):**
```json
{
  "message": "No file uploaded"
}
```

---

### 2. Upload Multiple Photos
**POST** `/api/upload/multiple`

**Access:** Private

**Content-Type:** `multipart/form-data`

**Form Data:**
- `photos` (files): Array of image files (max 10)

**Response (200 OK):**
```json
{
  "message": "Photos uploaded successfully",
  "files": [
    {
      "filename": "photo-1234567890.jpg",
      "path": "/uploads/photo-1234567890.jpg",
      "url": "http://localhost:5000/uploads/photo-1234567890.jpg"
    },
    {
      "filename": "photo-1234567891.jpg",
      "path": "/uploads/photo-1234567891.jpg",
      "url": "http://localhost:5000/uploads/photo-1234567891.jpg"
    }
  ]
}
```

**Note:** Uploaded files are accessible at `http://localhost:5000/uploads/<filename>`

---

## 📊 Report Endpoints

### 1. Get Summary Report
**GET** `/api/reports/summary`

**Access:** Private, Admin Only

**Query Parameters:**
- `startDate` (optional): Start date for report period
- `endDate` (optional): End date for report period
- `type` (optional): Report type (`All`, `Inspections`, `Tickets`)

**Response (200 OK):**
```json
{
  "summary": {
    "totalInspections": 150,
    "averageScore": 87.5,
    "totalTickets": 45,
    "openTickets": 12,
    "resolvedTickets": 33,
    "averageResolutionTime": 2.5
  },
  "inspections": [...],
  "tickets": [...],
  "charts": {
    "inspectionsOverTime": [...],
    "ticketStatusDistribution": [...]
  }
}
```

---

## 📋 Data Models

### User Model
```typescript
{
  _id: ObjectId
  name: string (required)
  email: string (required, unique)
  password: string (required, hashed)
  role: 'admin' | 'sub_admin' | 'supervisor' | 'client' (default: 'supervisor')
  assignedLocations: ObjectId[] (references Location)
  createdAt: Date
  updatedAt: Date
}
```

### Location Model
```typescript
{
  _id: ObjectId
  name: string (required)
  type: 'client' | 'building' | 'floor' | 'area' | 'office' | 'retail' | 'warehouse' | 'restroom' | 'healthcare' (required)
  parent: ObjectId | null (references Location)
  address: string
  clientContact: string
  createdAt: Date
  updatedAt: Date
}
```

### Template Model
```typescript
{
  _id: ObjectId
  name: string (required)
  description: string
  sections: [{
    _id: ObjectId
    name: string (required)
    items: [{
      _id: ObjectId
      name: string (required)
      type: 'pass_fail' | 'rating_1_5' | 'yes_no' (default: 'pass_fail')
      weight: number (default: 1)
    }]
  }]
  createdBy: ObjectId (references User)
  createdAt: Date
  updatedAt: Date
}
```

### Inspection Model
```typescript
{
  _id: ObjectId
  template: ObjectId (required, references Template)
  location: ObjectId (required, references Location)
  inspector: ObjectId (required, references User)
  date: Date (default: now)
  sections: [{
    sectionId: ObjectId (required)
    name: string (required)
    sectionScore: number
    items: [{
      itemId: ObjectId (required)
      name: string (required)
      score: number | null (for rating_1_5)
      status: 'pass' | 'fail' (default: 'pass')
      comment: string
      photos: string[] (URLs)
    }]
  }]
  totalScore: number
  appaScore: number
  status: 'in_progress' | 'completed' | 'submitted' (default: 'in_progress')
  summaryComment: string
  scheduledDate: Date | null
  createdAt: Date
  updatedAt: Date
}
```

### Ticket Model
```typescript
{
  _id: ObjectId
  title: string (required)
  description: string
  category: 'Cleaning' | 'Maintenance' | 'Safety' | 'Other' (default: 'Cleaning')
  priority: 'low' | 'medium' | 'high' | 'urgent' (default: 'medium')
  status: 'open' | 'in_progress' | 'resolved' | 'verified' (default: 'open')
  location: ObjectId (references Location)
  inspection: ObjectId (references Inspection)
  createdBy: ObjectId (required, references User)
  assignedTo: ObjectId (references User)
  photos: string[] (URLs)
  dueDate: Date | null
  scheduledDate: Date | null
  firstResponseAt: Date | null
  createdAt: Date
  updatedAt: Date
}
```

---

## ⚠️ Error Handling

### Standard Error Response Format
```json
{
  "message": "Error description"
}
```

### Common HTTP Status Codes

- **200 OK:** Request successful
- **201 Created:** Resource created successfully
- **400 Bad Request:** Invalid request data
- **401 Unauthorized:** Authentication required or invalid token
- **403 Forbidden:** Insufficient permissions
- **404 Not Found:** Resource not found
- **500 Internal Server Error:** Server error

### Example Error Responses

**401 Unauthorized:**
```json
{
  "message": "Not authorized, no token"
}
```

**403 Forbidden:**
```json
{
  "message": "Not authorized as admin"
}
```

**404 Not Found:**
```json
{
  "message": "User not found"
}
```

**400 Bad Request:**
```json
{
  "message": "Invalid user data"
}
```

---

## 🔒 Role-Based Access Control

### Role Permissions Summary

| Endpoint | Admin | Sub-Admin | Supervisor | Client |
|----------|-------|-----------|------------|--------|
| Login/Register | ✅ | ✅ | ✅ | ✅ |
| Get Users | ✅ | ✅ | ✅ | ✅ |
| Create/Update/Delete Users | ✅ | ❌ | ❌ | ❌ |
| Get Locations | ✅ | ✅ | ✅ | ✅ |
| Create/Update/Delete Locations | ✅ | ✅ | ❌ | ❌ |
| Get Templates | ✅ | ✅ | ✅ | ✅ |
| Create/Update/Delete Templates | ✅ | ✅ | ❌ | ❌ |
| Get Inspections | All | All | Own Only | Assigned Locations |
| Create Inspections | ✅ | ✅ | ✅ | ❌ |
| Update Inspections | ✅ | ✅ | ✅ | ❌ |
| Delete Inspections | ✅ | ❌ | ❌ | ❌ |
| Get Tickets | ✅ | ✅ | ✅ | ✅ |
| Create Tickets | ✅ | ✅ | ❌ | ❌ |
| Update Tickets | ✅ | ✅ | ✅ | ✅ |
| Get Reports | ✅ | ❌ | ❌ | ❌ |

---

## 🚀 Getting Started

### 1. Base URL
```
Development: http://localhost:5000/api
Production: https://your-domain.com/api
```

### 2. Authentication Flow
1. Call `POST /api/users/login` with credentials
2. Store the returned `token` in your app state/localStorage
3. Include token in all subsequent requests: `Authorization: Bearer <token>`
4. Use `POST /api/users/refresh` to get a new token before expiration

### 3. Example Request (JavaScript/Fetch)
```javascript
// Login
const response = await fetch('http://localhost:5000/api/users/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'admin@cleanguard.com',
    password: 'password123'
  })
});

const data = await response.json();
const token = data.token;

// Use token in subsequent requests
const inspectionsResponse = await fetch('http://localhost:5000/api/inspections', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const inspections = await inspectionsResponse.json();
```

### 4. Example Request (Axios)
```javascript
import axios from 'axios';

// Set base URL
axios.defaults.baseURL = 'http://localhost:5000/api';

// Login
const loginResponse = await axios.post('/users/login', {
  email: 'admin@cleanguard.com',
  password: 'password123'
});

const token = loginResponse.data.token;

// Set default authorization header
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

// Make authenticated request
const inspections = await axios.get('/inspections');
```

---

## 📝 Notes

1. **File Uploads:** Use `multipart/form-data` for photo uploads. Max file size is configured on the server.

2. **Pagination:** Currently not implemented. All list endpoints return all results. Consider implementing pagination for large datasets.

3. **Filtering:** Many endpoints support query parameters for filtering. Check individual endpoint documentation.

4. **Date Formats:** Use ISO 8601 format: `2024-01-01T00:00:00.000Z`

5. **Object IDs:** MongoDB ObjectIds are strings in JSON format: `"507f1f77bcf86cd799439011"`

6. **Photo URLs:** Uploaded photos are served at `http://localhost:5000/uploads/<filename>`

---

## 🐛 Troubleshooting

### Common Issues

**401 Unauthorized:**
- Check if token is included in Authorization header
- Verify token hasn't expired
- Ensure token format: `Bearer <token>` (with space)

**403 Forbidden:**
- Verify user has required role/permissions
- Check if user is authenticated

**404 Not Found:**
- Verify endpoint URL is correct
- Check if resource ID exists

**500 Internal Server Error:**
- Check server logs
- Verify request data format matches expected schema

---

## 📞 Support

For API issues or questions, contact the development team.

---

**Last Updated:** 2024
**API Version:** 1.0.0

