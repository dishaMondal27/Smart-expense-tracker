import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Box, CircularProgress } from '@mui/material'
import { AppThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import { PWAProvider } from './context/PWAContext'
import ProtectedRoute from './components/ProtectedRoute'
import MainLayout from './layouts/MainLayout'
import ReloadPrompt from './components/ReloadPrompt'
import OfflineIndicator from './components/OfflineIndicator'

// Public Pages (Layout-free, lazy loaded)
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))

// Protected Pages (Inside MainLayout, lazy loaded)
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Expenses = lazy(() => import('./pages/Expenses'))
const AddExpense = lazy(() => import('./pages/AddExpense'))
const Income = lazy(() => import('./pages/Income'))
const AddIncome = lazy(() => import('./pages/AddIncome'))
const Budget = lazy(() => import('./pages/Budget'))
const Reports = lazy(() => import('./pages/Reports'))
const Categories = lazy(() => import('./pages/Categories'))
const Notifications = lazy(() => import('./pages/Notifications'))
const Profile = lazy(() => import('./pages/Profile'))
const Settings = lazy(() => import('./pages/Settings'))
const NotFound = lazy(() => import('./pages/NotFound'))

const PageLoader = () => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '60vh',
      width: '100%',
    }}
  >
    <CircularProgress size={36} />
  </Box>
)

function App() {
  return (
    <AppThemeProvider>
      <AuthProvider>
        <PWAProvider>
          <BrowserRouter>
            <OfflineIndicator />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public Routes - Layout-free */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected Routes - Rendered within MainLayout */}
                <Route element={<ProtectedRoute />}>
                  <Route element={<MainLayout />}>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/expenses" element={<Expenses />} />
                    <Route path="/expenses/add" element={<AddExpense />} />
                    <Route path="/income" element={<Income />} />
                    <Route path="/income/add" element={<AddIncome />} />
                    <Route path="/budget" element={<Budget />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/categories" element={<Categories />} />
                    <Route path="/notifications" element={<Notifications />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/settings" element={<Settings />} />
                  </Route>
                </Route>

                {/* Fallback Catch-all Route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            <ReloadPrompt />
          </BrowserRouter>
        </PWAProvider>
      </AuthProvider>
    </AppThemeProvider>
  )
}

export default App
