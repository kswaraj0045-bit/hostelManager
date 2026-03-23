import express from 'express';
import {
  register,
  login,
  getMe,
  verifyEmailOTP,
  resendEmailOTP,
  forgotPassword,
  resetPassword,
  sendPhoneOTP,
  verifyPhoneOTP
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { uploadAvatar } from '../middleware/uploadMiddleware.js';
import User from '../models/User.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify-email', verifyEmailOTP);
router.post('/resend-email-otp', resendEmailOTP);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/send-phone-otp', protect, sendPhoneOTP);
router.post('/verify-phone', protect, verifyPhoneOTP);
router.get('/me', protect, getMe);

router.post('/upload-avatar', protect, (req, res, next) => {
  uploadAvatar(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
}, async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: avatarUrl },
      { new: true }
    ).select('-password');
    res.json({ success: true, data: { avatar: user.avatar, user } });
  } catch (err) {
    next(err);
  }
});

router.patch('/update-profile', protect, async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name: name.trim() },
      { new: true }
    ).select('-password');
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

router.delete('/delete-account', protect, async (req, res, next) => {
  try {
    const userId = req.user._id;
    await User.findByIdAndDelete(userId);
    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
