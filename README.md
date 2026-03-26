# Hostel Life Manager

A full-stack MERN application for college hostel students to manage expenses, chores, bills, mess menus, and get AI-powered assistance.

## Live Demo

- **Frontend**: https://hostel-manager-five.vercel.app
- **Backend**: https://hostelmanager-nlty.onrender.com

## Tech Stack

- **Frontend**: React (Vite), React Router DOM, Axios, Socket.io-client, Tailwind CSS
- **Backend**: Node.js, Express.js, MongoDB (Mongoose), Socket.io, node-cron, JWT, bcryptjs
- **AI**: Google Gemini API (gemini-2.5-flash)
- **Voice**: Web Speech API (browser native)
- **SMS**: Twilio
- **Email**: Nodemailer (Gmail SMTP)
- **Push Notifications**: Web Push API

## Setup (Local Development)

### Prerequisites

- Node.js 18+
- MongoDB Compass at `mongodb://localhost:27017`
- Google Gemini API key
- Twilio account (for SMS OTP)
- Gmail account with App Password

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
JWT_EXPIRE=7d
GEMINI_API_KEY=your_gemini_api_key
CLIENT_URL=http://localhost:5173
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_number
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
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

## Deployment

### MongoDB Atlas
- Create free cluster at mongodb.com/atlas
- Add `0.0.0.0/0` to Network Access
- Use Atlas connection string as MONGO_URI

### Backend (Render)
- Connect GitHub repo
- Root Directory: `server`
- Build Command: `npm install`
- Start Command: `node server.js`
- Add all environment variables

### Frontend (Vercel)
- Connect GitHub repo
- Root Directory: `client`
- Framework: Vite
- Add environment variables:
  - `VITE_API_URL` = your Render URL
  - `VITE_SOCKET_URL` = your Render URL

## Features

- **Auth**: Register with email OTP verification, Login, Forgot Password, Phone verification via Twilio
- **Groups**: Create groups (hostel/trip/friends/family), join via invite code, multiple groups support
- **Expenses**: Add expenses with equal or custom splits (Splitwise-style), balance calculation, partial settlements, payment history
- **Chores**: Assign chores, auto rotation, mark done/skipped, daily reminders
- **Mess**: Weekly menu planner, meal voting, laundry rotation tracker
- **Bills**: Track bills (electricity/water/wifi), split equally, mark paid
- **AI Assistant**: Chat with Gemini AI (context-aware), voice input via Web Speech API
- **Calendar**: Visual calendar with chores, bills and custom reminders
- **Analytics**: Monthly spending graphs, category breakdown, group insights
- **Group Chat**: Real-time chat with Socket.io, @mentions, pin messages
- **Shopping List**: Shared list with AI suggestions based on mess menu
- **Push Notifications**: Browser push notifications for reminders
- **Email Notifications**: OTP emails, expense notifications, weekly digest
- **Real-time**: Socket.io for live updates across all group members
- **Weekly Digest**: AI-generated Sunday summary via cron job

## API Routes

### Auth
- `POST /api/auth/register` — Register with email OTP
- `POST /api/auth/login` — Login
- `GET /api/auth/me` — Get current user
- `POST /api/auth/verify-email` — Verify email OTP
- `POST /api/auth/resend-email-otp` — Resend OTP
- `POST /api/auth/forgot-password` — Send reset link
- `POST /api/auth/reset-password` — Reset password
- `POST /api/auth/send-phone-otp` — Send SMS OTP
- `POST /api/auth/verify-phone` — Verify phone OTP
- `POST /api/auth/upload-avatar` — Upload profile photo
- `PATCH /api/auth/update-profile` — Update profile name
- `DELETE /api/auth/delete-account` — Delete account

### Groups
- `GET /api/groups` — Get all groups
- `POST /api/groups` — Create group
- `GET /api/groups/:id` — Get group details
- `POST /api/groups/join` — Join via invite code
- `GET /api/groups/:id/history` — Group payment history (admin)

### Expenses
- `GET /api/expenses/:groupId` — Get expenses
- `POST /api/expenses` — Add expense
- `DELETE /api/expenses/:id` — Delete expense
- `GET /api/expenses/balance/:groupId` — Get balances
- `GET /api/expenses/overall-balance` — Overall balance

### Settlements
- `POST /api/settlements` — Record settlement
- `GET /api/settlements/:groupId` — Get settlements

### Chores
- `GET /api/chores/:groupId` — Get chores
- `POST /api/chores` — Add chore
- `PATCH /api/chores/:id` — Update chore
- `DELETE /api/chores/:id` — Delete chore

### Bills
- `GET /api/bills/:groupId` — Get bills
- `POST /api/bills` — Add bill
- `PATCH /api/bills/:id` — Mark paid
- `DELETE /api/bills/:id` — Delete bill

### AI
- `POST /api/ai/chat` — Chat with AI
- `GET /api/ai/chat` — Get chat history
- `GET /api/ai/digest` — Get weekly digest

### Reminders
- `GET /api/reminders` — Get reminders
- `POST /api/reminders` — Create reminder
- `PATCH /api/reminders/:id` — Update reminder
- `DELETE /api/reminders/:id` — Delete reminder
- `PATCH /api/reminders/:id/snooze` — Snooze reminder

### Other
- `GET /api/history` — Payment history
- `GET /api/analytics/overview` — Analytics overview
- `GET /api/analytics/group/:id` — Group analytics
- `GET /api/chat/:groupId` — Group chat messages
- `POST /api/chat/:groupId` — Send chat message
- `GET /api/shopping/:groupId` — Shopping list
- `POST /api/shopping/:groupId` — Add item
- `GET /api/health` — Health check

## Project Structure

```
hostelManager/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Full page components
│   │   ├── context/        # Global state (Auth, Room, Socket)
│   │   ├── hooks/          # Custom hooks
│   │   ├── services/       # API call functions
│   │   └── utils/          # Helper functions
│   └── public/
│       └── sw.js           # Service worker for push notifications
└── server/                 # Node.js backend
    ├── config/             # DB and AI config
    ├── controllers/        # Business logic
    ├── models/             # Mongoose schemas
    ├── routes/             # Express routes
    ├── middleware/         # Auth and error middleware
    ├── jobs/               # Cron jobs
    ├── socket/             # Socket.io handlers
    └── utils/              # Helper utilities
```

## Environment Variables Summary

| Variable | Description |
|---|---|
| MONGO_URI | MongoDB connection string |
| JWT_SECRET | JWT signing secret |
| GEMINI_API_KEY | Google Gemini API key |
| CLIENT_URL | Frontend URL for CORS |
| EMAIL_USER | Gmail address for sending emails |
| EMAIL_PASS | Gmail App Password |
| TWILIO_ACCOUNT_SID | Twilio Account SID |
| TWILIO_AUTH_TOKEN | Twilio Auth Token |
| TWILIO_PHONE_NUMBER | Twilio phone number |
| VAPID_PUBLIC_KEY | Web Push public key |
| VAPID_PRIVATE_KEY | Web Push private key |
