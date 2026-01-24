# Use Cases - Financial Management System

## 1. User Authentication & Authorization

### UC-1.1: User Registration
**Actor:** New User  
**Precondition:** User is not registered in the system  
**Main Flow:**
1. User navigates to registration page
2. User enters email, password, name, and role
3. System validates input data
4. System creates new user account
5. System sends confirmation email
6. User is redirected to login page

**Postcondition:** User account is created and can log in

---

### UC-1.2: User Login
**Actor:** Registered User  
**Precondition:** User has valid credentials  
**Main Flow:**
1. User navigates to login page
2. User enters email and password
3. System validates credentials
4. System generates JWT token
5. User is redirected to dashboard based on role

**Alternative Flow:**
- 3a. Invalid credentials: System displays "Login Failed" message
- 3b. Account locked: System displays account locked message

**Postcondition:** User is authenticated and has access to role-specific features

---

### UC-1.3: Two-Factor Authentication (2FA)
**Actor:** User with 2FA enabled  
**Precondition:** User has completed primary authentication  
**Main Flow:**
1. System prompts for 2FA code
2. User enters authentication code
3. System validates 2FA code
4. User gains access to system

**Postcondition:** User is fully authenticated with 2FA verification

---

### UC-1.4: Password Reset
**Actor:** User who forgot password  
**Precondition:** User has registered email  
**Main Flow:**
1. User clicks "Forgot Password" link
2. User enters registered email
3. System sends password reset link
4. User clicks link in email
5. User enters new password
6. System updates password

**Postcondition:** User password is updated and can log in with new password

---

## 2. Dashboard & Overview

### UC-2.1: View Dashboard
**Actor:** Authenticated User (All Roles)  
**Precondition:** User is logged in  
**Main Flow:**
1. User logs in successfully
2. System displays role-specific dashboard
3. Dashboard shows:
   - Financial summaries (revenue, expenses, profit)
   - Recent activity
   - Key metrics and KPIs
   - Quick action buttons
   - Notifications

**Role-Specific Views:**
- **Super Admin/Admin:** Full system overview with all data
- **Finance Admin:** Own data + subordinates (accountants and employees)
- **Accountant:** Own data + employees' sales from their Finance Admin's team
- **Employee:** Own data + items created by Finance Admin

**Postcondition:** User sees personalized dashboard

---

### UC-2.2: View Recent Activity
**Actor:** Authenticated User  
**Precondition:** User is on dashboard  
**Main Flow:**
1. User views recent activity section
2. System displays recent transactions, approvals, and activities
3. User can filter by date range or activity type

**Postcondition:** User sees recent system activities relevant to their role

---

## 3. Revenue Management

### UC-3.1: Create Revenue Entry
**Actor:** Finance Admin, Accountant, Employee  
**Precondition:** User has revenue creation permissions  
**Main Flow:**
1. User navigates to Revenue section
2. User clicks "Create Revenue"
3. User enters revenue details:
   - Amount
   - Description
   - Category
   - Date
   - Department (optional)
   - Project (optional)
4. System validates input
5. System creates revenue entry with "Pending" status
6. System sends notification to approvers

**Postcondition:** Revenue entry is created and awaiting approval

---

### UC-3.2: View Revenue List
**Actor:** Authenticated User  
**Precondition:** User is logged in  
**Main Flow:**
1. User navigates to Revenue section
2. System displays revenue entries based on RBAC:
   - Admin: All revenue
   - Finance Admin: Own + subordinates' revenue
   - Accountant: Own + employees' revenue from their team
   - Employee: Own revenue only
3. User can filter, search, and sort revenue entries

**Postcondition:** User views relevant revenue entries

---

### UC-3.3: Edit Revenue Entry
**Actor:** Entry Creator or Admin  
**Precondition:** Revenue entry exists and is editable  
**Main Flow:**
1. User selects revenue entry
2. User clicks "Edit"
3. User modifies revenue details
4. System validates changes
5. System updates revenue entry
6. If approved, status resets to "Pending"

**Postcondition:** Revenue entry is updated

---

### UC-3.4: Delete Revenue Entry
**Actor:** Entry Creator or Admin  
**Precondition:** Revenue entry exists  
**Main Flow:**
1. User selects revenue entry
2. User clicks "Delete"
3. System prompts for confirmation
4. User confirms deletion
5. System deletes revenue entry

**Postcondition:** Revenue entry is removed from system

---

## 4. Expense Management

### UC-4.1: Create Expense Entry
**Actor:** Finance Admin, Accountant, Employee  
**Precondition:** User has expense creation permissions  
**Main Flow:**
1. User navigates to Expenses section
2. User clicks "Create Expense"
3. User enters expense details:
   - Amount
   - Description
   - Category
   - Date
   - Department (optional)
   - Project (optional)
   - Receipt/attachment (optional)
4. System validates input
5. System creates expense entry with "Pending" status
6. System sends notification to approvers

**Postcondition:** Expense entry is created and awaiting approval

---

### UC-4.2: View Expense List
**Actor:** Authenticated User  
**Precondition:** User is logged in  
**Main Flow:**
1. User navigates to Expenses section
2. System displays expense entries based on RBAC
3. User can filter, search, and sort expenses

**Postcondition:** User views relevant expense entries

---

### UC-4.3: Attach Receipt to Expense
**Actor:** Expense Creator  
**Precondition:** Expense entry exists  
**Main Flow:**
1. User selects expense entry
2. User clicks "Add Receipt"
3. User uploads receipt image/PDF
4. System validates file format and size
5. System attaches receipt to expense

**Postcondition:** Receipt is linked to expense entry

---

## 5. Approval Workflow

### UC-5.1: Approve Revenue/Expense
**Actor:** Admin, Finance Manager  
**Precondition:** User has approval permissions  
**Main Flow:**
1. User navigates to Approvals section
2. System displays pending approvals
3. User selects entry to review
4. User views entry details
5. User clicks "Approve"
6. System updates entry status to "Approved"
7. System sends notification to entry creator

**Postcondition:** Entry is approved and reflected in financial reports

---

### UC-5.2: Reject Revenue/Expense
**Actor:** Admin, Finance Manager  
**Precondition:** User has approval permissions  
**Main Flow:**
1. User navigates to Approvals section
2. User selects entry to review
3. User clicks "Reject"
4. User enters rejection reason
5. System updates entry status to "Rejected"
6. System sends notification to entry creator with reason

**Postcondition:** Entry is rejected and creator is notified

---

### UC-5.3: Request Additional Information
**Actor:** Approver  
**Precondition:** Entry is pending approval  
**Main Flow:**
1. User reviews pending entry
2. User clicks "Request Information"
3. User enters information request
4. System sends notification to entry creator
5. Entry status remains "Pending"

**Postcondition:** Creator receives request for additional information

---

## 6. Budget Management

### UC-6.1: Create Budget
**Actor:** Admin, Finance Manager  
**Precondition:** User has budget creation permissions  
**Main Flow:**
1. User navigates to Budgets section
2. User clicks "Create Budget"
3. User enters budget metadata:
   - Name
   - Period (start and end dates)
   - Department (optional)
   - Project (optional)
4. User adds budget items:
   - Category
   - Type (Revenue/Expense)
   - Amount
5. System validates input
6. System creates budget with "Draft" status

**Postcondition:** Budget is created in draft status

---

### UC-6.2: View Budget Dashboard
**Actor:** Authenticated User  
**Precondition:** User has budget view permissions  
**Main Flow:**
1. User navigates to Budget Dashboard
2. System displays:
   - All accessible budgets
   - Budget status (Draft, Approved, Active, Archived)
   - Financial health summaries (Revenue vs. Expenses vs. Profit)
   - Real-time actuals vs. budget comparison
3. User can filter and sort budgets

**Postcondition:** User views budget overview

---

### UC-6.3: Edit Budget Items
**Actor:** Budget Creator or Admin  
**Precondition:** Budget exists and is editable  
**Main Flow:**
1. User selects budget
2. User clicks "Edit Items"
3. User adds, modifies, or removes budget items
4. System recalculates budget totals
5. System saves changes

**Postcondition:** Budget items are updated

---

### UC-6.4: Approve Budget
**Actor:** Admin, Finance Manager  
**Precondition:** Budget is in "Draft" status  
**Main Flow:**
1. User selects draft budget
2. User reviews budget details and items
3. User clicks "Approve"
4. System updates budget status to "Approved"
5. Budget becomes active and trackable

**Postcondition:** Budget is approved and active

---

### UC-6.5: Archive Budget
**Actor:** Admin, Finance Manager  
**Precondition:** Budget period has ended  
**Main Flow:**
1. User selects completed budget
2. User clicks "Archive"
3. System updates status to "Archived"
4. Budget is moved to archived section

**Postcondition:** Budget is archived for historical reference

---

## 7. Scenario Analysis & Forecasting

### UC-7.1: Create Scenario
**Actor:** Admin, Finance Manager  
**Precondition:** User has scenario creation permissions  
**Main Flow:**
1. User navigates to Scenarios section
2. User clicks "Create Scenario"
3. User enters scenario details:
   - Name
   - Description
   - Base budget (optional)
   - Assumptions
4. User adds scenario items with projections
5. System saves scenario

**Postcondition:** Scenario is created for analysis

---

### UC-7.2: Compare Scenarios
**Actor:** Admin, Finance Manager  
**Precondition:** Multiple scenarios exist  
**Main Flow:**
1. User navigates to Scenario Analysis
2. User selects scenarios to compare (up to 3)
3. System displays comparison view:
   - Side-by-side metrics
   - Variance analysis
   - Charts and visualizations
4. User can adjust scenarios in real-time

**Postcondition:** User views scenario comparisons

---

### UC-7.3: Generate Forecast
**Actor:** Admin, Finance Manager  
**Precondition:** Historical data exists  
**Main Flow:**
1. User navigates to Forecast section
2. User selects forecast parameters:
   - Time period
   - Categories
   - Forecasting method (ML, linear, etc.)
3. System generates forecast using historical data
4. System displays forecast with confidence intervals
5. User can save or export forecast

**Postcondition:** Forecast is generated and available

---

## 8. Project Management

### UC-8.1: Create Project
**Actor:** Admin, Finance Manager  
**Precondition:** User has project creation permissions  
**Main Flow:**
1. User navigates to Projects section
2. User clicks "Create Project"
3. User enters project details:
   - Project name
   - Description
   - Start/end dates
   - Budget allocation
   - Department
   - Project manager
4. System validates input
5. System creates project

**Postcondition:** Project is created and can be linked to revenue/expenses

---

### UC-8.2: View Project Financial Summary
**Actor:** Authenticated User  
**Precondition:** Projects exist  
**Main Flow:**
1. User navigates to Projects section
2. User selects a project
3. System displays:
   - Total revenue
   - Total expenses
   - Profit/loss
   - Budget vs. actual
   - Timeline
4. User views associated transactions

**Postcondition:** User sees project financial overview

---

### UC-8.3: Link Transactions to Project
**Actor:** Transaction Creator  
**Precondition:** Project and transaction exist  
**Main Flow:**
1. User creates or edits revenue/expense
2. User selects project from dropdown
3. System links transaction to project
4. Project financials are automatically updated

**Postcondition:** Transaction is associated with project

---

## 9. Department Management

### UC-9.1: Create Department
**Actor:** Admin  
**Precondition:** User is Admin  
**Main Flow:**
1. User navigates to Departments section
2. User clicks "Create Department"
3. User enters department details:
   - Name
   - Description
   - Department head
   - Budget allocation
4. System creates department

**Postcondition:** Department is created

---

### UC-9.2: View Department Financial Summary
**Actor:** Admin, Finance Manager, Department Head  
**Precondition:** Department exists  
**Main Flow:**
1. User navigates to Departments section
2. User selects department
3. System displays:
   - Total revenue
   - Total expenses
   - Budget vs. actual
   - Department staff
   - Associated projects

**Postcondition:** User views department financials

---

## 10. Inventory Management

### UC-10.1: Create Inventory Item
**Actor:** Admin, Finance Admin, Accountant  
**Precondition:** User has inventory permissions  
**Main Flow:**
1. User navigates to Inventory section
2. User clicks "Add Item"
3. User enters item details:
   - Item name
   - Description
   - Unit cost
   - Quantity
   - Category
4. System calculates total cost (unit cost × quantity)
5. System creates inventory item

**Postcondition:** Inventory item is added to system

---

### UC-10.2: Update Inventory Quantity
**Actor:** Admin, Finance Admin, Accountant  
**Precondition:** Inventory item exists  
**Main Flow:**
1. User selects inventory item
2. User updates quantity
3. System recalculates total inventory cost
4. System logs inventory change

**Postcondition:** Inventory quantity is updated

---

### UC-10.3: View Total Inventory Cost
**Actor:** Authenticated User  
**Precondition:** Inventory items exist  
**Main Flow:**
1. User navigates to Inventory section
2. System displays inventory list with:
   - Item name, unit cost, quantity
   - Amount (unit cost × quantity) per item
   - Total Inventory Cost (sum of all amounts)
3. User can filter and search items

**Postcondition:** User views inventory with accurate cost calculations

---

## 11. Sales Tracking

### UC-11.1: Record Sale (Employee)
**Actor:** Employee  
**Precondition:** Employee has sales recording permissions  
**Main Flow:**
1. Employee navigates to Sales section
2. Employee clicks "Record Sale"
3. Employee enters sale details:
   - Customer information
   - Products/services sold
   - Sale amount
   - Date
4. System creates sale record
5. Accountant is notified for processing

**Postcondition:** Sale is recorded and pending accounting

---

### UC-11.2: Process Sale (Accountant)
**Actor:** Accountant  
**Precondition:** Sale exists and is pending  
**Main Flow:**
1. Accountant views pending sales
2. Accountant selects sale
3. Accountant reviews sale details
4. Accountant processes accounting entries
5. System updates sale status to "Processed"

**Postcondition:** Sale is processed and reflected in financials

---

### UC-11.3: View Sales Analytics
**Actor:** Admin, Finance Admin, Accountant  
**Precondition:** Sales data exists  
**Main Flow:**
1. User navigates to Sales Analytics
2. System displays:
   - Total sales by period
   - Sales by employee
   - Sales by category
   - Trends and charts
3. User can filter by date range, employee, category

**Postcondition:** User views sales analytics

---

## 12. User Management

### UC-12.1: Create User (Admin)
**Actor:** Admin, Super Admin  
**Precondition:** User is Admin  
**Main Flow:**
1. Admin navigates to Users section
2. Admin clicks "Add User"
3. Admin enters user details:
   - Name, email, password
   - Role (Super Admin, Admin, Finance Manager, Accountant, Employee)
   - Department
   - Manager/supervisor
4. System validates input
5. System creates user account
6. System sends welcome email

**Postcondition:** New user is created and can log in

---

### UC-12.2: Assign User Role
**Actor:** Admin  
**Precondition:** User exists  
**Main Flow:**
1. Admin selects user
2. Admin clicks "Change Role"
3. Admin selects new role
4. System validates role hierarchy
5. System updates user role
6. User permissions are automatically adjusted

**Postcondition:** User role is updated

---

### UC-12.3: View User Hierarchy
**Actor:** Admin, Finance Manager  
**Precondition:** Users exist with hierarchy  
**Main Flow:**
1. User navigates to Users section
2. System displays organizational hierarchy:
   - Super Admin → Admin → Finance Manager → Accountant → Employee
3. User can view subordinates and supervisors

**Postcondition:** User views organizational structure

---

### UC-12.4: Deactivate User
**Actor:** Admin  
**Precondition:** User exists and is active  
**Main Flow:**
1. Admin selects user
2. Admin clicks "Deactivate"
3. System prompts for confirmation
4. Admin confirms
5. System deactivates user account
6. User can no longer log in

**Postcondition:** User account is deactivated

---

## 13. Notifications

### UC-13.1: View Notifications
**Actor:** Authenticated User  
**Precondition:** User is logged in  
**Main Flow:**
1. User clicks notification bell icon
2. System displays notifications panel with:
   - Pending approvals
   - Status updates
   - System alerts
   - Role-specific notifications
3. User can mark notifications as read

**Postcondition:** User views notifications

---

### UC-13.2: Receive Real-Time Notification
**Actor:** Authenticated User  
**Precondition:** User is logged in  
**Main Flow:**
1. System event occurs (e.g., approval needed, status change)
2. System sends notification to relevant users
3. User receives notification in real-time
4. Notification appears in notification panel
5. User can click notification to view details

**Postcondition:** User is notified of relevant events

---

### UC-13.3: Configure Notification Preferences
**Actor:** Authenticated User  
**Precondition:** User is logged in  
**Main Flow:**
1. User navigates to Settings
2. User selects Notification Preferences
3. User configures:
   - Email notifications (on/off)
   - In-app notifications (on/off)
   - Notification categories
4. System saves preferences

**Postcondition:** User notification preferences are updated

---

## 14. Analytics & Reporting

### UC-14.1: View Financial Analytics
**Actor:** Admin, Finance Manager  
**Precondition:** Financial data exists  
**Main Flow:**
1. User navigates to Analytics section
2. System displays:
   - Revenue trends
   - Expense trends
   - Profit margins
   - Budget variance
   - Department performance
   - Project ROI
3. User can customize charts and date ranges

**Postcondition:** User views financial analytics

---

### UC-14.2: Generate Financial Report
**Actor:** Admin, Finance Manager  
**Precondition:** Financial data exists  
**Main Flow:**
1. User navigates to Reports section
2. User selects report type:
   - Income statement
   - Budget vs. actual
   - Department summary
   - Project summary
3. User selects date range and filters
4. System generates report
5. User can export to PDF/Excel

**Postcondition:** Financial report is generated

---

### UC-14.3: View Variance Analysis
**Actor:** Admin, Finance Manager  
**Precondition:** Budget and actuals exist  
**Main Flow:**
1. User navigates to Variance Analysis
2. System displays:
   - Budget vs. actual comparison
   - Variance amounts and percentages
   - Variance trends over time
   - Category-wise variance
3. User can drill down into specific variances

**Postcondition:** User views variance analysis

---

## 15. Search & Filtering

### UC-15.1: Global Search
**Actor:** Authenticated User  
**Precondition:** User is logged in  
**Main Flow:**
1. User enters search term in global search bar
2. System searches across:
   - Users
   - Revenue entries
   - Expense entries
   - Projects
   - Departments
3. System applies RBAC filtering
4. System displays search results
5. User can click result to view details

**Postcondition:** User finds relevant information

---

### UC-15.2: Advanced Filtering
**Actor:** Authenticated User  
**Precondition:** User is viewing a list (revenue, expenses, etc.)  
**Main Flow:**
1. User clicks "Filter" button
2. User selects filter criteria:
   - Date range
   - Amount range
   - Category
   - Status
   - Department
   - Project
3. System applies filters
4. System displays filtered results

**Postcondition:** User views filtered data

---

## 16. Profile Management

### UC-16.1: View Profile
**Actor:** Authenticated User  
**Precondition:** User is logged in  
**Main Flow:**
1. User navigates to Profile section
2. System displays user information:
   - Name, email, role
   - Department
   - Bio
   - Address
   - Profile picture
3. User can view activity history

**Postcondition:** User views their profile

---

### UC-16.2: Edit Profile
**Actor:** Authenticated User  
**Precondition:** User is logged in  
**Main Flow:**
1. User navigates to Profile section
2. User clicks "Edit Profile"
3. User updates:
   - Name
   - Bio
   - Address
   - Profile picture
4. System validates input
5. System saves changes

**Postcondition:** User profile is updated

---

### UC-16.3: Change Password
**Actor:** Authenticated User  
**Precondition:** User is logged in  
**Main Flow:**
1. User navigates to Profile/Settings
2. User clicks "Change Password"
3. User enters:
   - Current password
   - New password
   - Confirm new password
4. System validates current password
5. System validates password strength
6. System updates password

**Postcondition:** User password is changed

---

## 17. Settings & Permissions

### UC-17.1: Configure System Settings
**Actor:** Admin  
**Precondition:** User is Admin  
**Main Flow:**
1. Admin navigates to Settings section
2. Admin configures:
   - General settings
   - Email settings (SMTP)
   - Security settings (2FA, IP restrictions)
   - Approval workflow settings
   - Notification settings
3. System validates and saves settings

**Postcondition:** System settings are updated

---

### UC-17.2: Manage Role Permissions
**Actor:** Super Admin  
**Precondition:** User is Super Admin  
**Main Flow:**
1. Super Admin navigates to Permissions section
2. Super Admin selects role
3. Super Admin configures permissions:
   - View, create, edit, delete for each module
   - Approval permissions
   - User management permissions
4. System saves permission changes

**Postcondition:** Role permissions are updated

---

### UC-17.3: View Audit Log
**Actor:** Admin  
**Precondition:** User is Admin  
**Main Flow:**
1. Admin navigates to Audit Log
2. System displays:
   - User actions
   - Timestamp
   - IP address
   - Action type
   - Affected resources
3. Admin can filter by user, date, action type

**Postcondition:** Admin views system audit log

---

## 18. Contact & Support

### UC-18.1: Submit Contact Form
**Actor:** Any User (Public or Authenticated)  
**Precondition:** None  
**Main Flow:**
1. User navigates to Contact page
2. User enters:
   - Name
   - Email
   - Subject
   - Message
3. User submits form
4. System validates input
5. System sends email to support team
6. System displays confirmation message

**Postcondition:** Contact request is sent to support

---

## 19. Mobile Application

### UC-19.1: Mobile Login
**Actor:** Mobile App User  
**Precondition:** User has app installed  
**Main Flow:**
1. User opens mobile app
2. User enters credentials
3. System validates and authenticates
4. User is redirected to mobile dashboard

**Postcondition:** User is logged into mobile app

---

### UC-19.2: View Dashboard on Mobile
**Actor:** Mobile App User  
**Precondition:** User is logged in  
**Main Flow:**
1. User views mobile dashboard
2. System displays:
   - Key financial metrics
   - Recent activity
   - Quick actions
3. UI is optimized for mobile devices

**Postcondition:** User views mobile-optimized dashboard

---

### UC-19.3: Record Transaction on Mobile
**Actor:** Mobile App User  
**Precondition:** User is logged in  
**Main Flow:**
1. User clicks "Add Transaction" button
2. User selects transaction type (revenue/expense)
3. User enters transaction details
4. User can capture receipt using camera
5. System creates transaction
6. System syncs with backend

**Postcondition:** Transaction is created via mobile app

---

## 20. Machine Learning & Predictions

### UC-20.1: Train ML Model
**Actor:** Admin, Finance Manager  
**Precondition:** Sufficient historical data exists  
**Main Flow:**
1. User navigates to ML Training section
2. User selects model type (forecasting, anomaly detection, etc.)
3. User configures training parameters
4. System trains model using historical data
5. System displays model performance metrics
6. User can save trained model

**Postcondition:** ML model is trained and ready for predictions

---

### UC-20.2: View ML-Based Predictions
**Actor:** Admin, Finance Manager  
**Precondition:** ML model is trained  
**Main Flow:**
1. User navigates to Forecasting section
2. System displays ML-based predictions:
   - Revenue forecasts
   - Expense forecasts
   - Anomaly alerts
   - Confidence intervals
3. User can adjust prediction parameters

**Postcondition:** User views ML predictions

---

## Summary of User Roles

### Super Admin
- Full system access
- User and role management
- System configuration
- All CRUD operations across all modules

### Admin
- Full access to all data
- User management
- Department and project management
- Approvals and budget management

### Finance Manager (Finance Admin)
- Access to own data + subordinates (accountants and employees)
- Budget creation and management
- Scenario analysis and forecasting
- Approval permissions

### Accountant
- Access to own data + employees' sales from their Finance Admin's team
- Process sales
- Create and manage revenue/expenses
- Inventory management

### Employee
- Access to own data + items created by Finance Admin
- Record sales
- Create revenue/expenses (subject to approval)
- View own profile and notifications

---

## RBAC Summary

The system implements strict Role-Based Access Control (RBAC) across all endpoints and UI components:

1. **Data Visibility:** Users only see data they are authorized to access based on their role and position in the organizational hierarchy
2. **Action Permissions:** Users can only perform actions (create, edit, delete, approve) that their role permits
3. **Approval Workflow:** Revenue and expense entries require approval from users with appropriate permissions
4. **Hierarchical Access:** Higher-level roles (Admin, Finance Manager) can view and manage data for their subordinates

---

*This use case document covers the core functionality of the Financial Management System. Each use case can be extended with additional alternative flows, error handling, and business rules as needed.*