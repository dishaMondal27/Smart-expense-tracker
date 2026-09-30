import api from './api'

export const insightService = {
  // Fetch rule-based smart insights
  getInsights: async () => {
    const response = await api.get('/api/insights')
    return response.data
  },
}

export default insightService
