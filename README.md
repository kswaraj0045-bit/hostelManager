# Hostel Life Manager

A full-stack MERN application for college hostel students to manage expenses, chores, bills, mess menus, and get AI-powered assistance.

## Tech Stack

- **Frontend**: React (Vite), React Router DOM, Axios, Socket.io-client, Tailwind CSS
- **Backend**: Node.js, Express.js, MongoDB (Mongoose), Socket.io, node-cron, JWT, bcryptjs
- **AI**: Google Gemini API
- **Voice**: Web Speech API (browser native)

## Setup

### Prerequisites

- Node.js 18+
- MongoDB (local or MongoDB Compass at `mongodb://localhost:27017/hostelmanager`)
- Google Gemini API key

### Server

```bash
cd server
npm install
```

Create `server/.env`:

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/hostelmanager
JWT_SECRET=hostelmanager_super_secret_key
GEMINI_API_KEY=your_gemini_api_key_here
CLIENT_URL=http://localhost:5173
JWT_EXPIRE=7d
```

```bash
npm run dev
```

### Client

```bash
cd client
npm install
```

Create `client/.env`:

```
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

```bash
npm run dev
```

## Features

- **Auth**: Register, Login with JWT
- **Groups**: Create groups, join via invite code
- **Expenses**: Add expenses with splits, balance calculation, settle up
- **Chores**: Assign chores, mark done/skipped
- **Mess**: Weekly menu, meal voting
- **Bills**: Track bills, mark paid
- **AI Assistant**: Chat with Gemini (context-aware), voice input
- **Real-time**: Socket.io for expense/chore/bill/settlement updates
- **Cron**: Daily 8am chore reminders, Sunday 9am weekly digest

## API Routes

- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `GET/POST /api/groups`, `GET /api/groups/:id`, `POST /api/groups/join`
- `GET/POST /api/expenses`, `GET /api/expenses/balance/:groupId`, `GET /api/expenses/overall-balance`
- `POST /api/settlements`, `GET /api/settlements/:groupId`
- `GET/POST /api/chores`, `PATCH /api/chores/:id`, `DELETE /api/chores/:id`
- `GET/POST /api/mess`, `PATCH /api/mess/:id/vote`
- `GET/POST /api/bills`, `PATCH /api/bills/:id`, `DELETE /api/bills/:id`
- `POST /api/ai/chat`, `GET /api/ai/chat`, `GET /api/ai/digest`
