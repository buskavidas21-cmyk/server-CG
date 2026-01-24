# CleanGuard QC - Comprehensive Test Plan

## Overview
This test plan provides a systematic approach to testing all features of the CleanGuard QC application. The seeder has been configured to generate 50+ entries in each section for comprehensive testing.

**Last Updated:** Current Date  
**Test Data:** 50+ Users, 50+ Locations, 60+ Inspections, 50+ Tickets

---

## Pre-Testing Setup

### 1. Database Seeding
```bash
# Run the seeder to populate database with test data
node seeder.js

# To clear database and reseed
node seeder.js -d  # First clear
node seeder.js      # Then seed
```

### 2. Test Credentials
- **Admin User:** `admin@cleanguard.com` / `password123`
- **Supervisor User:** `john@cleanguard.com` / `password123`
- **Client User:** `client@abcplaza.com` / `password123`

### 3. Environment Setup
- Ensure backend server is running on configured port (default: 5000)
- Ensure frontend is running on configured port (default: 3000)
- Verify database connection is active

---

## Test Categories

### 1. Authentication & Authorization Tests

#### 1.1 Login Functionality
- [ ] **TC-AUTH-001:** Login with valid admin credentials
- [ ] **TC-AUTH-002:** Login with valid supervisor credentials
- [ ] **TC-AUTH-003:** Login with valid client credentials
- [ ] **TC-AUTH-004:** Login with invalid email
- [ ] **TC-AUTH-005:** Login with invalid password
- [ ] **TC-AUTH-006:** Login with empty fields
- [ ] **TC-AUTH-007:** Verify "Remember Me" functionality (if implemented)
- [ ] **TC-AUTH-008:** Test logout functionality
- [ ] **TC-AUTH-009:** Verify session persistence after page refresh
- [ ] **TC-AUTH-010:** Test token expiration handling

#### 1.2 Role-Based Access Control
- [ ] **TC-AUTH-011:** Admin can access all pages
- [ ] **TC-AUTH-012:** Supervisor can access inspection and ticket pages
- [ ] **TC-AUTH-013:** Supervisor cannot access user management
- [ ] **TC-AUTH-014:** Client has limited access (read-only)
- [ ] **TC-AUTH-015:** Unauthorized access redirects to login
- [ ] **TC-AUTH-016:** Verify role-specific navigation items

---

### 2. Dashboard Tests

#### 2.1 Dashboard Display
- [ ] **TC-DASH-001:** Dashboard loads with all metrics
- [ ] **TC-DASH-002:** Verify inspection count displays correctly
- [ ] **TC-DASH-003:** Verify inspection score average displays correctly
- [ ] **TC-DASH-004:** Verify ticket count displays correctly
- [ ] **TC-DASH-005:** Verify charts render (Inspections Over Time)
- [ ] **TC-DASH-006:** Verify charts render (Ticket Status Distribution)
- [ ] **TC-DASH-007:** Test loading spinner appears during data fetch
- [ ] **TC-DASH-008:** Verify error handling when API fails

#### 2.2 Dashboard Filters
- [ ] **TC-DASH-009:** Filter by location (All Areas)
- [ ] **TC-DASH-010:** Filter by specific location
- [ ] **TC-DASH-011:** Filter by date range (Last 7 days)
- [ ] **TC-DASH-012:** Filter by date range (Last 30 days)
- [ ] **TC-DASH-013:** Filter by date range (Last 90 days)
- [ ] **TC-DASH-014:** Filter by custom date range
- [ ] **TC-DASH-015:** Verify metrics update when filters change
- [ ] **TC-DASH-016:** Test filter combinations (location + date range)

#### 2.3 Dashboard Quick Actions
- [ ] **TC-DASH-017:** "Start Inspection" button navigates correctly
- [ ] **TC-DASH-018:** "Create Ticket" button navigates correctly
- [ ] **TC-DASH-019:** "View Reports" button navigates correctly

---

### 3. Inspection Management Tests

#### 3.1 Inspection List
- [ ] **TC-INS-001:** Inspection list loads with all inspections
- [ ] **TC-INS-002:** Verify pagination works (if implemented)
- [ ] **TC-INS-003:** Test search functionality
- [ ] **TC-INS-004:** Filter by status (All, Completed, In Progress, Submitted)
- [ ] **TC-INS-005:** Filter by score range (90-100, 75-89, <75)
- [ ] **TC-INS-006:** Filter by location
- [ ] **TC-INS-007:** Filter by date range
- [ ] **TC-INS-008:** Test multiple filter combinations
- [ ] **TC-INS-009:** Verify inspection details link works
- [ ] **TC-INS-010:** Test sorting functionality

#### 3.2 Create New Inspection
- [ ] **TC-INS-011:** Navigate to "New Inspection" page
- [ ] **TC-INS-012:** Select template from dropdown
- [ ] **TC-INS-013:** Select location from dropdown
- [ ] **TC-INS-014:** Verify template sections load correctly
- [ ] **TC-INS-015:** Test pass/fail item selection
- [ ] **TC-INS-016:** Test rating (1-5) item selection
- [ ] **TC-INS-017:** Test yes/no item selection
- [ ] **TC-INS-018:** Add comment to failed item
- [ ] **TC-INS-019:** Upload photo for item
- [ ] **TC-INS-020:** Upload multiple photos
- [ ] **TC-INS-021:** Remove uploaded photo
- [ ] **TC-INS-022:** Navigate between sections
- [ ] **TC-INS-023:** Verify score calculation updates in real-time
- [ ] **TC-INS-024:** Submit completed inspection
- [ ] **TC-INS-025:** Save inspection as draft
- [ ] **TC-INS-026:** Mark inspection as private
- [ ] **TC-INS-027:** Test form validation (required fields)

#### 3.3 Inspection Details
- [ ] **TC-INS-028:** View inspection details page
- [ ] **TC-INS-029:** Verify all sections display correctly
- [ ] **TC-INS-030:** Verify item scores display correctly
- [ ] **TC-INS-031:** Verify comments display correctly
- [ ] **TC-INS-032:** Verify photos display correctly
- [ ] **TC-INS-033:** Verify total score displays correctly
- [ ] **TC-INS-034:** Verify inspector information displays
- [ ] **TC-INS-035:** Verify location information displays
- [ ] **TC-INS-036:** Test "Edit Inspection" (if applicable)
- [ ] **TC-INS-037:** Test "Create Ticket from Inspection"
- [ ] **TC-INS-038:** Test "Export PDF" functionality
- [ ] **TC-INS-039:** Test "Back to List" navigation

#### 3.4 Inspection Scheduling
- [ ] **TC-INS-040:** Schedule inspection for future date
- [ ] **TC-INS-041:** Assign inspection to supervisor
- [ ] **TC-INS-042:** Verify scheduled inspections appear in schedule view
- [ ] **TC-INS-043:** Edit scheduled inspection date
- [ ] **TC-INS-044:** Cancel scheduled inspection

---

### 4. Ticket Management Tests

#### 4.1 Ticket List
- [ ] **TC-TKT-001:** Ticket list loads with all tickets
- [ ] **TC-TKT-002:** Test tab navigation (Inbox, Scheduled, All Tickets)
- [ ] **TC-TKT-003:** Test search functionality
- [ ] **TC-TKT-004:** Filter by status (Open, In Progress, Resolved, Verified)
- [ ] **TC-TKT-005:** Filter by priority (Low, Medium, High, Urgent)
- [ ] **TC-TKT-006:** Filter by location
- [ ] **TC-TKT-007:** Filter by assigned user
- [ ] **TC-TKT-008:** Test multiple filter combinations
- [ ] **TC-TKT-009:** Test sorting (Date, Priority, Status)
- [ ] **TC-TKT-010:** Verify ticket details link works

#### 4.2 Create Ticket
- [ ] **TC-TKT-011:** Navigate to "Create Ticket" page
- [ ] **TC-TKT-012:** Enter ticket title
- [ ] **TC-TKT-013:** Enter ticket description
- [ ] **TC-TKT-014:** Select category (Cleaning, Maintenance, Safety, Other)
- [ ] **TC-TKT-015:** Select priority (Low, Medium, High, Urgent)
- [ ] **TC-TKT-016:** Select location
- [ ] **TC-TKT-017:** Link ticket to inspection (if applicable)
- [ ] **TC-TKT-018:** Assign ticket to supervisor
- [ ] **TC-TKT-019:** Set due date
- [ ] **TC-TKT-020:** Upload photos
- [ ] **TC-TKT-021:** Submit ticket
- [ ] **TC-TKT-022:** Test form validation

#### 4.3 Ticket Details & Actions
- [ ] **TC-TKT-023:** View ticket details
- [ ] **TC-TKT-024:** Verify all ticket information displays
- [ ] **TC-TKT-025:** Assign ticket to different user
- [ ] **TC-TKT-026:** Update ticket status
- [ ] **TC-TKT-027:** Add resolution notes
- [ ] **TC-TKT-028:** Upload resolution photos
- [ ] **TC-TKT-029:** Resolve ticket
- [ ] **TC-TKT-030:** Verify ticket
- [ ] **TC-TKT-031:** Schedule ticket
- [ ] **TC-TKT-032:** Edit ticket (if applicable)
- [ ] **TC-TKT-033:** Delete ticket (if applicable)
- [ ] **TC-TKT-034:** Test ticket history/activity log

#### 4.4 Bulk Ticket Operations
- [ ] **TC-TKT-035:** Navigate to bulk ticket creation
- [ ] **TC-TKT-036:** Create multiple tickets at once
- [ ] **TC-TKT-037:** Verify bulk tickets created successfully

---

### 5. Schedule Tests

#### 5.1 Schedule View
- [ ] **TC-SCH-001:** Schedule page loads correctly
- [ ] **TC-SCH-002:** Calendar displays current month
- [ ] **TC-SCH-003:** Scheduled inspections appear on calendar
- [ ] **TC-SCH-004:** Scheduled tickets appear on calendar
- [ ] **TC-SCH-005:** Navigate to previous month
- [ ] **TC-SCH-006:** Navigate to next month
- [ ] **TC-SCH-007:** Navigate to today
- [ ] **TC-SCH-008:** Click on date to view details

#### 5.2 Schedule Filters
- [ ] **TC-SCH-009:** Filter by time period (Week, Month, Year)
- [ ] **TC-SCH-010:** Filter by inspector
- [ ] **TC-SCH-011:** Filter by location
- [ ] **TC-SCH-012:** Test filter combinations

#### 5.3 Schedule Actions
- [ ] **TC-SCH-013:** Create new scheduled inspection from schedule
- [ ] **TC-SCH-014:** Create new scheduled ticket from schedule
- [ ] **TC-SCH-015:** Edit scheduled item from calendar
- [ ] **TC-SCH-016:** Delete scheduled item from calendar

---

### 6. Reports Tests

#### 6.1 Reports Navigation
- [ ] **TC-RPT-001:** Navigate to Reports page
- [ ] **TC-RPT-002:** Verify all report types are listed
- [ ] **TC-RPT-003:** Click on report card navigates to report
- [ ] **TC-RPT-004:** Test "Back to Reports" navigation

#### 6.2 Overall Report
- [ ] **TC-RPT-005:** Overall Report page loads
- [ ] **TC-RPT-006:** Apply date range filter
- [ ] **TC-RPT-007:** Apply location filter
- [ ] **TC-RPT-008:** Verify summary statistics display
- [ ] **TC-RPT-009:** Verify charts render correctly
- [ ] **TC-RPT-010:** Verify location performance table displays
- [ ] **TC-RPT-011:** Test export to PDF functionality
- [ ] **TC-RPT-012:** Verify data accuracy

#### 6.3 Tickets Report
- [ ] **TC-RPT-013:** Tickets Report page loads
- [ ] **TC-RPT-014:** Apply date range filter
- [ ] **TC-RPT-015:** Apply location filter
- [ ] **TC-RPT-016:** Verify ticket statistics display
- [ ] **TC-RPT-017:** Verify response time metrics
- [ ] **TC-RPT-018:** Verify charts render correctly
- [ ] **TC-RPT-019:** Test export to PDF functionality

#### 6.4 Inspector Leaderboard
- [ ] **TC-RPT-020:** Inspector Leaderboard page loads
- [ ] **TC-RPT-021:** Apply date range filter
- [ ] **TC-RPT-022:** Verify inspector rankings display
- [ ] **TC-RPT-023:** Verify inspection counts per inspector
- [ ] **TC-RPT-024:** Verify average scores per inspector
- [ ] **TC-RPT-025:** Verify charts render correctly
- [ ] **TC-RPT-026:** Test export to PDF functionality

#### 6.5 Private Inspections Report
- [ ] **TC-RPT-027:** Private Inspections Report page loads
- [ ] **TC-RPT-028:** Apply date range filter
- [ ] **TC-RPT-029:** Verify only private inspections display
- [ ] **TC-RPT-030:** Verify statistics display
- [ ] **TC-RPT-031:** Test export to PDF functionality

#### 6.6 Inspection Forms Report
- [ ] **TC-RPT-032:** Inspection Forms Report page loads
- [ ] **TC-RPT-033:** Apply date range filter
- [ ] **TC-RPT-034:** Verify area type performance displays
- [ ] **TC-RPT-035:** Verify line item performance displays
- [ ] **TC-RPT-036:** Test expand/collapse area types
- [ ] **TC-RPT-037:** Test export to PDF functionality

---

### 7. Location Management Tests

#### 7.1 Location List
- [ ] **TC-LOC-001:** Location list loads
- [ ] **TC-LOC-002:** Verify all locations display
- [ ] **TC-LOC-003:** Test search functionality
- [ ] **TC-LOC-004:** Filter by location type
- [ ] **TC-LOC-005:** Filter by company
- [ ] **TC-LOC-006:** Test sorting

#### 7.2 Create/Edit Location
- [ ] **TC-LOC-007:** Create new location
- [ ] **TC-LOC-008:** Edit existing location
- [ ] **TC-LOC-009:** Delete location
- [ ] **TC-LOC-010:** Test form validation
- [ ] **TC-LOC-011:** Verify location appears in dropdowns after creation

---

### 8. Template Management Tests

#### 8.1 Template List
- [ ] **TC-TMP-001:** Template list loads
- [ ] **TC-TMP-002:** Verify all templates display
- [ ] **TC-TMP-003:** Test search functionality
- [ ] **TC-TMP-004:** View template details

#### 8.2 Create/Edit Template
- [ ] **TC-TMP-005:** Create new template
- [ ] **TC-TMP-006:** Add sections to template
- [ ] **TC-TMP-007:** Add items to sections
- [ ] **TC-TMP-008:** Set item types (pass/fail, rating, yes/no)
- [ ] **TC-TMP-009:** Set item weights
- [ ] **TC-TMP-010:** Edit existing template
- [ ] **TC-TMP-011:** Delete template
- [ ] **TC-TMP-012:** Test form validation

---

### 9. User Management Tests

#### 9.1 User List
- [ ] **TC-USR-001:** User list loads (Admin only)
- [ ] **TC-USR-002:** Verify all users display
- [ ] **TC-USR-003:** Test search functionality
- [ ] **TC-USR-004:** Filter by role
- [ ] **TC-USR-005:** Test sorting

#### 9.2 Create/Edit User
- [ ] **TC-USR-006:** Create new user
- [ ] **TC-USR-007:** Set user role
- [ ] **TC-USR-008:** Set user email
- [ ] **TC-USR-009:** Set user password
- [ ] **TC-USR-010:** Edit existing user
- [ ] **TC-USR-011:** Delete user
- [ ] **TC-USR-012:** Test form validation
- [ ] **TC-USR-013:** Verify password requirements

---

### 10. Start Work Feature Tests

#### 10.1 Start Work Page
- [ ] **TC-WRK-001:** Start Work page loads
- [ ] **TC-WRK-002:** Verify "Today's Schedule" section displays
- [ ] **TC-WRK-003:** Verify scheduled inspections appear
- [ ] **TC-WRK-004:** Verify scheduled tickets appear
- [ ] **TC-WRK-005:** Click on scheduled item to start work
- [ ] **TC-WRK-006:** Verify "My Active Session" section displays
- [ ] **TC-WRK-007:** Start new inspection from Start Work page
- [ ] **TC-WRK-008:** Resume active inspection session

---

### 11. UI/UX Tests

#### 11.1 Responsive Design
- [ ] **TC-UI-001:** Test on desktop (1920x1080)
- [ ] **TC-UI-002:** Test on tablet (768x1024)
- [ ] **TC-UI-003:** Test on mobile (375x667)
- [ ] **TC-UI-004:** Verify navigation works on mobile
- [ ] **TC-UI-005:** Verify forms are usable on mobile
- [ ] **TC-UI-006:** Verify tables are scrollable on mobile

#### 11.2 Loading States
- [ ] **TC-UI-007:** Verify loading spinner appears on page load
- [ ] **TC-UI-008:** Verify loading spinner appears on data fetch
- [ ] **TC-UI-009:** Verify loading spinner appears on form submission
- [ ] **TC-UI-010:** Verify loading spinner appears on file upload

#### 11.3 Error Handling
- [ ] **TC-UI-011:** Test error message display on API failure
- [ ] **TC-UI-012:** Test error message display on network error
- [ ] **TC-UI-013:** Test error message display on validation error
- [ ] **TC-UI-014:** Verify error messages are user-friendly

#### 11.4 Navigation
- [ ] **TC-UI-015:** Test sidebar navigation (desktop)
- [ ] **TC-UI-016:** Test bottom navigation (mobile)
- [ ] **TC-UI-017:** Test breadcrumb navigation
- [ ] **TC-UI-018:** Test back button functionality
- [ ] **TC-UI-019:** Verify active page is highlighted

---

### 12. Performance Tests

#### 12.1 Load Performance
- [ ] **TC-PERF-001:** Dashboard loads within 2 seconds
- [ ] **TC-PERF-002:** Inspection list loads within 3 seconds
- [ ] **TC-PERF-003:** Ticket list loads within 3 seconds
- [ ] **TC-PERF-004:** Reports load within 5 seconds
- [ ] **TC-PERF-005:** Large data sets render without lag

#### 12.2 Filter Performance
- [ ] **TC-PERF-006:** Filters apply within 1 second
- [ ] **TC-PERF-007:** Complex filter combinations work smoothly
- [ ] **TC-PERF-008:** Search results appear quickly

---

### 13. Integration Tests

#### 13.1 API Integration
- [ ] **TC-INT-001:** Verify all API endpoints respond correctly
- [ ] **TC-INT-002:** Test API authentication
- [ ] **TC-INT-003:** Test API error responses
- [ ] **TC-INT-004:** Verify data consistency between frontend and backend

#### 13.2 Data Flow
- [ ] **TC-INT-005:** Create inspection → Verify appears in list
- [ ] **TC-INT-006:** Create ticket from inspection → Verify linked correctly
- [ ] **TC-INT-007:** Resolve ticket → Verify status updates everywhere
- [ ] **TC-INT-008:** Schedule inspection → Verify appears in schedule
- [ ] **TC-INT-009:** Export report → Verify PDF generates correctly

---

### 14. Security Tests

#### 14.1 Authentication Security
- [ ] **TC-SEC-001:** Test SQL injection attempts
- [ ] **TC-SEC-002:** Test XSS attempts
- [ ] **TC-SEC-003:** Test CSRF protection
- [ ] **TC-SEC-004:** Verify tokens are stored securely
- [ ] **TC-SEC-005:** Test session timeout

#### 14.2 Authorization Security
- [ ] **TC-SEC-006:** Verify users cannot access unauthorized endpoints
- [ ] **TC-SEC-007:** Verify users cannot modify other users' data
- [ ] **TC-SEC-008:** Test direct URL access to protected pages

---

### 15. Data Validation Tests

#### 15.1 Form Validation
- [ ] **TC-VAL-001:** Test required field validation
- [ ] **TC-VAL-002:** Test email format validation
- [ ] **TC-VAL-003:** Test date range validation
- [ ] **TC-VAL-004:** Test numeric input validation
- [ ] **TC-VAL-005:** Test file upload validation (size, type)

#### 15.2 Data Integrity
- [ ] **TC-VAL-006:** Verify scores calculate correctly
- [ ] **TC-VAL-007:** Verify dates are stored correctly
- [ ] **TC-VAL-008:** Verify relationships are maintained (inspection → tickets)
- [ ] **TC-VAL-009:** Verify cascading deletes work correctly

---

## Test Execution Guidelines

### Test Environment
- **Browser:** Chrome (latest), Firefox (latest), Safari (latest), Edge (latest)
- **OS:** Windows 10/11, macOS, Linux
- **Mobile:** iOS Safari, Android Chrome

### Test Data
- Use the seeded data for consistent testing
- Create additional test data as needed for edge cases
- Document any test data created during testing

### Bug Reporting
When reporting bugs, include:
1. **Test Case ID:** (e.g., TC-INS-001)
2. **Description:** Clear description of the issue
3. **Steps to Reproduce:** Detailed steps
4. **Expected Result:** What should happen
5. **Actual Result:** What actually happened
6. **Screenshots:** If applicable
7. **Browser/OS:** Environment details
8. **Priority:** High/Medium/Low

### Test Completion Criteria
- All critical test cases (marked with *) must pass
- 90% of all test cases must pass
- No high-priority bugs should remain open
- All security tests must pass

---

## Test Schedule

### Phase 1: Core Functionality (Week 1)
- Authentication & Authorization
- Dashboard
- Inspection Management
- Ticket Management

### Phase 2: Advanced Features (Week 2)
- Schedule
- Reports
- Location & Template Management
- User Management

### Phase 3: UI/UX & Performance (Week 3)
- Responsive Design
- Loading States
- Error Handling
- Performance Testing

### Phase 4: Security & Integration (Week 4)
- Security Tests
- Integration Tests
- Data Validation
- Final Regression Testing

---

## Notes
- Update this test plan as new features are added
- Mark test cases as Pass/Fail/Blocked/Skipped
- Document any deviations or workarounds
- Keep test data consistent across test runs

---

**Total Test Cases:** 200+  
**Estimated Testing Time:** 4 weeks  
**Test Coverage:** All major features and edge cases
