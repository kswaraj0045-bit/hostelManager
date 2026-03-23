import User from '../models/User.js';
import { generateToken } from '../utils/generateToken.js';
import { generateOTP, generateResetToken } from '../utils/generateOTP.js';
import { sendOTPEmail, sendPasswordResetEmail } from '../utils/sendEmail.js';
import { sendSMS } from '../utils/sendSMS.js';

export const register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email and password' });
    }
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    const user = await User.create({
      name,
      email,
      password,
      phone: phone || '',
      isEmailVerified: false,
      emailOTP: otp,
      emailOTPExpiry: otpExpiry
    });
    await sendOTPEmail({ to: email, otp, name });
    res.status(201).json({
      success: true,
      message: 'OTP sent to your email. Please verify to continue.',
      data: { userId: user._id, email: user.email }
    });
  } catch (err) {
    next(err);
  }
};

export const verifyEmailOTP = async (req, res, next) => {
  try {
    const { userId, otp } = req.body;
    if (!userId || !otp) {
      return res.status(400).json({ success: false, message: 'userId and otp are required' });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (user.isEmailVerified === true) {
      return res.status(400).json({ success: false, message: 'Email already verified' });
    }
    if (!user.emailOTP || user.emailOTP !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }
    if (!user.emailOTPExpiry || new Date() > user.emailOTPExpiry) {
      return res.status(400).json({ success: false, message: 'OTP expired. Please request a new one.' });
    }
    user.isEmailVerified = true;
    user.emailOTP = null;
    user.emailOTPExpiry = null;
    await user.save();
    const token = generateToken(user._id);
    res.json({
      success: true,
      message: 'Email verified successfully!',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        phone: user.phone,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
        token
      }
    });
  } catch (err) {
    next(err);
  }
};

export const resendEmailOTP = async (req, res, next) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId is required' });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (user.isEmailVerified === true) {
      return res.status(400).json({ success: false, message: 'Email already verified' });
    }
    const otp = generateOTP();
    user.emailOTP = otp;
    user.emailOTPExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();
    await sendOTPEmail({ to: user.email, otp, name: user.name });
    res.json({ success: true, message: 'OTP resent to your email' });
  } catch (err) {
    next(err);
  }
};

export const sendPhoneOTP = async (req, res, next) => {
  try {
    const { phone } = req.body;
    const userId = req.user._id;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }
    const rawPhone = String(phone).trim();
    const digitsOnly = rawPhone.replace(/\D/g, '');
    if (!rawPhone.startsWith('+') && digitsOnly.length !== 10) {
      return res.status(400).json({ success: false, message: 'Please provide a valid 10-digit phone number' });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (user.isPhoneVerified === true) {
      return res.status(400).json({ success: false, message: 'Phone already verified' });
    }
    const formattedPhone = rawPhone.startsWith('+') ? `+${digitsOnly}` : `+91${digitsOnly}`;
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await User.findByIdAndUpdate(userId, {
      phone: formattedPhone,
      phoneOTP: otp,
      phoneOTPExpiry: otpExpiry,
      isPhoneVerified: false
    });
    await sendSMS({
      to: formattedPhone,
      message: `HostelLife OTP: ${otp}. Valid for 10 minutes. Do not share with anyone.`
    });
    res.json({ success: true, message: 'OTP sent to your phone number' });
  } catch (err) {
    next(err);
  }
};

export const verifyPhoneOTP = async (req, res, next) => {
  try {
    const { otp } = req.body;
    const userId = req.user._id;
    if (!otp) {
      return res.status(400).json({ success: false, message: 'OTP is required' });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (user.isPhoneVerified === true) {
      return res.status(400).json({ success: false, message: 'Phone already verified' });
    }
    if (!user.phoneOTP || user.phoneOTP !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }
    if (!user.phoneOTPExpiry || new Date() > user.phoneOTPExpiry) {
      return res.status(400).json({ success: false, message: 'OTP expired. Please request a new one.' });
    }
    user.isPhoneVerified = true;
    user.phoneOTP = null;
    user.phoneOTPExpiry = null;
    await user.save();
    res.json({ success: true, message: 'Phone verified successfully!' });
  } catch (err) {
    next(err);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this email' });
    }
    const resetToken = generateResetToken();
    user.passwordResetToken = resetToken;
    user.passwordResetExpiry = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();
    await sendPasswordResetEmail({ to: user.email, name: user.name, resetToken });
    res.json({ success: true, message: 'Password reset link sent to your email' });
  } catch (err) {
    next(err);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Token and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpiry: { $gt: new Date() }
    });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset link' });
    }
    user.password = newPassword;
    user.passwordResetToken = null;
    user.passwordResetExpiry = null;
    await user.save();
    res.json({ success: true, message: 'Password reset successfully! Please login with new password.' });
  } catch (err) {
    next(err);
  }
};

export const updateLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    if (user.isEmailVerified === false) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email first',
        data: { userId: user._id, email: user.email, needsVerification: true }
      });
    }
    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        phone: user.phone,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
        token: generateToken(user._id)
      }
    });
  } catch (err) {
    next(err);
  }
};

export const login = updateLogin;

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};
