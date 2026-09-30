import api from './api'

export const incomeService = {
  // Fetch incomes with optional filters: startDate, endDate, source, search
  getIncomes: async (params = {}) => {
    const response = await api.get('/api/income', { params })
    return response.data
  },

  // Fetch single income by id
  getIncomeById: async (id) => {
    const response = await api.get(`/api/income/${id}`)
    return response.data
  },

  // Create new income
  createIncome: async (incomeData) => {
    const response = await api.post('/api/income', incomeData)
    return response.data
  },

  // Update existing income
  updateIncome: async (id, incomeData) => {
    const response = await api.put(`/api/income/${id}`, incomeData)
    return response.data
  },

  // Delete income
  deleteIncome: async (id) => {
    const response = await api.delete(`/api/income/${id}`)
    return response.data
  },
}

export default incomeService
