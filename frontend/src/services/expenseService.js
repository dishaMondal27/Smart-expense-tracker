import api from './api'

export const expenseService = {
  // Fetch expenses with optional filters: startDate, endDate, categoryId, paymentMethod, search
  getExpenses: async (params = {}) => {
    const response = await api.get('/api/expenses', { params })
    return response.data
  },

  // Fetch single expense by id
  getExpenseById: async (id) => {
    const response = await api.get(`/api/expenses/${id}`)
    return response.data
  },

  // Create new expense
  createExpense: async (expenseData) => {
    const response = await api.post('/api/expenses', expenseData)
    return response.data
  },

  // Update existing expense
  updateExpense: async (id, expenseData) => {
    const response = await api.put(`/api/expenses/${id}`, expenseData)
    return response.data
  },

  // Delete expense
  deleteExpense: async (id) => {
    const response = await api.delete(`/api/expenses/${id}`)
    return response.data
  },

  // Fetch categories (default EXPENSE)
  getCategories: async (type = 'EXPENSE') => {
    const response = await api.get('/api/categories', { params: { type } })
    return response.data
  },

  // Suggest category based on description keyword mapping
  suggestCategory: async (description) => {
    const response = await api.post('/api/expenses/suggest-category', { description })
    return response.data
  },

  // Scan receipt image/document via OCR
  scanReceipt: async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post('/api/expenses/scan-receipt', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },
}

export default expenseService
