import api from './api'

export const dashboardService = {
  // Fetch dashboard summary containing metrics, budget, and recent transactions
  getSummary: async () => {
    const response = await api.get('/api/dashboard/summary')
    return response.data
  },
}

export default dashboardService
