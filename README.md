# WasteZero — Smart Waste Pickup & Recycling Platform

A full-stack web application connecting citizens who need waste picked up with volunteers who collect it, plus an admin panel for managing opportunities, users, and reports.

## Tech Stack
- **Frontend:** Angular 17 + Angular Material
- **Backend:** Node.js + Express
- **Database:** MongoDB (Mongoose)
- **Real-time:** Socket.io (in-app messaging)
- **Auth:** JWT-based authentication with role-based access control (user / volunteer / admin)

## Project Structure
```
wastezero/
├── wastezero-backend/      # Express REST API
│   ├── models/              # Mongoose schemas
│   ├── controllers/         # Route handlers / business logic
│   ├── routes/               # Express routers
│   ├── middleware/          # Auth & role guards
│   ├── server.js             # App entry point + Socket.io
│   └── .env                  # Environment variables
│
└── wastezero-frontend/      # Angular SPA
    └── src/app/
        ├── components/        # Login, Register, Dashboard, Pickup, Opportunities, Messages, Profile, Admin
        ├── services/           # Auth, API, interceptor
        ├── guards/             # Route guards (auth + role)
        └── models/
```

## Getting Started

### 1. Backend Setup
```bash
cd wastezero-backend
npm install
# Make sure MongoDB is running locally (or update MONGO_URI in .env to point to Atlas)
npm run dev    # starts on http://localhost:5000
```

### 2. Frontend Setup
```bash
cd wastezero-frontend
npm install
npm start      # starts on http://localhost:4200
```

The frontend is pre-configured to call the backend at `http://localhost:5000/api` (see `src/environments/environment.ts`).

### 3. Running Backend Tests
```bash
cd wastezero-backend
npm install
npm test
```
Tests use `mongodb-memory-server` to spin up an isolated in-memory MongoDB instance — no real database connection or `.env` values are needed to run them. They cover: registration/login (incl. password hashing, suspended accounts), opportunity CRUD with ownership enforcement, the full pickup lifecycle (open → accepted → completed), application workflows (duplicate prevention, role checks, accept/reject), real-time messaging + notification triggers, and admin stats/reports/logs.

**Note:** this test suite was written but could not be executed in the environment used to build this project (no network access to `npm install` dependencies). It has been verified for syntax correctness only (`node --check` on every file). Run `npm test` yourself after `npm install` to get a real pass/fail signal, and treat any failures as expected first-pass bugs to fix rather than a sign the whole approach is wrong.

## Core Features

### Citizens (role: user)
- Register/login
- Schedule a waste pickup request (type, quantity, address, date/time)
- Track status of requests (open → accepted → completed)
- "My Impact" dashboard card: completed pickups broken down by waste category
- Message assigned volunteers
- Edit profile

### Volunteers (role: volunteer)
- View open pickup requests and accept them
- View/apply to NGO-style "opportunities" matched to their skills/location
- Get notified when a new opportunity matching their skills/location is created
- Mark pickups as completed
- Message citizens/admins
- Maintain a skills profile for better matching

### Admins (role: admin)
- Dashboard with platform-wide stats
- Create/edit (dedicated pre-filled Edit page)/delete (soft-delete) opportunities
- Review and accept/reject volunteer applications
- View and suspend/activate user accounts (logged to AdminLogs)
- View all pickup requests across the platform
- Reports: users, pickups, waste-by-category, and volunteers (incl. completed pickups per volunteer)
- Export reports as CSV or PDF (PDF generated client-side via jsPDF)
- View admin action logs (audit trail)

## API Overview
All endpoints are prefixed with `/api` and (except register/login) require a `Authorization: Bearer <token>` header.

| Resource | Routes |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` |
| Pickups | `POST /pickups`, `GET /pickups/my`, `GET /pickups/my-impact`, `GET /pickups/open`, `GET /pickups/assigned`, `PUT /pickups/:id/accept`, `PUT /pickups/:id/complete` |
| Opportunities | `GET /opportunities`, `GET /opportunities/:id`, `GET /opportunities/match`, `POST /opportunities`, `PUT /opportunities/:id`, `DELETE /opportunities/:id` |
| Applications | `POST /applications`, `GET /applications/my`, `GET /applications/opportunity/:id`, `PUT /applications/:id` |
| Messages | `POST /messages`, `GET /messages/contacts`, `GET /messages/:userId` |
| Notifications | `GET /notifications`, `PUT /notifications/:id/read` |
| Admin | `GET /admin/stats`, `GET /admin/users`, `PUT /admin/users/:id/suspend`, `GET /admin/reports/users`, `GET /admin/reports/pickups`, `GET /admin/reports/waste`, `GET /admin/reports/volunteers`, `GET /admin/logs`, `GET /admin/pickups` |

## Architecture Notes
- `app.js` defines the Express app (routes, middleware) with no side effects. `server.js` wraps it with the MongoDB connection, Socket.io, and `.listen()`. This split lets the test suite import `app.js` directly against an in-memory database without needing a running server or real Mongo instance.
- `middleware/ownershipMiddleware.js` verifies that the authenticated admin is the creator (`ngo_id`) of an opportunity before allowing edit/delete — loaded once and attached to `req.opportunity` so controllers don't re-fetch it.
- Opportunity creation fans out a `Notification` to every volunteer whose `skills` or `location` matches the new opportunity (best-effort regex/array match, not a full geo solution).

## Notes
- This is a working boilerplate built from the project specification document. It implements the full data model, auth flow, and all four milestones (auth & roles, pickup scheduling, opportunities/volunteering, admin/reporting + messaging) plus a backend test suite.
- `npm install` is required in both folders before running — `node_modules` are not included in the zip.
- Update `wastezero-backend/.env` with your own `MONGO_URI` and `JWT_SECRET` before deploying.
- For production, update `src/environments/environment.prod.ts` with your deployed API URL.
- Not included: actual deployment configuration (Vercel/Render/etc.) and a frontend test suite — the spec's testing section is interpreted here as backend integration tests; Angular component/unit tests were not added.
