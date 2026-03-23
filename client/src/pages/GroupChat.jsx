import { useState, useEffect, useRef, useCallback } from 'react'
import { Send, Pin, Trash2, AtSign, X, ChevronDown } from 'lucide-react'
import { useSocket } from '../hooks/useSocket'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../hooks/useToast'
import * as chatService from '../services/chatService'

export default function GroupChat({ groupId, groupName, members = [] }) {
  const { user } = useAuth()
  const { socket } = useSocket()
  const { error } = useToast()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [typing, setTyping] = useState(null)
  const [showPinned, setShowPinned] = useState(false)
  const [showMentions, setShowMentions] = useState(false)
  const messagesEndRef = useRef(null)
  const typingTimerRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadMessages = useCallback(async () => {
    if (!groupId) return
    try {
      const res = await chatService.getMessages(groupId)
      setMessages(res.data?.data || [])
    } catch (err) {
      console.error('Failed to load messages:', err.message)
    } finally {
      setLoading(false)
    }
  }, [groupId])

  useEffect(() => { loadMessages() }, [loadMessages])
  useEffect(() => { scrollToBottom() }, [messages])

  useEffect(() => {
    if (!socket || !groupId) return
    socket.emit('join:group', groupId)

    socket.on('chat:message', (msg) => {
      setMessages(prev => {
        if (prev.find(m => m._id === msg._id)) return prev
        return [...prev, msg]
      })
    })

    socket.on('chat:typing', (data) => {
      if (data.userId !== user?._id?.toString()) {
        setTyping(data.name)
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
        typingTimerRef.current = setTimeout(() => setTyping(null), 3000)
      }
    })

    socket.on('chat:stop-typing', () => setTyping(null))

    return () => {
      socket.off('chat:message')
      socket.off('chat:typing')
      socket.off('chat:stop-typing')
    }
  }, [socket, groupId, user])

  const handleInputChange = (e) => {
    const val = e.target.value
    setInput(val)

    if (val.endsWith('@')) setShowMentions(true)
    else if (val.includes('@') && !val.split('@').pop().includes(' ')) setShowMentions(true)
    else setShowMentions(false)

    if (socket && groupId) {
      socket.emit('chat:typing', { groupId })
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
      typingTimerRef.current = setTimeout(() => {
        socket.emit('chat:stop-typing', { groupId })
      }, 1500)
    }
  }

  const handleSend = async () => {
    if (!input.trim() || sending) return
    setSending(true)
    const text = input.trim()
    setInput('')
    setShowMentions(false)
    try {
      const res = await chatService.sendMessage(groupId, { content: text })
      const msg = res.data?.data
      if (msg) {
        setMessages(prev => prev.find(m => m._id === msg._id) ? prev : [...prev, msg])
      }
      if (socket) socket.emit('chat:stop-typing', { groupId })
    } catch (err) {
      error('Failed to send message')
      setInput(text)
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleDelete = async (msgId) => {
    try {
      await chatService.deleteMessage(msgId)
      setMessages(prev => prev.filter(m => m._id !== msgId))
    } catch (err) {
      error('Failed to delete message')
    }
  }

  const insertMention = (name) => {
    const parts = input.split('@')
    parts.pop()
    setInput(parts.join('@') + `@${name} `)
    setShowMentions(false)
  }

  const renderContent = (text) => {
    if (!text) return ''
    return text.split(/(@\w+)/g).map((part, i) =>
      part.startsWith('@')
        ? <span key={i} style={{ color: '#6C63FF', fontWeight: 600 }}>{part}</span>
        : part
    )
  }

  const userId = user?._id?.toString?.() || user?._id
  const pinnedMessages = messages.filter(m => m.isPinned)

  const getAvatar = (sender) => sender?.name?.charAt(0)?.toUpperCase() || '?'

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
        <p style={{ color: '#A7A9BE' }}>Loading chat...</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '520px', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', background: '#1C1B29' }}>
      {/* Header */}
      <div style={{ padding: '14px 20px', background: '#252436', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 700, color: '#FFFFFE', fontSize: '15px' }}>{groupName}</p>
          <p style={{ color: '#A7A9BE', fontSize: '12px' }}>{members.length} members</p>
        </div>
        {pinnedMessages.length > 0 && (
          <button
            onClick={() => setShowPinned(!showPinned)}
            style={{ background: showPinned ? 'rgba(108,99,255,0.2)' : 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#A7A9BE', cursor: 'pointer', padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Pin size={13} /> {pinnedMessages.length} pinned
          </button>
        )}
      </div>

      {/* Pinned dropdown */}
      {showPinned && pinnedMessages.length > 0 && (
        <div style={{ background: '#252436', padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', maxHeight: '120px', overflowY: 'auto' }}>
          {pinnedMessages.map(m => (
            <div key={m._id} style={{ padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '13px', color: '#A7A9BE' }}>
              <span style={{ color: '#6C63FF', fontWeight: 600, marginRight: '8px' }}>📌 {m.sender?.name}:</span>
              {m.content}
            </div>
          ))}
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {messages.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px', color: '#A7A9BE' }}>
            <p style={{ fontSize: '32px' }}>💬</p>
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map(msg => {
            const isOwn = (msg.sender?._id?.toString?.() || msg.sender?.toString?.()) === userId
            return (
              <div key={msg._id} style={{ display: 'flex', justifyContent: isOwn ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: '8px' }}>
                {!isOwn && (
                  <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'linear-gradient(135deg,#6C63FF,#FF6584)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: 'white', flexShrink: 0 }}>
                    {getAvatar(msg.sender)}
                  </div>
                )}
                <div style={{ maxWidth: '65%' }}>
                  {!isOwn && (
                    <p style={{ fontSize: '11px', color: '#A7A9BE', marginBottom: '3px', paddingLeft: '4px' }}>{msg.sender?.name}</p>
                  )}
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      background: isOwn ? 'linear-gradient(135deg,#6C63FF,#FF6584)' : 'rgba(255,255,255,0.06)',
                      border: isOwn ? 'none' : '1px solid rgba(255,255,255,0.08)',
                      position: 'relative',
                    }}
                  >
                    {msg.isPinned && <span style={{ fontSize: '11px', marginRight: '4px' }}>📌</span>}
                    <p style={{ color: '#FFFFFE', fontSize: '14px', lineHeight: 1.5, wordBreak: 'break-word' }}>
                      {renderContent(msg.content)}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px', paddingLeft: isOwn ? '0' : '4px', justifyContent: isOwn ? 'flex-end' : 'flex-start' }}>
                    <span style={{ fontSize: '11px', color: '#A7A9BE' }}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isOwn && (
                      <button
                        onClick={() => handleDelete(msg._id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FF6584', padding: '0', lineHeight: 1, opacity: 0.6 }}
                        title="Delete"
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
        {typing && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#A7A9BE', fontSize: '13px', fontStyle: 'italic', paddingLeft: '40px' }}>
            <span>{typing} is typing</span>
            <span style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
              {[0, 1, 2].map(i => (
                <span key={i} style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#A7A9BE', display: 'inline-block', animation: `pulseDot 1s ${i * 0.3}s infinite` }} />
              ))}
            </span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Mention dropdown */}
      {showMentions && (
        <div style={{ background: '#252436', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', position: 'absolute', bottom: '80px', left: '16px', zIndex: 100, overflow: 'hidden', minWidth: '180px' }}>
          {members.filter(m => m.user?.name).map(m => (
            <button
              key={m.user._id}
              onClick={() => insertMention(m.user.name)}
              style={{ width: '100%', padding: '10px 16px', background: 'none', border: 'none', color: '#FFFFFE', cursor: 'pointer', textAlign: 'left', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(108,99,255,0.15)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg,#6C63FF,#FF6584)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: 'white', flexShrink: 0 }}>
                {m.user.name.charAt(0).toUpperCase()}
              </div>
              {m.user.name}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ padding: '12px 16px', background: '#252436', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '10px', position: 'relative' }}>
        <input
          className="input-dark"
          placeholder="Type a message... Use @ to mention"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          style={{ flex: 1, borderRadius: '20px', padding: '10px 16px', background: '#1C1B29' }}
        />
        <button
          onClick={() => setShowMentions(!showMentions)}
          style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#A7A9BE', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
        >
          <AtSign size={16} />
        </button>
        <button
          onClick={handleSend}
          disabled={sending || !input.trim()}
          className="gradient-btn"
          style={{ width: '40px', height: '40px', borderRadius: '50%', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}
