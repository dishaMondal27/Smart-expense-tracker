import api from './api'

export const notificationService = {
  // Fetch all notifications for the authenticated user
  getNotifications: async () => {
    const response = await api.get('/api/notifications')
    return response.data
  },

  // Mark a single notification as read
  markAsRead: async (id) => {
    const response = await api.put(`/api/notifications/${id}/read`)
    return response.data
  },
}

export default notificationService
