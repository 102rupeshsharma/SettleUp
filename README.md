# SettleUp - Smart Group Expense Splitter, Simplified

SettleUp is a full-stack, real-time web application designed to track, divide, and optimize group expenses. Using an advanced greedy min-cash-flow graph algorithm, SettleUp simplifies complex debt pools down to a minimum number of direct transactions. The system also supports granular, per-group roles (Admin, Member, Viewer) and updates active users in real time via Socket.io.

---

## 🚀 Tech Stack

### Client (Frontend)
- **Framework**: React (v19) with Vite
- **Styling**: Tailwind CSS (v4)
- **Routing**: React Router DOM (v6)
- **Charts & Visualization**: Recharts (for category breakdown pie charts and monthly trend line charts)
- **Real-time Engine**: Socket.io-client
- **Icons**: Lucide React
- **Linter**: Oxlint

### Server (Backend)
- **Runtime Environment**: Node.js
- **Framework**: Express
- **Database**: MongoDB with Mongoose ODM
- **Real-time Sync**: Socket.io
- **File Uploads**: Multer (stores receipts locally under the `/uploads` directory)
- **PDF Generation**: PDFKit (compiles structured financial report summaries)
- **Email Delivery**: Nodemailer (handles forgotten password token links and settlement alerts)
- **Security & Utilities**:
  - `bcryptjs` (password hashing)
  - `helmet` (essential security headers)
  - `express-rate-limit` (protection on authentication routes)
  - `cookie-parser` (secure cookie-based session management)
- **Testing**: Jest & Supertest

---

## 📋 Feature Breakdown & Implementation Status

Below is the complete registry of features built into SettleUp. Use this checklist to understand what is operational and what remains in progress.

### 🔐 1. Authentication & User Profile
- [x] **User Registration (Signup)**: Create accounts with Name, Email, and Password (minimum 8 characters).
- [x] **User Login**: Standard password validation that issues a short-lived JSON Web Token (JWT) in memory and a long-lived Refresh Token in a secure HTTP-only cookie.
- [x] **Silent Session Refresh**: Automatic background token renewal on page reload/expiration.
- [x] **User Logout**: Clears authentication cookies and tokens safely.
- [x] **Password Reset**:
  - Requests reset emails containing a cryptographically secure token.
  - Updates the password on a dedicated tokenized URL page.
- [x] **User Profile Management**: Edit profile displays (name, avatar image URL, and preferred currency).
- [ ] **OTP / Email Verification**:
  - **Status**: ⚠️ *In Progress / Not Yet Implemented*.
  - **Context**: The database User schema contains an `isVerified` flag, but the OTP verification endpoints, email dispatcher code, and frontend input pages are not yet developed. Users can log in without verification.

### 👥 2. Group Management
- [x] **Create Group**: Initialize groups with a name and optional description. Creator is assigned the `Admin` role.
- [x] **List Groups**: Overview dashboard summarizing all groups the current user belongs to.
- [x] **Group Invite Codes**: Generation and regeneration of 6-character, randomized, unique codes (e.g. `B9D4A1`) for easy group sharing.
- [x] **Join Group**: Access groups instantly by inputting invite codes.
- [x] **Group Details Dashboard**: Dedicated view listing group details, current member balances, expense listings, settlement histories, and role modifications.
- [x] **Granular Group Roles**:
  - `Admin`: Full write control. Can rename/delete the group, regenerate invite codes, adjust other members' roles, eject members, and modify or delete any expense.
  - `Member`: Standard control. Can add expenses, edit/delete their own expenses, and voluntarily leave the group.
  - `Viewer`: Read-only. Accesses dashboards, charts, and balances but cannot add, edit, or delete items.
- [x] **Sole Admin Protection**: System guards prevent a sole group Admin from demoting themselves or leaving/ejecting themselves, requiring them to assign another Admin first.

### 💸 3. Expense Tracking & Splitting
- [x] **Add Expense**: Record expenses with a description, amount, category, payer, and split type.
- [x] **Flexible Split Modes**:
  - `Equal`: Split amount evenly across all members (automatically handles floating-point rounding errors).
  - `Exact`: Manually allocate precise monetary values per user.
  - `Percentage`: Specify percentage shares summing up to 100%.
- [x] **Edit / Delete Expense**: Restricts modifications to either the creator of the expense or a group Admin.
- [x] **Receipt Attachment**: Upload receipt images via Multer, linking files to the transaction.
- [x] **Search & Filter Log**: Search transactions by keyword and filter by category or date range.

### 💰 4. Debt Minimization & Settlements
- [x] **Real-Time Balances Ledger**: Summarizes each member's net position (Credits vs. Debts).
- [x] **Debt Simplification Algorithm**:
  - Uses a **Greedy Min-Cash-Flow solver (O(N log N))** that pairs maximum debtors with maximum creditors.
  - Minimizes the net count of bank transfers to fully settle the group's debts.
- [x] **Settle Up Payments**:
  - Mark payment transactions between users (e.g., cash, UPI, card).
  - Logs the event chronologically.
  - Sends a receipt email to the payee notifying them of the settlement.

### 📊 5. Analytics & Exports
- [x] **Analytics Graphs**:
  - Category breakdown chart (Pie Chart via Recharts).
  - Monthly spending timeline (Bar/Line Chart).
  - Overall user net-worth dashboard.
- [x] **PDF Exports**: Generates and downloads a clean formatted PDF showing member balances, recent expenses, and settlement logs.
- [x] **CSV Exports**: Downloads spreadsheet-friendly logs of all group transactions.

### 🔔 6. Notifications & Real-Time Sync
- [x] **Socket.io Core Sync**: Automatically syncs groups in real-time. When a user adds an expense, edits details, or registers a payment, all other active members see the UI update instantly without refreshing.
- [x] **In-App Notification Ledger**: Logs history of updates with a read/unread counter.
- [x] **Push Toast Alerts**: Instant, floating banners when operations occur in real-time.
- [x] **Email Notifications**: Emails users when a settlement is registered to their name.

---

## 🛠️ Installation & Setup

To run SettleUp locally, set up both the backend and frontend configurations:

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas URI)

### 2. Backend Setup
1. Open a terminal and navigate to the server folder:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `server` directory and configure it:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/settleup
   JWT_ACCESS_SECRET=your_jwt_access_secret_key
   JWT_REFRESH_SECRET=your_jwt_refresh_secret_key
   JWT_ACCESS_EXPIRY=15m
   JWT_REFRESH_EXPIRY=7d
   FRONTEND_URL=http://localhost:5173
   EMAIL_HOST=smtp.ethereal.email
   EMAIL_PORT=587
   EMAIL_USER=your_email_user
   EMAIL_PASS=your_email_password
   NODE_ENV=development
   ```
4. Start the development server (uses `nodemon`):
   ```bash
   npm run dev
   ```

### 3. Frontend Setup
1. Open another terminal and navigate to the client folder:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `client` directory:
   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_SOCKET_URL=http://localhost:5000
   ```
4. Start the Vite development application:
   ```bash
   npm run dev
   ```

---

## 🧪 Testing Guide

This project includes unit and integration tests. Follow the guide below to run automated tests or perform manual QA verification.

### Automated Tests
Navigate to the `server` folder and run:
```bash
npm run test
```
This executes Jest tests covering:
- User signup flow
- Debt solver logic (validates the min-cash-flow algorithm with simple and zeroed balances)

### Manual Testing Scenarios (QA Verification Checklist)

Testers can use the following steps to manually verify the application:

#### Scenario A: Registration & Password Reset
1. Register a new user at `/signup`. Verify successful login.
2. Sign out, go to `/login`, and select "Forgot Password". Enter the email.
3. Check terminal logs (if using Ethereal SMTP) or your inbox for the reset link.
4. Click the link, input a new password at `/reset-password/:token`, and ensure you can log in with the new password.

#### Scenario B: Group Invites & Role Boundaries
1. **User 1 (Admin)**: Create a group. Copy the 6-character Invite Code.
2. **User 2 (Member)**: Sign in, select "Join Group", paste the code, and confirm.
3. **Verification**:
   - Verify User 1 sees User 2 in the member list.
   - User 1 (Admin) should be able to change User 2's role to `viewer`.
   - Verify User 2 (now viewer) cannot add expenses (button should be hidden or operation blocked with a 403 error).

#### Scenario C: Equal & Custom Expense Splits
1. Create an expense of **$120** in a group of 3 members.
2. Select **Equal Split**. Verify that each member's balance screen shows a debit of **$40**.
3. Create another expense of **$100**. Select **Percentage Split**.
   - Input **50%**, **30%**, and **20%** for the members.
   - Verify the ledger updates to **$50**, **$30**, and **$20** respectively.

#### Scenario D: Debt Simplification Verification
1. Set up a group with three members: **Alice**, **Bob**, and **Charlie**.
2. Alice pays **$60** for Bob (equal split: Alice paid $60, Bob owes $60).
3. Bob pays **$60** for Charlie (equal split: Bob paid $60, Charlie owes $60).
4. Go to **Suggested Settlements**.
   - Verify that the algorithm simplifies the debts so **Charlie pays Alice $60** directly.
   - Bob's balance should be $0, and no transaction between Alice & Bob or Bob & Charlie should be suggested.

#### Scenario E: Document Exports & Real-Time Sync
1. Open the app in two different browsers (or one normal tab and one private window). Log in as different users in the same group.
2. Add an expense in Browser A. Verify that Browser B shows the new expense and updated balances **instantly** without page refresh.
3. Click **Export PDF** and **Export CSV**. Verify the downloaded reports contain correct, updated balances and expense descriptions.
