import api from './api.js';

export const getChores = (groupId) => api.get(`/chores/${groupId}`);
export const addChore = (data) => api.post('/chores', data);
export const updateChore = (id, data) => api.patch(`/chores/${id}`, data);
export const approveChoreCompletion = (id) => api.patch(`/chores/${id}/approve`);
export const rejectChoreCompletion = (id) => api.patch(`/chores/${id}/reject`);
export const deleteChore = (id) => api.delete(`/chores/${id}`);
