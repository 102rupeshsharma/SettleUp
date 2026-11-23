# SettleUp

SettleUp is a web app for tracking shared expenses in a group (a flat, a trip, a regular dinner) and working out who should pay whom. It nets everyone's debts against each other so the group can settle with the fewest payments, and it keeps every member's view in sync in real time.

## Contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Scripts](#scripts)
- [How it works](#how-it-works)
- [API reference](#api-reference)
- [Real-time events](#real-time-events)
- [Testing](#testing)
- [Deployment](#deployment)
- [Known limitations](#known-limitations)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

## Features

**Accounts**

- Sign up, sign in and sign out, with a short-lived access token held in memory and a refresh token in an HTTP-only cookie
- Silent session refresh on page load
- Password reset by emailed link
- Email confirmation link sent on signup, with a "resend" option on the dashboard (unconfirmed accounts can still use the app)
- Profile with name, photo URL and a default currency for new groups

**Groups**

- Create a group with a name, description and currency; every amount in the group is recorded in that currency
- Invite people with a 6-character code or a direct link; admins can regenerate the code
- Three roles per group:
  - **Admin**: edit or delete the group, manage members and roles, edit or delete any expense
  - **Member**: add expenses, edit or delete their own
  - **Viewer**: read-only
- A group always keeps at least one admin
- A member cannot leave or be removed while they still owe or are owed money
- Deleting a group also deletes its expenses, payments, notifications and activity

**Expenses**

- Description, amount, category, who paid, and the date the money was spent
- Four ways to split: equally (between everyone or only the people you tick), by exact amounts, by percentage, or by shares (for example 2:1:1)
- Receipt upload (JPG, PNG or PDF, up to 5 MB)
- Search, plus filters for category, who paid, date range and "only ones involving me"
- Each row shows what the expense means for you: "you lent" or "you owe"

**Balances and payments**

- Net position of every member
- Suggested payments that clear all balances with the fewest transfers
- Record a payment against a suggestion (full or partial) or to any member, with the method used (cash, UPI, bank transfer, other)
- Remind someone who owes you, by notification and email (once per 12 hours per person)

**Activity, analytics and exports**

- Activity log per group: expenses added, edited (with old and new amount) and deleted, payments, and member changes
- Spending by category and month by month
- Export a group's expenses as CSV, or a PDF summary with balances, expenses and payments

**Notifications**

- In-app notification list with unread count
- Live toasts when someone else adds an expense or records a payment
- Emails for password reset, email confirmation, payments received and reminders

**Interface**

- Light and dark themes
- Works on phone-sized screens

## Tech stack

| Area | Tools |
| --- | --- |
| Frontend | React 19, Vite 6, React Router 6, Tailwind CSS 4, Recharts, Lucide icons, Axios, Socket.IO client |
| Backend | Node.js, Express 4, Mongoose 8 (MongoDB), Socket.IO, JSON Web Tokens |
| Files and documents | Multer (receipt uploads), PDFKit (PDF export) |
| Email | Nodemailer |
| Security | bcryptjs, helmet, express-rate-limit, express-validator, HTTP-only cookies |
| Tooling | Oxlint (client), Jest and Supertest (server), Nodemon |

## Project structure

```
SettleUp/
├── client/                      React app
│   ├── index.html
│   ├── vercel.json              Rewrites all paths to index.html
│   └── src/
│       ├── api/                 Axios instance with token refresh
│       ├── components/
│       │   ├── balances/        Balance list, suggested payments, payment dialog
│       │   ├── expenses/        Expense list and rows, split editor, receipt upload
│       │   ├── groups/          Create and invite dialogs, members, activity, exports
│       │   ├── layout/          Navbar, footer, theme toggle, auth page frame
│       │   ├── notifications/   Notification bell, toasts
│       │   └── ui/              Avatar, modal, confirm dialog
│       ├── context/             Auth and socket providers
│       ├── hooks/               Currency formatting, group socket, page title
│       ├── pages/               One file per screen
│       └── index.css            Colour tokens and shared component classes
└── server/                      API and socket server
    ├── src/
    │   ├── config/              Environment and database connection
    │   ├── controllers/         Request handlers
    │   ├── middleware/          Auth, group roles, validation, uploads, errors
    │   ├── models/              User, Group, Expense, Settlement, Notification, Activity
    │   ├── routes/              Route definitions
    │   ├── services/            Debt simplifier, balance calculation, activity log
    │   ├── sockets/             Socket.IO server and event emitters
    │   ├── utils/               Tokens, email, money formatting
    │   ├── app.js               Express app
    │   └── server.js            Entry point
    ├── tests/                   Jest tests
    └── uploads/                 Uploaded receipts (not committed)
```

## Getting started

### Prerequisites

- Node.js 18 or newer
- MongoDB, either a local instance or a MongoDB Atlas connection string

### 1. Clone the repository

```bash
git clone https://github.com/102rupeshsharma/SettleUp.git
cd SettleUp
```

### 2. Start the server

```bash
cd server
npm install
cp .env.example .env
```

Edit `server/.env` and set at least `MONGO_URI`, `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` (see [Environment variables](#environment-variables)). Then:

```bash
npm run dev
```

The API runs at `http://localhost:5000/api`. `GET /api/health` returns a status message if it is up.

### 3. Start the client

In a second terminal:

```bash
cd client
npm install --legacy-peer-deps
cp .env.example .env
npm run dev
```

The app runs at `http://localhost:5173`.

`--legacy-peer-deps` is needed because the pinned `lucide-react` version does not list React 19 as a supported peer. Without the flag, `npm install` stops with a dependency conflict.

### 4. Try it

1. Create an account at `/signup`.
2. Create a group and copy its invite code or link.
3. In a private window, create a second account and join with the code.
4. Add an expense as one user and watch it appear for the other.

## Environment variables

### Server (`server/.env`)

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `MONGO_URI` | Yes | none | MongoDB connection string |
| `JWT_ACCESS_SECRET` | Yes | none | Signs access tokens |
| `JWT_REFRESH_SECRET` | Yes | none | Signs refresh tokens |
| `PORT` | No | `5000` | Port the server listens on |
| `NODE_ENV` | No | `development` | Set to `production` when deployed; this makes the refresh cookie `Secure` and `SameSite=None` |
| `FRONTEND_URL` | No | `http://localhost:5173` | Allowed CORS origin, and the base of links in emails |
| `EMAIL_HOST` | No | `smtp.ethereal.email` | SMTP host |
| `EMAIL_PORT` | No | `587` | SMTP port |
| `EMAIL_USER` | No | empty | SMTP username |
| `EMAIL_PASS` | No | empty | SMTP password |
| `EMAIL_FROM` | No | `SettleUp <noreply@settleup.com>` | From address on outgoing mail |

The server exits at startup if any required variable is missing.

**Email in development.** If `EMAIL_USER` or `EMAIL_PASS` is empty, the server creates a temporary [Ethereal](https://ethereal.email/) test account. No real email is delivered; a preview link for each message is printed in the server console. To send real email, set the five `EMAIL_*` variables to your SMTP provider's values.

`JWT_ACCESS_EXPIRY` and `JWT_REFRESH_EXPIRY` appear in `.env.example` but are not read by the code. Token lifetimes are fixed at 15 minutes (access) and 7 days (refresh) in `server/src/utils/generateToken.js`.

### Client (`client/.env`)

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `VITE_API_URL` | No | `http://localhost:5000/api` | Base URL of the API |

The socket connection uses the same value with `/api` removed. `VITE_SOCKET_URL` appears in `.env.example` but is not read by the code.

## Scripts

### Server

| Command | What it does |
| --- | --- |
| `npm run dev` | Start with Nodemon, restarting on changes |
| `npm start` | Start with Node |
| `npm test` | Run the Jest tests |

### Client

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Build for production into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run Oxlint |

## How it works

### Balances

Each member's net position in a group is calculated from that group's expenses and payments:

- Paying for an expense adds the full amount to the payer's balance.
- Each person's share of an expense is subtracted from their balance.
- Recording a payment adds the amount to the payer's balance and subtracts it from the receiver's.

A positive balance means the group owes you; a negative one means you owe the group.

### Debt simplification

Suggested payments come from a greedy algorithm in `server/src/services/debtSimplifier.js`. It repeatedly matches the person who owes the most with the person who is owed the most, and settles the smaller of the two amounts. Who originally paid for whom does not matter, only the net positions.

Example: Alice paid 60 for Bob, and Bob paid 60 for Charlie. Bob's net balance is zero, so the only suggested payment is Charlie paying Alice 60.

### Splits

The server calculates the final share amounts for equal, percentage and shares splits. In each case the last person absorbs the rounding remainder, so the shares always add up to the expense total. An expense is rejected if its shares do not sum to its amount.

### Authentication

- Signing in returns an access token (15 minutes) in the response body and sets a refresh token (7 days) in an HTTP-only cookie.
- The client keeps the access token in memory only and sends it as a bearer token.
- When a request fails with 401, the client calls the refresh endpoint once and retries.
- Passwords are hashed with bcrypt. Reset and confirmation tokens are stored hashed.

## API reference

All paths are prefixed with `/api`. Routes marked with a lock need an `Authorization: Bearer <access token>` header.

### Auth and profile

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| POST | `/auth/signup` | Public | Create an account |
| POST | `/auth/login` | Public | Sign in |
| POST | `/auth/refresh` | Refresh cookie | Get a new access token |
| POST | `/auth/logout` | Public | Clear the refresh cookie |
| POST | `/auth/forgot-password` | Public | Email a password reset link |
| POST | `/auth/reset-password/:token` | Public | Set a new password |
| POST | `/auth/verify-email/:token` | Public | Confirm an email address |
| POST | `/auth/resend-verification` | 🔒 | Send a new confirmation link |
| GET | `/users/me` | 🔒 | Get your profile |
| PUT | `/users/me` | 🔒 | Update name, photo URL or default currency |
| GET | `/users/me/analytics/overview` | 🔒 | Your totals and balance in each group |

### Groups

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| POST | `/groups` | 🔒 | Create a group |
| GET | `/groups` | 🔒 | List your groups |
| POST | `/groups/join/:inviteCode` | 🔒 | Join a group |
| GET | `/groups/:id` | Member | Group details and members |
| PUT | `/groups/:id` | Admin | Update name or description |
| DELETE | `/groups/:id` | Admin | Delete the group and its data |
| POST | `/groups/:id/invite` | Admin | Regenerate the invite code |
| GET | `/groups/:id/activity` | Member | Latest 100 activity entries |
| PUT | `/groups/:id/members/:userId/role` | Admin | Change a member's role |
| DELETE | `/groups/:id/members/:userId` | Member | Leave the group, or remove a member (admin) |

### Expenses

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| POST | `/groups/:id/expenses` | Member, not viewer | Add an expense |
| GET | `/groups/:id/expenses` | Member | List expenses (`category`, `search`, `from`, `to` query filters) |
| PUT | `/expenses/:id` | Creator or admin | Edit an expense |
| DELETE | `/expenses/:id` | Creator or admin | Delete an expense |
| POST | `/expenses/:id/receipt` | Member, not viewer | Upload a receipt (`multipart/form-data`, field `receipt`) |

### Balances and payments

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| GET | `/groups/:id/balances` | Member | Net position of each member |
| GET | `/groups/:id/settlements/suggested` | Member | Suggested payments |
| POST | `/groups/:id/settle` | Member | Record a payment from you to another member |
| GET | `/groups/:id/settlements` | Member | Payment history |
| POST | `/groups/:id/remind/:userId` | Member | Remind someone who owes you |

### Analytics and exports

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| GET | `/groups/:id/analytics/category-breakdown` | Member | Total per category |
| GET | `/groups/:id/analytics/monthly-trend` | Member | Total per month |
| GET | `/groups/:id/export/csv` | Member | Expenses as CSV |
| GET | `/groups/:id/export/pdf` | Member | Summary as PDF |

### Notifications

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| GET | `/notifications` | 🔒 | List notifications (`?unread=true` for unread only) |
| PUT | `/notifications/:id/read` | 🔒 | Mark one as read |
| PUT | `/notifications/read-all` | 🔒 | Mark all as read |

### Other

| Method | Path | Description |
| --- | --- | --- |
| GET | `/health` | Health check |
| GET | `/uploads/:filename` | Uploaded receipt files (not under `/api`) |

Authentication routes are rate limited.

## Real-time events

The client connects with Socket.IO and joins a room per group.

| Direction | Event | Payload |
| --- | --- | --- |
| Client to server | `join-group` | `{ groupId }` |
| Client to server | `leave-group` | `{ groupId }` |
| Server to client | `expense:added` | `{ expense, currency }` |
| Server to client | `expense:updated` | `{ expense, currency }` |
| Server to client | `expense:deleted` | `{ expenseId }` |
| Server to client | `settlement:made` | `{ settlement, currency }` |

## Testing

### Automated

```bash
cd server
npm test
```

The tests cover the signup endpoint and the debt simplifier. They mock the database, but the server config still requires `MONGO_URI`, `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` to be set, either in `server/.env` or in the shell.

The client has one component test file but no test runner installed yet, so it does not run.

### Manual checks

**Password reset**

1. Sign up, sign out, then choose "Forgot password?" on the sign-in page.
2. Open the reset link (in development, from the Ethereal preview link in the server console).
3. Set a new password and sign in with it.

**Roles**

1. User A creates a group and shares the invite code.
2. User B joins with the code.
3. User A changes User B's role to Viewer.
4. Confirm User B no longer sees "Add expense".

**Splits**

1. In a group of three, add an expense of 120 split equally. Each share should be 40.
2. Add an expense of 100 split by percentage as 50, 30 and 20. The shares should be 50, 30 and 20.
3. Add an expense of 100 split by shares as 2, 1 and 1. The shares should be 50, 25 and 25.

**Debt simplification**

1. In a group with Alice, Bob and Charlie, Alice adds an expense of 60 with only Bob in the split.
2. Bob adds an expense of 60 with only Charlie in the split.
3. The Balances tab should suggest a single payment: Charlie pays Alice 60.

**Leaving with a balance**

1. While a member owes money, try to leave the group.
2. The app should refuse and say how much is still owed.

**Real-time sync and exports**

1. Open the same group as two different users in two browsers.
2. Add an expense in one. It should appear in the other without a refresh.
3. Download the CSV and PDF and check they match what is on screen.

## Deployment

The client and server are deployed separately.

**Client.** `client/vercel.json` rewrites every path to `index.html`, so the app can be deployed to Vercel as a static site with `client` as the root directory. Set `VITE_API_URL` to the deployed API URL (ending in `/api`) at build time. Any static host works if it serves `index.html` for unknown paths.

**Server.** Deploy to any Node host that supports long-lived connections (needed for Socket.IO). Set:

- `NODE_ENV=production`
- `FRONTEND_URL` to the exact origin of the deployed client, with no trailing slash
- `MONGO_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
- the `EMAIL_*` variables for a real SMTP provider

The client and API must both be served over HTTPS in production, because the refresh cookie is sent as `Secure` with `SameSite=None`.

## Known limitations

- **Receipts are stored on the server's local disk** in `server/uploads`. On hosts with an ephemeral filesystem they are lost on redeploy. Move them to object storage before relying on them.
- **Groups created before per-group currency was added** are treated as INR.
- **Email confirmation is not enforced.** Unconfirmed accounts have full access.
- **Reminders are not pushed live.** The recipient sees them when they return to the tab or when another event arrives.
- **The activity log starts from when it was added.** Earlier actions are not listed.
- **The expense list is not paginated.** Every expense in a group is loaded at once.
- **`npm install` in the client needs `--legacy-peer-deps`** until `lucide-react` is upgraded.

## Roadmap

- Recurring expenses
- Balances with one person across all groups
- Settings page with change password, photo upload and account deletion
- Google sign-in
- UPI pay link or QR code when settling
- Receipt scanning
- Installable app with offline support
- Expenses in a different currency from the group's
- Comments on expenses
- Archiving settled groups
- Budgets

## Contributing

1. Create a branch from `main`.
2. Make your change. Run `npm run lint` and `npm run build` in `client`, and `npm test` in `server`.
3. Open a pull request describing what changed and how you tested it.

## License

No license has been chosen for this project yet. Until one is added, all rights are reserved by the author.
