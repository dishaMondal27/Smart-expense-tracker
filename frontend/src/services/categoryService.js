import api from './api'

export const categoryService = {
  // Fetch categories with optional type filter (EXPENSE or INCOME)
  getCategories: async (type) => {
    const params = type ? { type } : {}
    const response = await api.get('/api/categories', { params })
    return response.data
  },

  // Fetch single category by id
  getCategoryById: async (id) => {
    const response = await api.get(`/api/categories/${id}`)
    return response.data
  },

  // Create new category
  createCategory: async (categoryData) => {
    const response = await api.post('/api/categories', categoryData)
    return response.data
  },

  // Update existing category
  updateCategory: async (id, categoryData) => {
    const response = await api.put(`/api/categories/${id}`, categoryData)
    return response.data
  },

  // Delete category
  deleteCategory: async (id) => {
    const response = await api.delete(`/api/categories/${id}`)
    return response.data
  },
}

export default categoryService
