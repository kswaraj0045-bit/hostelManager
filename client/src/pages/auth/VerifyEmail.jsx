import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../hooks/useToast.js';
import { resendEmailOTP, verifyEmailOTP } from '../../services/authService.js';
import OTPInputGroup from '../../components/auth/OTPInputGroup.jsx';

const emptyDigits = () => Array.from({ length: 6 }, () => '');

export default function VerifyEmail() {
  const [digits, setDigits] = useState(emptyDigits);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(30);
  const [errorMessage, setErrorMessage] = useState('');
  const [shakeOtp, setShakeOtp] = useState(false);
  const { user, setAuthenticatedUser } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const userId = location.state?.userId || user?._id;
  const email = location.state?.email || user?.email;

  useEffect(() => {
    if (user?.isEmailVerified === true) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate, user]);

  useEffect(() => {
    if (resendCountdown <= 0) return undefined;

    const timeoutId = window.setTimeout(() => {
      setResendCountdown((current) => current - 1);
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [resendCountdown]);

  const triggerOtpError = (message) => {
    setErrorMessage(message);
    setShakeOtp(true);
    window.setTimeout(() => setShakeOtp(false), 400);
  };

  const handleDigitsChange = (nextDigits) => {
    setDigits(nextDigits);
    if (errorMessage) setErrorMessage('');
    if (shakeOtp) setShakeOtp(false);
  };

  const handleVerify = async (otpValue = digits.join('')) => {
    if (loading) return;

    if (!userId || !email) {
      triggerOtpError('Verification details are missing. Please register or log in again.');
      return;
    }

    if (otpValue.length !== 6) {
      triggerOtpError('Enter the 6-digit OTP.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const res = await verifyEmailOTP({ userId, otp: otpValue });
      if (res.data?.success) {
        setAuthenticatedUser(res.data.data);
        success('Email verified!');
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      triggerOtpError(err.response?.data?.message || err.message || 'Failed to verify email');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!userId || resendCountdown > 0 || resending) return;

    setResending(true);
    try {
      await resendEmailOTP({ userId });
      setDigits(emptyDigits);
      setErrorMessage('');
      setResendCountdown(30);
      success('OTP resent to your email');
    } catch (err) {
      error(err.response?.data?.message || err.message || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#0F0E17' }}>
      <div
        className="hidden md:flex flex-col items-center justify-center p-12 gradient-bg"
        style={{ flex: 1 }}
      >
        <div style={{ textAlign: 'center', color: 'white', maxWidth: '400px' }}>
          <div style={{ fontSize: '80px', marginBottom: '24px' }}>🏠</div>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '36px', marginBottom: '16px', color: 'white' }}>
            HostelLife
          </h2>
          <p style={{ fontSize: '18px', opacity: 0.9, marginBottom: '40px', lineHeight: 1.6 }}>
            Manage your hostel life smartly — expenses, chores, meals & more.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
            {['Track shared expenses effortlessly', 'Coordinate chores & laundry', 'AI-powered weekly summaries'].map((feature) => (
              <div key={feature} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '16px', color: 'white' }}>
                <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✓</span>
                {feature}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: '#0F0E17' }}>
        <div className="glass fade-in" style={{ maxWidth: '460px', width: '100%', padding: '40px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ fontSize: '52px', marginBottom: '16px' }}>📧</div>
            <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '30px', color: '#FFFFFE', marginBottom: '10px' }}>
              Verify Your Email
            </h1>
            <p style={{ color: '#A7A9BE', fontSize: '14px', lineHeight: 1.6 }}>
              {email ? `We sent a 6-digit OTP to ${email}` : 'We need your email verification details to continue.'}
            </p>
          </div>

          {userId && email ? (
            <>
              <div style={{ marginBottom: '16px' }}>
                <OTPInputGroup
                  digits={digits}
                  onChange={handleDigitsChange}
                  onComplete={handleVerify}
                  autoFocus
                  disabled={loading}
                  shake={shakeOtp}
                />
              </div>

              {errorMessage && (
                <p style={{ color: '#FF6584', fontSize: '13px', textAlign: 'center', marginBottom: '16px' }}>
                  {errorMessage}
                </p>
              )}

              <button
                type="button"
                onClick={() => handleVerify()}
                disabled={loading}
                className="gradient-btn"
                style={{ width: '100%', padding: '14px', borderRadius: '12px', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                {loading ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Verifying...</> : 'Verify Email'}
              </button>

              <div style={{ marginTop: '18px', textAlign: 'center', color: '#A7A9BE', fontSize: '14px' }}>
                <span>Didn't receive OTP? </span>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCountdown > 0 || resending}
                  style={{ background: 'transparent', border: 'none', color: resendCountdown > 0 ? '#A7A9BE' : '#6C63FF', cursor: resendCountdown > 0 ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '14px' }}
                >
                  {resending ? 'Resending...' : resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend OTP'}
                </button>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ color: '#A7A9BE', fontSize: '14px', lineHeight: 1.6 }}>
                Open this page from registration or login so we know which email address to verify.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <Link to="/login" className="gradient-btn" style={{ padding: '12px 18px', borderRadius: '12px', textDecoration: 'none' }}>
                  Go to Login
                </Link>
                <Link to="/register" className="secondary-btn-dark" style={{ textDecoration: 'none' }}>
                  Create Account
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
