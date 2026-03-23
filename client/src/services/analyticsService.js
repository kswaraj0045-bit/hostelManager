import api from './api'
export const getOverview = () => api.get('/analytics/overview')
export const getGroupAnalytics = (groupId) => api.get(`/analytics/group/${groupId}`)
