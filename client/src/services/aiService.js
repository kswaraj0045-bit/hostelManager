import api from './api.js';

export const getChatHistory = () => api.get('/ai/chat');
export const sendChat = (content) => api.post('/ai/chat', { content });
export const getDigest = () => api.get('/ai/digest');
