import api from './api.js';

export const addSettlement = (data) => api.post('/settlements', data);
export const getSettlements = (groupId) => api.get(`/settlements/${groupId}`);
