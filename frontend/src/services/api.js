import axios from 'axios'

// In-memory token storage (NOT localStorage)
let inMemoryToken = null

export const setAuthToken = (token) => {
  inMemoryToken = token
}

export const getAuthToken = () => {
  return inMemoryToken
}

// Resolve base API URL:
// - In dev: empty string proxies through Vite dev server (/api -> http://localhost:8080/api)
// - In production: set VITE_API_BASE_URL (e.g. https://smart-expense-tracker-fpbn.vercel.app or https://smart-expense-tracker-fpbn.vercel.app/api)
const rawBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '')
// If the user specifies the base URL with or without '/api', ensure requests like api.get('/api/...') do not double up
const normalizedBaseUrl = rawBaseUrl.endsWith('/api') ? rawBaseUrl.slice(0, -4) : rawBaseUrl

const api = axios.create({
  baseURL: normalizedBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor attaching in-memory JWT to all API calls and blocking offline mutations
api.interceptors.request.use(
  (config) => {
    // If user is offline and attempting to mutate data (POST, PUT, DELETE, PATCH),
    // reject immediately with a user-friendly error so no stale or silent failures occur.
    const method = (config.method || 'get').toLowerCase()
    if (typeof navigator !== 'undefined' && !navigator.onLine && method !== 'get') {
      const offlineError = new Error("You're offline. Changes cannot be saved until your internet connection is restored.")
      offlineError.isOffline = true
      return Promise.reject(offlineError)
    }

    if (inMemoryToken) {
      config.headers.Authorization = `Bearer ${inMemoryToken}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// Response interceptor for unified handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If backend returns 401 Unauthorized, token may be invalid or expired
    if (error.response?.status === 401) {
      // Clear token if invalid/expired so application does not falsely appear logged in
      inMemoryToken = null
    }

    // Enhance network error message when offline
    if (typeof navigator !== 'undefined' && !navigator.onLine && !error.isOffline) {
      error.message = "You're currently offline. Please check your network connection."
    }

    return Promise.reject(error)
  },
)

export default api
