import api from './api.js';

export const getGroups = () => api.get('/groups');
export const getGroup = (id) => api.get(`/groups/${id}`);
export const createGroup = (data) => api.post('/groups', data);
export const joinGroup = (inviteCode) => api.post('/groups/join', { invite_code: inviteCode });
export const removeGroupMember = (groupId, userId) => api.delete(`/groups/${groupId}/members/${userId}`);
export const deleteGroup = (id) => api.delete(`/groups/${id}`);
