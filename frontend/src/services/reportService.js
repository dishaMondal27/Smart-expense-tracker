import api from './api'

export const reportService = {
  // Fetch report data for period: 'daily' | 'weekly' | 'monthly' | 'yearly'
  getReport: async (period = 'monthly') => {
    const response = await api.get('/api/reports', {
      params: { period },
    })
    return response.data
  },

  // Export report as CSV blob
  exportCsv: async (period = 'monthly') => {
    const response = await api.get('/api/export/csv', {
      params: { period },
      responseType: 'blob',
    })
    return response.data
  },

  // Export report as PDF blob
  exportPdf: async (period = 'monthly') => {
    const response = await api.get('/api/export/pdf', {
      params: { period },
      responseType: 'blob',
    })
    return response.data
  },
}

export default reportService
