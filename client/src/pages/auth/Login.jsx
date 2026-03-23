import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../hooks/useToast.js';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      success('Logged in successfully');
      navigate('/');
    } catch (err) {
      if (err.response?.data?.data?.needsVerification) {
        navigate('/verify-email', {
          state: {
            userId: err.response.data.data.userId,
            email: err.response.data.data.email
          }
        });
        error(err.response?.data?.message || 'Please verify your email first');
        return;
      }
      error(err.response?.data?.message || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#0F0E17' }}>
      {/* Left panel */}
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
            {['Track shared expenses effortlessly', 'Coordinate chores & laundry', 'AI-powered weekly summaries'].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '16px', color: 'white' }}>
                <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✓</span>
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: '#0F0E17' }}>
        <div className="glass fade-in" style={{ maxWidth: '420px', width: '100%', padding: '40px' }}>
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '28px', color: '#FFFFFE', marginBottom: '8px' }}>
              Welcome back 👋
            </h1>
            <p style={{ color: '#A7A9BE', fontSize: '14px' }}>Sign in to your HostelLife account</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Email */}
            <div style={{ position: 'relative' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#A7A9BE', marginBottom: '8px' }}>Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#A7A9BE', pointerEvents: 'none' }} />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input-dark"
                  style={{ paddingLeft: '44px' }}
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#A7A9BE', marginBottom: '8px' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#A7A9BE', pointerEvents: 'none' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-dark"
                  style={{ paddingLeft: '44px', paddingRight: '44px' }}
                  placeholder="Your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: '#A7A9BE', cursor: 'pointer', display: 'flex', padding: 0 }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="text-primary text-xs hover:underline"
                  style={{ background: 'transparent', border: 'none', color: '#6C63FF', cursor: 'pointer', fontSize: '12px' }}
                >
                  Forgot Password?
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="gradient-btn"
              style={{ width: '100%', padding: '14px', borderRadius: '12px', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '8px' }}
            >
              {loading ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Signing in...</> : 'Sign In'}
            </button>
          </form>

          <p style={{ marginTop: '24px', textAlign: 'center', color: '#A7A9BE', fontSize: '14px' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#6C63FF', textDecoration: 'none', fontWeight: 600 }}>
              Register
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
