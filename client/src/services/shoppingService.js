import api from './api'
export const getShoppingList = (groupId) => api.get(`/shopping/${groupId}`)
export const addItem = (groupId, data) => api.post(`/shopping/${groupId}`, data)
export const checkItem = (itemId) => api.patch(`/shopping/${itemId}/check`)
export const deleteItem = (itemId) => api.delete(`/shopping/${itemId}`)
export const getAISuggestions = (groupId) => api.post(`/shopping/${groupId}/ai-suggest`)
