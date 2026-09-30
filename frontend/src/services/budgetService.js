import api from './api'

export const budgetService = {
  // Fetch current month's budget & calculated metrics
  getCurrentBudget: async () => {
    const response = await api.get('/api/budgets/current')
    return response.data
  },

  // Fetch budget for specific month/year
  getBudgetForMonth: async (month, year) => {
    const params = {}
    if (month) params.month = month
    if (year) params.year = year
    const response = await api.get('/api/budgets', { params })
    return response.data
  },

  // Set or update monthly budget
  setBudget: async (budgetData) => {
    const response = await api.post('/api/budgets', budgetData)
    return response.data
  },
}

export default budgetService
