# Manage App

A full-stack role-based management application built with **React + Node.js/Express + MongoDB**.

## Features

- **Role-Based Access Control**: OWNER, REGIONAL_MANAGER, MANAGER, SALESMAN, TECHNICIAN
- **Hierarchical Approvals**: Owner approves all; RM approves within zone; Manager approves within branch
- **Owner-Manageable Zones & Branches**: Create/edit/delete zones and branches from the Owner dashboard
- **Mobile + Password Login**
- **Static Employee IDs**: Every user gets a unique `EMP#####` ID on registration
- **Forgot/Reset Password**: Token-based (dev-friendly — token returned in response)
- **Customer & Service Records**: With single-click browser geolocation capture
- **Scoped Data Visibility**: Each role sees only what their level permits

---

## Project Structure

```
manage/
├── server/          # Node.js/Express backend
│   ├── src/
│   │   ├── index.js       # App entry point
│   │   ├── seed.js        # Owner seed script
│   │   ├── middleware/    # JWT auth middleware
│   │   ├── models/        # Mongoose models
│   │   ├── routes/        # API route handlers
│   │   └── utils/
│   ├── .env.example
│   └── package.json
└── client/          # React frontend (Vite)
    ├── src/
    │   ├── App.jsx
    │   ├── api.js         # Axios instance
    │   ├── context/       # AuthContext
    │   ├── pages/         # All page components
    │   └── components/    # Shared components
    ├── .env.example
    └── package.json
```

---

## Prerequisites

- **Node.js** v18+
- **MongoDB** v6+ (running locally or a MongoDB Atlas URI)

---

## Setup & Run

### 1. Clone the repository

```bash
git clone https://github.com/vishw4ditya/manage.git
cd manage
```

### 2. Setup the Server

```bash
cd server
cp .env.example .env
# Edit .env — set JWT_SECRET and MONGODB_URI at minimum
npm install
```

**`.env` variables:**

| Variable | Description | Default |
|---|---|---|
| `NODE_ENV` | Environment (`development` / `production`) | `development` |
| `PORT` | Server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/manage` |
| `JWT_SECRET` | Secret key for JWT signing | *(required)* |
| `JWT_EXPIRES_IN` | JWT expiry duration | `7d` |
| `CLIENT_URL` | Frontend URL for CORS | `http://localhost:5173` |
| `OWNER_MOBILE` | Owner mobile for seed script | `9999999999` |
| `OWNER_PASSWORD` | Owner password for seed script | *(required)* |

### 3. Seed the Owner Account

Before anyone can log in, create the initial OWNER account:

```bash
cd server
OWNER_MOBILE=9876543210 OWNER_PASSWORD=MySecret123 npm run seed
```

Or set `OWNER_MOBILE` and `OWNER_PASSWORD` in your `server/.env` file and just run:

```bash
npm run seed
```

The seed script will print the assigned `employeeId` — **save this**, it is used for password reset.

### 4. Start the Server

```bash
cd server
npm run dev        # development (nodemon)
# or
npm start          # production
```

Server starts on `http://localhost:5000`.

### 5. Setup the Client

```bash
cd client
cp .env.example .env
# Edit .env if your server runs on a different URL
npm install
npm run dev
```

Client starts on `http://localhost:5173`.

---

## Roles & Approvals

| Role | Can Approve |
|---|---|
| OWNER | Anyone (all zones/branches) |
| REGIONAL_MANAGER | MANAGER, SALESMAN, TECHNICIAN within their Zone |
| MANAGER | SALESMAN, TECHNICIAN within their Branch |

New registrations start with `PENDING` status. Only `APPROVED` users can log in.  
The first OWNER registered (or created via seed) is auto-approved.

---

## API Overview

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login (mobile + password) |
| POST | `/api/auth/forgot-password` | Request reset token |
| POST | `/api/auth/reset-password` | Reset password with token |
| GET | `/api/users` | List users (scoped by role) |
| GET | `/api/users/pending` | List pending users |
| PATCH | `/api/users/:id/approve` | Approve a user |
| PATCH | `/api/users/:id/reject` | Reject a user |
| GET/POST | `/api/zones` | List / create zones (OWNER) |
| PUT/DELETE | `/api/zones/:id` | Update / delete zone (OWNER) |
| GET/POST | `/api/branches` | List / create branches (OWNER) |
| PUT/DELETE | `/api/branches/:id` | Update / delete branch (OWNER) |
| GET/POST | `/api/customers` | List / create customers |
| GET/POST | `/api/services` | List / create services |

---

## Password Reset Flow (Dev-Friendly)

1. Call `POST /api/auth/forgot-password` with `{ "employeeId": "EMP12345" }`
2. In **development** (`NODE_ENV !== production`), the response includes `resetToken`
3. Call `POST /api/auth/reset-password` with `{ "employeeId": "EMP12345", "token": "<token>", "newPassword": "newPass123" }`

> **Production note**: Wire the `rawToken` to an SMS/email provider in `server/src/routes/auth.js` before going live.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router v6, Axios |
| Backend | Node.js, Express 4, Mongoose 8 |
| Database | MongoDB (with 2dsphere index for geolocation) |
| Auth | JWT, bcryptjs |
| Validation | Zod |
| Rate Limiting | express-rate-limit |
