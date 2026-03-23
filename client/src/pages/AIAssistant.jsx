import { useState, useEffect, useRef } from 'react';
import { Send, Mic, MicOff, Bot } from 'lucide-react';
import * as aiService from '../services/aiService.js';

const SUGGESTED = [
  'Who owes me?',
  "This week's summary",
  'Whose chore today?',
  'Unpaid bills?',
];

const CATEGORY_EMOJIS = { food: '🍕', travel: '🚗', utilities: '⚡', shopping: '🛒', misc: '📦', other: '🎉' };

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
      <div className="glass" style={{ padding: '16px 20px', borderRadius: '20px', borderBottomLeftRadius: '4px', display: 'flex', gap: '6px', alignItems: 'center' }}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#A7A9BE', display: 'inline-block', animation: 'pulseDot 1.2s ease-in-out infinite', animationDelay: `${i * 0.2}s` }} />
        ))}
      </div>
    </div>
  );
}

export default function AIAssistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const bottomRef = useRef(null);
  const mediaRef = useRef(null);

  useEffect(() => {
    aiService.getChatHistory().then(res => {
      const list = res.data?.data || [];
      setMessages(list.map(m => ({ role: m.role, content: m.content, ts: m.createdAt })));
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const send = async (text) => {
    const content = (text || input).trim();
    if (!content || sending) return;
    setInput('');
    const ts = new Date().toISOString();
    setMessages(prev => [...prev, { role: 'user', content, ts }]);
    setSending(true);
    try {
      const res = await aiService.sendChat(content);
      const reply = res.data?.data?.content || 'Sorry, I could not respond.';
      setMessages(prev => [...prev, { role: 'assistant', content: reply, ts: new Date().toISOString() }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error: ' + (err.response?.data?.message || 'Something went wrong'), ts: new Date().toISOString() }]);
    } finally {
      setSending(false);
    }
  };

  const toggleRecord = async () => {
    if (recording) {
      mediaRef.current?.stop();
      setRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      const chunks = [];
      rec.ondataavailable = e => chunks.push(e.data);
      rec.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        // Voice transcription not available without extra service, just stop
      };
      rec.start();
      mediaRef.current = rec;
      setRecording(true);
    } catch {
      setRecording(false);
    }
  };

  const fmt = (ts) => {
    if (!ts) return '';
    try { return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
    catch { return ''; }
  };

  return (
    <div className="fade-in" style={{ height: 'calc(100vh - 64px - 48px)', display: 'flex', flexDirection: 'column' }}>
      <div className="glass" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="gradient-bg" style={{ width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>
            🤖
          </div>
          <div>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '17px' }}>HostelBot</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2CB67D', animation: 'pulseDot 2s infinite' }} />
              <span style={{ fontSize: '12px', color: '#A7A9BE' }}>Online</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: '#A7A9BE', marginTop: '40px' }}>Loading history...</div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#A7A9BE', marginTop: '60px' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🤖</div>
              <p style={{ fontWeight: 600, fontSize: '16px', marginBottom: '8px' }}>Hi! I'm HostelBot</p>
              <p style={{ fontSize: '14px' }}>Ask me about expenses, chores, bills, or anything about your hostel.</p>
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start', gap: '4px' }}>
                <div
                  className={m.role === 'user' ? 'gradient-bg' : 'glass'}
                  style={{ maxWidth: '320px', padding: '14px 20px', borderRadius: m.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px', fontSize: '14px', lineHeight: 1.6, color: '#FFFFFE' }}
                >
                  {m.content}
                </div>
                {m.ts && <span style={{ fontSize: '11px', color: '#A7A9BE' }}>{fmt(m.ts)}</span>}
              </div>
            ))
          )}
          {sending && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>

        {/* Suggested prompts */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {SUGGESTED.map(p => (
            <button
              key={p}
              onClick={() => send(p)}
              style={{ fontSize: '12px', padding: '6px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', color: '#A7A9BE', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(108,99,255,0.2)'; e.currentTarget.style.color = '#6C63FF'; e.currentTarget.style.borderColor = '#6C63FF'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#A7A9BE'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input */}
        <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Ask HostelBot anything..."
            className="input-dark"
            style={{ flex: 1, borderRadius: '20px' }}
          />
          <button
            onClick={toggleRecord}
            style={{ width: '48px', height: '48px', borderRadius: '14px', border: 'none', background: recording ? '#FF6584' : '#252436', color: recording ? 'white' : '#A7A9BE', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s', animation: recording ? 'pulseDot 1s infinite' : 'none' }}
          >
            {recording ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
          <button
            onClick={() => send()}
            disabled={sending || !input.trim()}
            className="gradient-btn"
            style={{ width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
