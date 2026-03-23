import api from './api'
export const getMessages = (groupId) => api.get(`/chat/${groupId}`)
export const sendMessage = (groupId, data) => api.post(`/chat/${groupId}`, data)
export const pinMessage = (messageId) => api.patch(`/chat/${messageId}/pin`)
export const deleteMessage = (messageId) => api.delete(`/chat/${messageId}`)
