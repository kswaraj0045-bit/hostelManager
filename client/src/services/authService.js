import api from './api.js';

export const register = (data) => api.post('/auth/register', data);
export const login = (data) => api.post('/auth/login', data);
export const getMe = () => api.get('/auth/me');
export const verifyEmailOTP = (data) => api.post('/auth/verify-email', data);
export const resendEmailOTP = (data) => api.post('/auth/resend-email-otp', data);
export const forgotPassword = (data) => api.post('/auth/forgot-password', data);
export const resetPassword = (data) => api.post('/auth/reset-password', data);
export const sendPhoneOTP = (data) => api.post('/auth/send-phone-otp', data);
export const verifyPhoneOTP = (data) => api.post('/auth/verify-phone', data);
export const uploadAvatar = (formData) => api.post('/auth/upload-avatar', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
