import api from './api'
export const getReminders = () => api.get('/reminders')
export const createReminder = (data) => api.post('/reminders', data)
export const updateReminder = (id, data) => api.patch(`/reminders/${id}`, data)
export const deleteReminder = (id) => api.delete(`/reminders/${id}`)
export const snoozeReminder = (id) => api.patch(`/reminders/${id}/snooze`)
export const completeReminder = (id) => api.patch(`/reminders/${id}/complete`)
