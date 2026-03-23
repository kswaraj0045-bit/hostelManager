import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Shield, Mail, Phone, Loader2, Camera, Edit2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotifications } from '../context/NotificationContext.jsx';
import { useToast } from '../hooks/useToast.js';
import { sendPhoneOTP, verifyPhoneOTP, uploadAvatar } from '../services/authService.js';
import OTPInputGroup from '../components/auth/OTPInputGroup.jsx';
import api from '../services/api.js';

const emptyDigits = () => Array.from({ length: 6 }, () => '');

const getPhoneDigits = (phoneNumber = '') => (
  phoneNumber.replace(/^\+91/, '').replace(/\D/g, '').slice(0, 10)
);

export default function Profile() {
  const navigate = useNavigate();
  const { user, refreshUser, updateUser, logout } = useAuth();
  const { preferences, updatePreference, permission, supported, requestPermission } = useNotifications();
  const { success, error } = useToast();
  const [phone, setPhone] = useState(getPhoneDigits(user?.phone));
  const [otpDigits, setOtpDigits] = useState(emptyDigits);
  const [otpSent, setOtpSent] = useState(false);
  const [sendingPhoneOTP, setSendingPhoneOTP] = useState(false);
  const [verifyingPhoneOTP, setVerifyingPhoneOTP] = useState(false);
  const [shakeOtp, setShakeOtp] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [deleteStep, setDeleteStep] = useState(0);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  useEffect(() => {
    setPhone(getPhoneDigits(user?.phone));
    if (user?.isPhoneVerified) {
      setOtpSent(false);
      setOtpDigits(emptyDigits);
    }
  }, [user]);

  const notifRows = [
    { key: 'expenses', icon: <Mail size={16} />, label: 'Expense Alerts', desc: 'Get notified when a new expense is added' },
    { key: 'chores', icon: <Bell size={16} />, label: 'Chore Reminders', desc: 'Daily reminder for your assigned chores' },
    { key: 'bills', icon: <Shield size={16} />, label: 'Bill Due Dates', desc: 'Alerts when bills are due soon' },
  ];

  const triggerOtpShake = () => {
    setShakeOtp(true);
    window.setTimeout(() => setShakeOtp(false), 400);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      error('Image must be under 5MB');
      return;
    }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('avatar', avatarFile);
      const res = await uploadAvatar(formData);
      const updatedUser = res.data?.data?.user;
      if (updatedUser) {
        updateUser(updatedUser);
      }
      setAvatarFile(null);
      setAvatarPreview(null);
      success('Profile photo updated!');
    } catch (err) {
      error(err.response?.data?.message || 'Failed to upload photo');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      error('Name cannot be empty');
      return;
    }
    try {
      const res = await api.patch('/auth/update-profile', { name: editName });
      const updatedUser = res.data?.data;
      if (updatedUser) updateUser(updatedUser);
      setIsEditing(false);
      success('Profile updated!');
    } catch (err) {
      error(err.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleSendPhoneOTP = async () => {
    if (phone.length !== 10) {
      error('Enter a valid 10-digit phone number');
      return;
    }

    setSendingPhoneOTP(true);
    try {
      await sendPhoneOTP({ phone });
      setOtpSent(true);
      setOtpDigits(emptyDigits);
      setShakeOtp(false);
      await refreshUser();
      success('OTP sent to your phone number');
    } catch (err) {
      error(err.response?.data?.message || err.message || 'Failed to send OTP');
    } finally {
      setSendingPhoneOTP(false);
    }
  };

  const handleVerifyPhone = async () => {
    const otp = otpDigits.join('');
    if (otp.length !== 6) {
      triggerOtpShake();
      error('Enter the 6-digit OTP');
      return;
    }

    setVerifyingPhoneOTP(true);
    try {
      await verifyPhoneOTP({ otp });
      await refreshUser();
      setOtpSent(false);
      setOtpDigits(emptyDigits);
      success('Phone verified successfully!');
    } catch (err) {
      triggerOtpShake();
      error(err.response?.data?.message || err.message || 'Failed to verify phone');
    } finally {
      setVerifyingPhoneOTP(false);
    }
  };

  return (
    <div className="fade-in" style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '24px' }}>Profile</h1>

      <div className="glass" style={{ padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            {avatarPreview || user?.avatar ? (
              <img
                src={avatarPreview || `${import.meta.env.VITE_API_URL}${user.avatar}`}
                alt="Profile"
                style={{
                  width: '96px',
                  height: '96px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid rgba(108,99,255,0.5)'
                }}
              />
            ) : (
              <div style={{
                width: '96px',
                height: '96px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #6C63FF, #FF6584)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '36px',
                fontWeight: 700,
                color: 'white',
                border: '3px solid rgba(108,99,255,0.5)'
              }}>
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                position: 'absolute',
                bottom: '0',
                right: '0',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #6C63FF, #FF6584)',
                border: '2px solid #1C1B29',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'white'
              }}
            >
              <Camera size={14} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleAvatarChange}
              style={{ display: 'none' }}
            />
          </div>

          {avatarPreview && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleAvatarUpload}
                disabled={uploadingAvatar}
                className="gradient-btn"
                style={{ padding: '8px 20px', borderRadius: '10px', fontSize: '13px' }}
              >
                {uploadingAvatar ? 'Uploading...' : 'Save Photo'}
              </button>
              <button
                onClick={() => { setAvatarFile(null); setAvatarPreview(null); }}
                style={{
                  padding: '8px 20px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#A7A9BE',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          )}

          {isEditing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '300px' }}>
              <input
                className="input-dark"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                placeholder="Your name"
                style={{ textAlign: 'center', fontSize: '16px' }}
                autoFocus
              />
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button
                  onClick={handleSaveProfile}
                  className="gradient-btn"
                  style={{ padding: '8px 20px', borderRadius: '10px', fontSize: '13px' }}
                >
                  Save
                </button>
                <button
                  onClick={() => { setIsEditing(false); setEditName(user?.name || ''); }}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#A7A9BE',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '22px', color: '#FFFFFE', marginBottom: '4px' }}>
                {user?.name}
              </h2>
              <p style={{ color: '#A7A9BE', fontSize: '14px', marginBottom: '12px' }}>{user?.email}</p>
              <button
                onClick={() => { setIsEditing(true); setEditName(user?.name || ''); }}
                style={{
                  padding: '8px 20px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#A7A9BE',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#6C63FF'; e.currentTarget.style.color = '#6C63FF'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#A7A9BE'; }}
              >
                <Edit2 size={14} /> Edit Profile
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="glass" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <Phone size={18} color="#6C63FF" />
          <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '16px' }}>Phone Verification</h3>
        </div>

        {user?.isPhoneVerified ? (
          <div className="glass" style={{ padding: '18px', background: '#252436', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
            <div>
              <p style={{ color: '#A7A9BE', fontSize: '12px', marginBottom: '4px' }}>Verified phone number</p>
              <p style={{ fontSize: '16px', fontWeight: 600 }}>{user?.phone}</p>
            </div>
            <span style={{ background: 'rgba(44,182,125,0.16)', color: '#2CB67D', border: '1px solid rgba(44,182,125,0.28)', padding: '8px 12px', borderRadius: '999px', fontSize: '13px', fontWeight: 600 }}>
              ✅ Verified
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#A7A9BE', marginBottom: '8px' }}>Phone number</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div
                  className="input-dark"
                  style={{
                    width: '78px',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '12px 14px'
                  }}
                >
                  +91
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="input-dark"
                  placeholder="9876543210"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleSendPhoneOTP}
              disabled={sendingPhoneOTP}
              className="gradient-btn"
              style={{ width: '100%', padding: '14px', borderRadius: '12px', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              {sendingPhoneOTP ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Sending OTP...</> : 'Send OTP'}
            </button>

            {otpSent && (
              <>
                <p style={{ color: '#A7A9BE', fontSize: '13px', textAlign: 'center' }}>
                  Enter the 6-digit OTP sent to +91 {phone}
                </p>
                <OTPInputGroup
                  digits={otpDigits}
                  onChange={(nextDigits) => {
                    setOtpDigits(nextDigits);
                    if (shakeOtp) setShakeOtp(false);
                  }}
                  autoFocus={otpSent}
                  shake={shakeOtp}
                />
                <button
                  type="button"
                  onClick={handleVerifyPhone}
                  disabled={verifyingPhoneOTP}
                  className="gradient-btn"
                  style={{ width: '100%', padding: '14px', borderRadius: '12px', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  {verifyingPhoneOTP ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Verifying...</> : 'Verify Phone'}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="glass" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <Bell size={18} color="#6C63FF" />
          <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '16px' }}>Device Notifications</h3>
        </div>
        <div className="glass" style={{ padding: '16px', marginBottom: '16px', background: '#252436' }}>
          <p style={{ fontSize: '14px', color: '#FFFFFE', marginBottom: '6px' }}>
            Browser permission: {supported ? permission : 'unsupported'}
          </p>
          <p style={{ fontSize: '12px', color: '#A7A9BE', marginBottom: '12px' }}>
            Notifications work in the browser on this device. Keep the app open for reminders to appear.
          </p>
          {supported && permission !== 'granted' && (
            <button
              onClick={requestPermission}
              className="gradient-btn"
              style={{ padding: '10px 16px', borderRadius: '12px', fontSize: '14px' }}
            >
              Enable Notifications
            </button>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {notifRows.map((row, i) => (
            <div key={row.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: i < notifRows.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span style={{ color: '#6C63FF', marginTop: '2px' }}>{row.icon}</span>
                <div>
                  <p style={{ fontWeight: 500, fontSize: '14px', marginBottom: '2px' }}>{row.label}</p>
                  <p style={{ fontSize: '12px', color: '#A7A9BE' }}>{row.desc}</p>
                </div>
              </div>
              <div
                onClick={() => updatePreference(row.key, !preferences[row.key])}
                style={{ width: '44px', height: '24px', borderRadius: '12px', background: preferences[row.key] ? 'linear-gradient(135deg, #6C63FF, #FF6584)' : '#252436', cursor: 'pointer', position: 'relative', transition: 'background 0.3s', flexShrink: 0 }}
              >
                <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'white', position: 'absolute', top: '3px', left: preferences[row.key] ? '23px' : '3px', transition: 'left 0.3s' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass" style={{ padding: '24px', borderColor: 'rgba(255,101,132,0.2)' }}>
        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '16px', color: '#FF6584', marginBottom: '12px' }}>Danger Zone</h3>
        <p style={{ color: '#A7A9BE', fontSize: '13px', marginBottom: '16px' }}>Once you delete your account, all data is permanently removed.</p>

        {deleteStep === 0 && (
          <button
            onClick={() => setDeleteStep(1)}
            style={{
              padding: '10px 24px',
              borderRadius: '10px',
              fontSize: '14px',
              background: 'transparent',
              border: '1px solid rgba(255,101,132,0.4)',
              color: '#FF6584',
              cursor: 'pointer',
              fontWeight: 500,
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,101,132,0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            Delete Account
          </button>
        )}

        {deleteStep === 1 && (
          <div className="glass" style={{ padding: '20px', borderRadius: '14px', border: '1px solid rgba(255,101,132,0.3)', background: 'rgba(255,101,132,0.05)' }}>
            <p style={{ color: '#FF6584', fontWeight: 600, fontSize: '15px', marginBottom: '8px' }}>
              ⚠️ Are you sure you want to delete your account?
            </p>
            <p style={{ color: '#A7A9BE', fontSize: '13px', marginBottom: '16px' }}>
              This will permanently delete all your data including expenses, groups and settlements. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setDeleteStep(2)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  background: 'rgba(255,101,132,0.15)',
                  border: '1px solid rgba(255,101,132,0.4)',
                  color: '#FF6584',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Yes, continue
              </button>
              <button
                onClick={() => setDeleteStep(0)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#A7A9BE',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {deleteStep === 2 && (
          <div className="glass" style={{ padding: '20px', borderRadius: '14px', border: '1px solid rgba(255,101,132,0.5)', background: 'rgba(255,101,132,0.08)' }}>
            <p style={{ color: '#FF6584', fontWeight: 700, fontSize: '15px', marginBottom: '8px' }}>
              🚨 Final confirmation
            </p>
            <p style={{ color: '#A7A9BE', fontSize: '13px', marginBottom: '12px' }}>
              Type <strong style={{ color: '#FFFFFE' }}>DELETE</strong> to confirm permanent deletion:
            </p>
            <input
              className="input-dark"
              placeholder="Type DELETE here"
              value={deleteConfirmText}
              onChange={e => setDeleteConfirmText(e.target.value)}
              style={{ marginBottom: '14px' }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={async () => {
                  if (deleteConfirmText !== 'DELETE') {
                    error('Please type DELETE to confirm');
                    return;
                  }
                  try {
                    await api.delete('/auth/delete-account');
                    logout();
                    navigate('/login');
                    success('Account deleted successfully');
                  } catch (err) {
                    error(err.response?.data?.message || 'Failed to delete account');
                  }
                }}
                disabled={deleteConfirmText !== 'DELETE'}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  background: deleteConfirmText === 'DELETE' ? '#FF6584' : 'rgba(255,101,132,0.2)',
                  border: 'none',
                  color: 'white',
                  cursor: deleteConfirmText === 'DELETE' ? 'pointer' : 'not-allowed',
                  fontWeight: 700,
                  transition: 'all 0.2s'
                }}
              >
                Permanently Delete
              </button>
              <button
                onClick={() => { setDeleteStep(0); setDeleteConfirmText(''); }}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#A7A9BE',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
