import api from './api'

export const authService = {
  register: async (userData) => {
    const response = await api.post('/api/auth/register', userData)
    return response.data
  },

  login: async (credentials) => {
    const response = await api.post('/api/auth/login', credentials)
    return response.data
  },

  getCurrentUser: async () => {
    const response = await api.get('/api/users/me')
    return response.data
  },

  getProfile: async () => {
    const response = await api.get('/api/users/profile')
    return response.data
  },

  uploadProfilePicture: async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post('/api/users/profile/picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },
}

export default authService

