import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Lock } from 'lucide-react';
import { resetPassword } from '../../services/authService.js';
import { useToast } from '../../hooks/useToast.js';

const getPasswordStrength = (password) => {
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  if (password.length >= 8 && hasNumber && hasSymbol) {
    return { label: 'Strong', color: '#2CB67D', width: '100%' };
  }

  if (password.length >= 6 && hasNumber) {
    return { label: 'Medium', color: '#FF8906', width: '66%' };
  }

  return { label: 'Weak', color: '#FF6584', width: password ? '33%' : '0%' };
};

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { success } = useToast();
  const navigate = useNavigate();

  const token = searchParams.get('token');
  const passwordStrength = getPasswordStrength(newPassword);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!token) {
      setErrorMessage('Reset token is missing or invalid.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      await resetPassword({ token, newPassword });
      success('Password reset! Please login.');
      navigate('/login', { replace: true });
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
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
        <div className="glass fade-in" style={{ maxWidth: '420px', width: '100%', padding: '40px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ fontSize: '52px', marginBottom: '16px' }}>🔒</div>
            <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '30px', color: '#FFFFFE', marginBottom: '10px' }}>
              Set New Password
            </h1>
            <p style={{ color: '#A7A9BE', fontSize: '14px', lineHeight: 1.6 }}>
              Choose a secure password for your account
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#A7A9BE', marginBottom: '8px' }}>New Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#A7A9BE', pointerEvents: 'none' }} />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className="input-dark"
                  style={{ paddingLeft: '44px', paddingRight: '44px' }}
                  placeholder="Enter new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((current) => !current)}
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: '#A7A9BE', cursor: 'pointer', display: 'flex', padding: 0 }}
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#A7A9BE', marginBottom: '8px' }}>Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#A7A9BE', pointerEvents: 'none' }} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="input-dark"
                  style={{ paddingLeft: '44px', paddingRight: '44px' }}
                  placeholder="Confirm new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: '#A7A9BE', cursor: 'pointer', display: 'flex', padding: 0 }}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: '#A7A9BE' }}>
                <span>Password Strength</span>
                <span style={{ color: passwordStrength.color, fontWeight: 600 }}>{passwordStrength.label}</span>
              </div>
              <div style={{ width: '100%', height: '10px', borderRadius: '999px', background: '#252436', overflow: 'hidden' }}>
                <div style={{ width: passwordStrength.width, height: '100%', borderRadius: '999px', background: passwordStrength.color, transition: 'width 0.2s ease, background 0.2s ease' }} />
              </div>
            </div>

            {errorMessage && (
              <p style={{ color: '#FF6584', fontSize: '13px', textAlign: 'center' }}>
                {errorMessage}
              </p>
            )}

            {!token && (
              <p style={{ color: '#FF6584', fontSize: '13px', textAlign: 'center' }}>
                Reset token is missing from the URL.
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !token}
              className="gradient-btn"
              style={{ width: '100%', padding: '14px', borderRadius: '12px', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              {loading ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Resetting...</> : 'Reset Password'}
            </button>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
