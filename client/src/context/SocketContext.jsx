import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext.jsx';
import { resolveSocketUrl } from '../utils/serverUrl.js';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !user) return;
    const socketUrl = resolveSocketUrl() || window.location.origin;
    const s = io(socketUrl, { auth: { token } });
    setSocket(s);
    return () => s.disconnect();
  }, [user]);

  const joinGroup = (groupId) => {
    if (socket) socket.emit('join', groupId);
  };

  const leaveGroup = (groupId) => {
    if (socket) socket.emit('leave', groupId);
  };

  return (
    <SocketContext.Provider value={{ socket, joinGroup, leaveGroup }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
