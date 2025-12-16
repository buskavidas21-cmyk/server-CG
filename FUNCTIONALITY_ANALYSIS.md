# CleanGuard QC - Functionality Analysis & Setup Guide

## 📋 Project Overview
This is a MERN stack (MongoDB, Express, React, Node.js) application for quality control and inspection management for janitorial companies.

---

## ✅ **IMPLEMENTED FEATURES**

### 1. **User Management & Authentication** ✅
- ✅ User roles: Admin, Sub-admin, Supervisor, Client
- ✅ JWT-based authentication
- ✅ User registration/login
- ✅ Role-based access control
- ✅ User assignment to locations

### 2. **Location Management** ✅
- ✅ Hierarchical location structure (Client → Building → Floor → Area)
- ✅ Location types (office, retail, warehouse, restroom, healthcare, etc.)
- ✅ Location search and filtering
- ✅ Location assignment to users

### 3. **Inspection Templates** ✅
- ✅ Template creation with sections and items
- ✅ Multiple scoring methods: Pass/Fail, 1-5 Rating, Yes/No
- ✅ Item weights for importance
- ✅ Template reuse across locations

### 4. **Inspections** ✅
- ✅ Create and perform inspections
- ✅ Section-by-section walkthrough
- ✅ Item scoring (Pass/Fail, 1-5, Yes/No)
- ✅ Photo attachments per item
- ✅ Comments per item
- ✅ Auto ticket creation on failure
- ✅ Score calculation (total score, APPA score)
- ✅ Inspection status tracking (in_progress, completed, submitted)
- ✅ Inspection scheduling
- ✅ Inspection details view

### 5. **Ticketing System** ✅
- ✅ Ticket creation (manual or from inspection)
- ✅ Ticket categories (Cleaning, Maintenance, Safety, Other)
- ✅ Priority levels (Low, Medium, High, Urgent)
- ✅ Status workflow (Open → In Progress → Resolved → Verified)
- ✅ Ticket assignment
- ✅ Photo attachments
- ✅ Due dates and scheduling
- ✅ Ticket filtering and search
- ✅ Bulk ticket creation

### 6. **Dashboard** ✅
- ✅ Role-based dashboards (Admin, Supervisor, Client)
- ✅ Today's inspections
- ✅ Open issues/tickets
- ✅ Statistics (total inspections, avg score, open tickets, etc.)
- ✅ Charts and graphs (inspections over time, ticket status distribution)
- ✅ Date range filtering

### 7. **Reports & Analytics** ✅
- ✅ PDF report generation
- ✅ Summary reports with statistics
- ✅ Inspection reports
- ✅ Ticket analytics
- ✅ Date range filtering
- ✅ Report type selection (All, Inspections, Tickets)
- ✅ Export to PDF

### 8. **Photo Management** ✅
- ✅ Photo upload during inspections
- ✅ Photo attachments to tickets
- ✅ Photo storage (local uploads folder)

### 9. **Schedule Management** ✅
- ✅ Inspection scheduling
- ✅ Ticket scheduling
- ✅ Calendar view

---

## ❌ **MISSING FEATURES** (From Requirements)

### 1. **Offline Mode** ❌
**Required:** Inspections can be done without internet, data stores locally and syncs when back online
- ❌ No offline storage implementation (IndexedDB, localStorage)
- ❌ No sync mechanism when connection restored
- ❌ No offline indicator in UI

### 2. **Notifications & Alerts** ❌
**Required:** Push notifications (iOS/Android) and email alerts
- ❌ No push notification service (Firebase Cloud Messaging / Apple Push Notification Service)
- ❌ No email notification system (SendGrid, Nodemailer, etc.)
- ❌ No notification configuration per role
- ❌ No alerts for:
  - New ticket assigned
  - Ticket overdue
  - Inspection scheduled today
  - Inspection completed
  - Monthly summary ready

### 3. **Client Portal Features** ⚠️ (Partially Implemented)
**Required:** Full client portal with specific features
- ✅ Basic client dashboard exists
- ✅ Client can view inspections
- ✅ Client can view tickets
- ❌ Client cannot add comments on inspections
- ❌ Client cannot request service (create ticket)
- ❌ No client-specific report views
- ❌ No client permission controls (what they can see/create)

### 4. **Photo Marking** ❌
**Required:** Mark photos as "Issue" or "Before/After"
- ❌ No photo metadata/tagging system
- ❌ Photos are just stored as URLs, no categorization

### 5. **Report Sharing & Scheduling** ❌
**Required:** 
- ✅ PDF export exists
- ❌ Email reports directly to client from app
- ❌ Schedule automatic email reports (e.g., every Monday at 8 a.m.)
- ❌ Share summary with client instantly after inspection

### 6. **Advanced Analytics** ⚠️ (Partially Implemented)
**Required:**
- ✅ Basic charts exist
- ❌ Monthly/weekly trend graphs
- ❌ Average scores by location
- ❌ Average scores by area (restrooms vs. offices)
- ❌ Average scores by inspector
- ❌ Top recurring issues analysis
- ❌ Average resolution time (partially calculated but not displayed in detail)

### 7. **Favorites** ❌
**Required:** Users can favorite frequent sites
- ❌ No favorites/bookmarks feature for locations

### 8. **Location Search** ⚠️ (Basic Implementation)
**Required:** Search by client or building name
- ⚠️ Basic search may exist but needs verification

### 9. **Inspection Report Details** ⚠️ (Partially Implemented)
**Required:** Per-visit full PDF/HTML report with:
- ✅ Date, time, inspector
- ✅ Overall score & color code
- ✅ Section scores
- ⚠️ Failed items with comments and photos (may be in PDF)
- ⚠️ Linked tickets (may be in PDF)

### 10. **Excel Export** ❌
**Required:** Export to Excel
- ❌ Only PDF export exists, no Excel export

---

## 🚀 **HOW TO RUN THE PROJECT**

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Step 1: Install Dependencies
```bash
# Install root dependencies (concurrently)
npm install

# Install all dependencies (server + client)
npm run install-all
```

### Step 2: Environment Setup

#### Server Environment (.env file in `server/` folder)
Create `server/.env` file:
```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/cleanguard-qc
# OR for MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/cleanguard-qc
JWT_SECRET=your_super_secret_jwt_key_here
```

#### Client Environment
The client uses `http://localhost:5000` by default. If your server runs on a different port, update API calls in client files.

### Step 3: Start MongoDB
```bash
# If using local MongoDB:
mongod

# Or ensure MongoDB service is running
```

### Step 4: Seed Database (Optional)
```bash
cd server
npm run data:import
```

### Step 5: Run the Application

#### Option A: Run Both Server and Client Together
```bash
# From root directory
npm start
```
This will start:
- Server on `http://localhost:5000`
- Client on `http://localhost:5173` (Vite default)

#### Option B: Run Separately

**Terminal 1 - Server:**
```bash
cd server
npm run dev
```

**Terminal 2 - Client:**
```bash
cd client
npm run dev
```

### Step 6: Access the Application
- **Web App:** Open `http://localhost:5173` in your browser
- **API:** `http://localhost:5000`

### Default Login Credentials
Check `server/seeder.js` for default users created by the seeder.

---

## 📝 **SUMMARY**

### Completion Status: **~70% Complete**

**Core Features:** ✅ Mostly Complete
- User management, locations, templates, inspections, tickets, basic reports

**Advanced Features:** ❌ Missing
- Offline mode, notifications, email system, advanced analytics, Excel export

**Client Portal:** ⚠️ Partially Complete
- Basic viewing works, but missing interactive features

### Priority Missing Features to Implement:
1. **Email Notifications** (High Priority)
2. **Offline Mode** (High Priority for mobile use)
3. **Client Portal Enhancements** (Medium Priority)
4. **Advanced Analytics** (Medium Priority)
5. **Excel Export** (Low Priority)
6. **Photo Marking** (Low Priority)

---

## 🔧 **TECHNICAL STACK**

- **Frontend:** React 19, Vite, Tailwind CSS, React Router, Axios
- **Backend:** Node.js, Express, MongoDB (Mongoose)
- **Authentication:** JWT
- **File Upload:** Multer
- **PDF Generation:** PDFKit
- **Charts:** Recharts, Chart.js

---

## 📁 **Project Structure**
```
clean guard/
├── client/          # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   └── App.jsx
│   └── package.json
├── server/          # Express backend
│   ├── config/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── utils/
│   └── server.js
├── mobile/          # Flutter mobile app (ignore as per request)
└── package.json     # Root package.json with scripts
```

---

## ⚠️ **IMPORTANT NOTES**

1. **Mobile Folder:** As requested, the mobile folder is ignored in this analysis. The mobile app exists but is not part of the web app functionality assessment.

2. **Environment Variables:** Make sure to set up `.env` file in the server directory before running.

3. **Database:** Ensure MongoDB is running before starting the server.

4. **Port Conflicts:** If ports 5000 or 5173 are in use, update them in:
   - Server: `server/server.js` or `.env`
   - Client: `client/vite.config.js`

5. **CORS:** Currently configured to allow all origins. Update `server/server.js` for production.

---

## 🐛 **Potential Issues to Check**

1. **API Base URL:** Client uses hardcoded `http://localhost:5000`. Update for production.
2. **File Upload Path:** Ensure `server/uploads/` directory exists and has write permissions.
3. **PDF Reports:** Ensure `server/reports/` directory exists.
4. **MongoDB Connection:** Verify MongoDB URI is correct in `.env`.

---

**Last Updated:** Based on current codebase analysis
**Analysis Date:** Current

