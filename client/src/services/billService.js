import api from './api.js';

export const getBills = (groupId) => api.get(`/bills/${groupId}`);
export const addBill = (data) => api.post('/bills', data);
export const updateBill = (id, data) => api.patch(`/bills/${id}`, data);
export const deleteBill = (id) => api.delete(`/bills/${id}`);
