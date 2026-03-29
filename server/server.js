import './config/loadEnv.js';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import https from 'https';
import connectDB from './config/db.js';
import { errorHandler } from './middleware/errorMiddleware.js';
import { setupSocket } from './socket/socketHandler.js';
import { setSocketEmitter } from './utils/socketEmitter.js';
import { startReminderJob } from './jobs/reminderJob.js';
import { startDigestJob } from './jobs/digestJob.js';

import authRoutes from './routes/authRoutes.js';
import groupRoutes from './routes/groupRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import settlementRoutes from './routes/settlementRoutes.js';
import choreRoutes from './routes/choreRoutes.js';
import messRoutes from './routes/messRoutes.js';
import billRoutes from './routes/billRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import reminderRoutes from './routes/reminderRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import shoppingRoutes from './routes/shoppingRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import { getPaymentHistory } from './controllers/expenseController.js';

import User from './models/User.js';
import { protect } from './middleware/authMiddleware.js';

connectDB();

const app = express();
const httpServer = createServer(app);

const corsOptions = {
  origin: [
    process.env.CLIENT_URL,
    'https://hostel-manager-five.vercel.app',
    'https://hostel-manager-b6n3zwq5p-kswaraj0045-bits-projects.vercel.app',
    'http://localhost:5173',
    'http://localhost:5174'
  ],
  credentials: true
}

const io = new Server(httpServer, {
  cors: corsOptions
})
app.set('io', io)

const { emitToGroup } = setupSocket(io)
setSocketEmitter(emitToGroup)

app.use(cors(corsOptions))
app.use(express.json())
app.use('/uploads', express.static('uploads'))

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' })
})

app.use('/api/auth', authRoutes)
app.use('/api/groups', groupRoutes)
app.use('/api/expenses', expenseRoutes)
app.use('/api/settlements', settlementRoutes)
app.get('/api/history', protect, getPaymentHistory)
app.use('/api/chores', choreRoutes)
app.use('/api/mess', messRoutes)
app.use('/api/bills', billRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/reminders', reminderRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/shopping', shoppingRoutes)
app.use('/api/analytics', analyticsRoutes)

app.post('/api/push/subscribe', protect, async (req, res) => {
  try {
    const { subscription } = req.body
    await User.findByIdAndUpdate(req.user._id, { pushSubscription: subscription })
    res.json({ success: true, data: { message: 'Subscription saved' } })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

app.get('/api/push/vapid-public-key', (req, res) => {
  res.json({ success: true, data: process.env.VAPID_PUBLIC_KEY || '' })
})

app.use(errorHandler)

startReminderJob()
startDigestJob()

const PORT = process.env.PORT || 5000
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)

  const keepAlive = () => {
    const url = process.env.RENDER_URL || 'https://hostelmanager-nlty.onrender.com'
    https.get(`${url}/api/health`, (res) => {
      console.log(`Keep alive ping: ${res.statusCode}`)
    }).on('error', (err) => {
      console.error('Keep alive error:', err.message)
    })
  }

  setInterval(keepAlive, 14 * 60 * 1000)
  console.log('Keep alive ping started (every 14 minutes)')
})