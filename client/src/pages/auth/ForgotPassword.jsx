import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Mail } from 'lucide-react';
import { forgotPassword } from '../../services/authService.js';
import { useToast } from '../../hooks/useToast.js';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sentEmail, setSentEmail] = useState('');
  const { error } = useToast();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      await forgotPassword({ email });
      setSentEmail(email);
    } catch (err) {
      error(err.response?.data?.message || err.message || 'Failed to send reset link');
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
          {!sentEmail ? (
            <>
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{ fontSize: '52px', marginBottom: '16px' }}>🔑</div>
                <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '30px', color: '#FFFFFE', marginBottom: '10px' }}>
                  Forgot Password?
                </h1>
                <p style={{ color: '#A7A9BE', fontSize: '14px', lineHeight: 1.6 }}>
                  Enter your email and we'll send a reset link
                </p>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#A7A9BE', marginBottom: '8px' }}>Email</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#A7A9BE', pointerEvents: 'none' }} />
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="input-dark"
                      style={{ paddingLeft: '44px' }}
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="gradient-btn"
                  style={{ width: '100%', padding: '14px', borderRadius: '12px', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  {loading ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Sending...</> : 'Send Reset Link'}
                </button>
              </form>
            </>
          ) : (
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '52px' }}>✅</div>
              <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '28px', color: '#FFFFFE' }}>
                Reset Link Sent
              </h1>
              <p style={{ color: '#A7A9BE', fontSize: '14px', lineHeight: 1.6 }}>
                Reset link sent to {sentEmail}. Check your inbox.
              </p>
            </div>
          )}

          <p style={{ marginTop: '24px', textAlign: 'center', color: '#A7A9BE', fontSize: '14px' }}>
            <Link to="/login" style={{ color: '#6C63FF', textDecoration: 'none', fontWeight: 600 }}>
              Back to Login
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
