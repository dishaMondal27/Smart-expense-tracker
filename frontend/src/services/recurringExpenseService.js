import api from './api'

export const recurringExpenseService = {
  // Fetch all recurring expenses for current user
  getRecurringExpenses: async () => {
    const response = await api.get('/api/recurring-expenses')
    return response.data
  },

  // Fetch single recurring expense by ID
  getRecurringExpenseById: async (id) => {
    const response = await api.get(`/api/recurring-expenses/${id}`)
    return response.data
  },

  // Create new recurring expense
  createRecurringExpense: async (data) => {
    const response = await api.post('/api/recurring-expenses', data)
    return response.data
  },

  // Update existing recurring expense
  updateRecurringExpense: async (id, data) => {
    const response = await api.put(`/api/recurring-expenses/${id}`, data)
    return response.data
  },

  // Delete recurring expense
  deleteRecurringExpense: async (id) => {
    const response = await api.delete(`/api/recurring-expenses/${id}`)
    return response.data
  },

  // Manual trigger endpoint for testing scheduler
  triggerJob: async () => {
    const response = await api.post('/api/recurring-expenses/trigger-job')
    return response.data
  },
}

export default recurringExpenseService
