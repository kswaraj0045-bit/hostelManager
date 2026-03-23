import './config/loadEnv.js';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
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

const configuredClientOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173'
].filter(Boolean);

const isPrivateDevHost = (hostname) => {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    /^10\./.test(hostname) ||
    /^192\.168\./.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)
  );
};

const isAllowedOrigin = (origin) => {
  if (!origin || configuredClientOrigins.includes(origin)) return true;
  if (process.env.NODE_ENV === 'production') return false;

  try {
    const { protocol, hostname } = new URL(origin);
    return (protocol === 'http:' || protocol === 'https:') && isPrivateDevHost(hostname);
  } catch {
    return false;
  }
};

const corsOptions = {
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) return callback(null, true);
    return callback(new Error(`Origin ${origin} is not allowed by CORS`));
  }
};

const io = new Server(httpServer, {
  cors: corsOptions
});
app.set('io', io);

const { emitToGroup } = setupSocket(io);
setSocketEmitter(emitToGroup);

app.use(cors(corsOptions));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/settlements', settlementRoutes);
app.get('/api/history', protect, getPaymentHistory);
app.use('/api/chores', choreRoutes);
app.use('/api/mess', messRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/shopping', shoppingRoutes);
app.use('/api/analytics', analyticsRoutes);

// Push subscription routes
app.post('/api/push/subscribe', protect, async (req, res) => {
  try {
    const { subscription } = req.body;
    await User.findByIdAndUpdate(req.user._id, { pushSubscription: subscription });
    res.json({ success: true, data: { message: 'Subscription saved' } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/push/vapid-public-key', (req, res) => {
  res.json({ success: true, data: process.env.VAPID_PUBLIC_KEY || '' });
});

app.use(errorHandler);

startReminderJob();
startDigestJob();

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
