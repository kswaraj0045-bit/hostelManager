import { useState, useEffect, useRef } from 'react';
import { Send, Mic, MicOff } from 'lucide-react';
import * as aiService from '../services/aiService.js';

const SUGGESTED = [
  'Who owes me?',
  "This week's summary",
  'Whose chore today?',
  'Unpaid bills?',
];

const stripMarkdown = (text) => {
  if (!text) return '';
  return text
    .replace(/\*\*\*(.*?)\*\*\*/g, '$1')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/#{1,6}\s/g, '')
    .replace(/`{3}[\s\S]*?`{3}/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^\s*[-*+]\s/gm, '• ')
    .replace(/^\s*\d+\.\s/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
      <div className="glass" style={{ padding: '16px 20px', borderRadius: '20px', borderBottomLeftRadius: '4px', display: 'flex', gap: '6px', alignItems: 'center' }}>
        {[0, 1, 2].map((index) => (
          <span key={index} style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#A7A9BE', display: 'inline-block', animation: 'pulseDot 1.2s ease-in-out infinite', animationDelay: `${index * 0.2}s` }} />
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
    aiService.getChatHistory().then((res) => {
      const list = res.data?.data || [];
      setMessages(list.map((message) => ({ role: message.role, content: message.content, ts: message.createdAt })));
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
    setMessages((current) => [...current, { role: 'user', content, ts }]);
    setSending(true);

    try {
      const res = await aiService.sendChat(content);
      const reply = res.data?.data?.content || 'Sorry, I could not respond.';
      setMessages((current) => [...current, { role: 'assistant', content: reply, ts: new Date().toISOString() }]);
    } catch (err) {
      setMessages((current) => [...current, { role: 'assistant', content: `Error: ${err.response?.data?.message || 'Something went wrong'}`, ts: new Date().toISOString() }]);
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
      const recorder = new MediaRecorder(stream);
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
      };
      recorder.start();
      mediaRef.current = recorder;
      setRecording(true);
    } catch {
      setRecording(false);
    }
  };

  const formatTime = (ts) => {
    if (!ts) return '';

    try {
      return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="fade-in" style={{ height: 'calc(100vh - 64px - 48px)', display: 'flex', flexDirection: 'column' }}>
      <div className="glass" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="gradient-bg" style={{ width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>
            🤖
          </div>
          <div>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '17px' }}>Chintu</h2>
            <span style={{ fontSize: '12px', color: '#A7A9BE' }}>Your hostel buddy • Online</span>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: '#A7A9BE', marginTop: '40px' }}>Loading history...</div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#A7A9BE', marginTop: '60px' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🤖</div>
              <p style={{ fontWeight: 600, fontSize: '16px', marginBottom: '8px' }}>Hi! I&apos;m Chintu</p>
              <p style={{ fontSize: '14px' }}>Ask Chintu anything about your hostel life!</p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div key={index} style={{ display: 'flex', justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start', flexDirection: 'column', alignItems: message.role === 'user' ? 'flex-end' : 'flex-start', gap: '4px' }}>
                <div
                  className={message.role === 'user' ? 'gradient-bg' : 'glass'}
                  style={{ maxWidth: '320px', padding: '14px 20px', borderRadius: message.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px', fontSize: '14px', lineHeight: 1.6, color: '#FFFFFE' }}
                >
                  <div style={{ whiteSpace: 'pre-wrap' }}>
                    {message.role === 'assistant' ? stripMarkdown(message.content) : message.content}
                  </div>
                </div>
                {message.ts && <span style={{ fontSize: '11px', color: '#A7A9BE' }}>{formatTime(message.ts)}</span>}
              </div>
            ))
          )}
          {sending && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>

        <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {SUGGESTED.map((prompt) => (
            <button
              key={prompt}
              onClick={() => send(prompt)}
              style={{ fontSize: '12px', padding: '6px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', color: '#A7A9BE', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={(event) => { event.currentTarget.style.background = 'rgba(108,99,255,0.2)'; event.currentTarget.style.color = '#6C63FF'; event.currentTarget.style.borderColor = '#6C63FF'; }}
              onMouseLeave={(event) => { event.currentTarget.style.background = 'rgba(255,255,255,0.05)'; event.currentTarget.style.color = '#A7A9BE'; event.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
            >
              {prompt}
            </button>
          ))}
        </div>

        <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && send()}
            placeholder="Ask Chintu anything..."
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
            style={{ width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: sending ? 0.7 : 1 }}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
