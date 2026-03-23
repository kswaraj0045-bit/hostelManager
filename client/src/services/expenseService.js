import api from './api.js';

export const getExpenses = (groupId) => api.get(`/expenses/${groupId}`);
export const addExpense = (data) => api.post('/expenses', data);
export const deleteExpense = (id) => api.delete(`/expenses/${id}`);
export const getBalance = (groupId) => api.get(`/expenses/balance/${groupId}`);
export const getOverallBalance = () => api.get('/expenses/overall-balance');
