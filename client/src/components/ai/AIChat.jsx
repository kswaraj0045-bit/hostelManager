import { useState, useRef, useEffect } from 'react';
import ChatBubble from './ChatBubble.jsx';
import VoiceInput from './VoiceInput.jsx';
import * as aiService from '../../services/aiService.js';

export default function AIChat({ messages: initialMessages, onNewMessage }) {
  const [messages, setMessages] = useState(initialMessages || []);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    setMessages(initialMessages || []);
  }, [initialMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (text) => {
    const content = (text || input).trim();
    if (!content || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content }]);
    setLoading(true);

    try {
      const res = await aiService.sendChat(content);
      const assistantContent = res.data?.data?.content || 'Sorry, I could not respond.';
      const newMsg = { role: 'assistant', content: assistantContent };
      setMessages((prev) => [...prev, newMsg]);
      onNewMessage?.(newMsg);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Error: ' + (err.response?.data?.message || 'Something went wrong') }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[500px]">
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {messages.map((m, i) => (
          <ChatBubble key={i} role={m.role} content={m.content} />
        ))}
        {loading && (
          <div className="flex gap-2 items-center text-slate-500">
            <span className="animate-pulse">●</span>
            <span className="animate-pulse">●</span>
            <span className="animate-pulse">●</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="p-4 border-t flex gap-2">
        <VoiceInput onResult={(t) => setInput((prev) => prev + (prev ? ' ' : '') + t)} />
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Ask about expenses, chores, bills..."
          className="flex-1 border rounded-lg px-4 py-2"
        />
        <button
          onClick={() => send()}
          disabled={loading || !input.trim()}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
