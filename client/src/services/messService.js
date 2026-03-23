import api from './api.js';

export const getMess = (groupId) => api.get(`/mess/${groupId}`);
export const createOrUpdateMess = (data) => api.post('/mess', data);
export const voteMeal = (menuId, dayIndex) => api.patch(`/mess/${menuId}/vote`, { dayIndex });
