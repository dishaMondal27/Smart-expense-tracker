import { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  MenuItem,
  Alert,
  CircularProgress,
  Stack,
  useTheme,
} from '@mui/material'
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined'
import CurrencyExchangeOutlinedIcon from '@mui/icons-material/CurrencyExchangeOutlined'
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined'
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined'
import SaveIcon from '@mui/icons-material/Save'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import TuneIcon from '@mui/icons-material/Tune'
import InstallDesktopOutlinedIcon from '@mui/icons-material/InstallDesktopOutlined'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'

import { useAuth } from '../context/AuthContext'
import { useAppTheme } from '../context/ThemeContext'
import { usePWA } from '../context/PWAContext'
import authService from '../services/authService'

export default function Settings() {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const { user } = useAuth()
  const { mode, toggleTheme } = useAppTheme()
  const { isInstallable, isInstalled, installApp } = usePWA()

  // Loading and alert feedback states
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Preference states
  const [currency, setCurrency] = useState(() => localStorage.getItem('app_currency') || 'INR')
  const [budgetWarnings, setBudgetWarnings] = useState(() => localStorage.getItem('app_budget_warnings') !== 'false')
  const [emailAlerts, setEmailAlerts] = useState(() => localStorage.getItem('app_email_alerts') !== 'false')
  const [summaryReport, setSummaryReport] = useState(() => localStorage.getItem('app_summary_report') !== 'false')
  const [autoExportCsv, setAutoExportCsv] = useState(() => localStorage.getItem('app_auto_export_csv') === 'true')
  const [twoFactorAuth, setTwoFactorAuth] = useState(() => localStorage.getItem('app_2fa_enabled') === 'true')

  const fetchUserData = useCallback(async () => {
    try {
      setLoading(true)
      setErrorMessage('')
      // Validate that backend user session is active
      await authService.getCurrentUser()
    } catch (err) {
      console.error('Failed to load user settings profile:', err)
      if (!user) {
        setErrorMessage('Unable to verify user session with the server. Please log in again.')
      }
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchUserData()
  }, [fetchUserData])

  const handleSaveSettings = () => {
    try {
      localStorage.setItem('app_currency', currency)
      localStorage.setItem('app_budget_warnings', String(budgetWarnings))
      localStorage.setItem('app_email_alerts', String(emailAlerts))
      localStorage.setItem('app_summary_report', String(summaryReport))
      localStorage.setItem('app_auto_export_csv', String(autoExportCsv))
      localStorage.setItem('app_2fa_enabled', String(twoFactorAuth))

      setSuccessMessage('Settings saved and applied successfully.')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      setErrorMessage('Failed to save settings to browser storage.')
    }
  }

  const handleResetDefaults = () => {
    setCurrency('INR')
    setBudgetWarnings(true)
    setEmailAlerts(true)
    setSummaryReport(true)
    setAutoExportCsv(false)
    setTwoFactorAuth(false)
    if (mode === 'dark') {
      toggleTheme()
    }
    localStorage.removeItem('app_currency')
    localStorage.removeItem('app_budget_warnings')
    localStorage.removeItem('app_email_alerts')
    localStorage.removeItem('app_summary_report')
    localStorage.removeItem('app_auto_export_csv')
    localStorage.removeItem('app_2fa_enabled')

    setSuccessMessage('Settings have been reset to factory defaults.')
    setTimeout(() => setSuccessMessage(''), 3000)
  }

  return (
    <Box sx={{ maxWidth: 1040, mx: 'auto', py: 1 }}>
      {/* Header Bar */}
      <Box sx={{ mb: 3.5 }}>
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontWeight: 700,
            letterSpacing: '-0.025em',
            color: 'text.primary',
            fontSize: { xs: '1.65rem', sm: '2rem' },
          }}
        >
          Application Settings
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          Customize your financial workstation, display format, and system automations.
        </Typography>
      </Box>

      {/* Alerts */}
      {errorMessage && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setErrorMessage('')}>
          {errorMessage}
        </Alert>
      )}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      )}

      {loading ? (
        <Card sx={{ p: 8, textAlign: 'center', borderRadius: 3 }}>
          <CircularProgress size={38} color="primary" />
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 2 }}>
            Loading settings configuration...
          </Typography>
        </Card>
      ) : (
        <Stack spacing={3}>
          {/* Section 1: Appearance & Display */}
          <Card sx={{ bgcolor: 'background.paper' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1 }}>
                <PaletteOutlinedIcon sx={{ color: 'primary.main', fontSize: 22 }} />
                <Typography variant="subtitle1" fontWeight={700}>
                  Appearance & Theme
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 2.5, display: 'block' }}>
                Control how the Smart Expense Tracker interface looks on your display.
              </Typography>

              <Stack spacing={2.5}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      Dark Mode Theme
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Toggle dark canvas (#0B0F17) with low-strain slate tones
                    </Typography>
                  </Box>
                  <Switch
                    checked={mode === 'dark'}
                    onChange={toggleTheme}
                    color="primary"
                    size="medium"
                  />
                </Box>

                <Divider />

                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
                      System Currency
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                      Currency symbol used throughout ledger tables, metrics, and cards.
                    </Typography>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      slotProps={{
                        input: {
                          startAdornment: (
                            <CurrencyExchangeOutlinedIcon
                              sx={{ color: 'text.secondary', fontSize: 18, mr: 1 }}
                            />
                          ),
                        },
                      }}
                    >
                      <MenuItem value="INR">₹ INR - Indian Rupee</MenuItem>
                      <MenuItem value="USD">$ USD - US Dollar</MenuItem>
                      <MenuItem value="EUR">€ EUR - Euro</MenuItem>
                      <MenuItem value="GBP">£ GBP - British Pound</MenuItem>
                      <MenuItem value="JPY">¥ JPY - Japanese Yen</MenuItem>
                    </TextField>
                  </Grid>
                </Grid>
              </Stack>
            </CardContent>
          </Card>

          {/* Section 2: Notifications & Automation Alerts */}
          <Card sx={{ bgcolor: 'background.paper' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1 }}>
                <NotificationsNoneOutlinedIcon sx={{ color: 'primary.main', fontSize: 22 }} />
                <Typography variant="subtitle1" fontWeight={700}>
                  Alerts & Notifications
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 2.5, display: 'block' }}>
                Manage automatic alerts for budget limits, periodic reports, and security events.
              </Typography>

              <Stack spacing={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={budgetWarnings}
                      onChange={(e) => setBudgetWarnings(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        Budget Overrun Warnings
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Highlight categories and show alerts when expenditures reach 85% or 100% of limits.
                      </Typography>
                    </Box>
                  }
                />

                <Divider />

                <FormControlLabel
                  control={
                    <Switch
                      checked={emailAlerts}
                      onChange={(e) => setEmailAlerts(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        Email Transaction Digests
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Send automated weekly balance summaries to your registered email address.
                      </Typography>
                    </Box>
                  }
                />

                <Divider />

                <FormControlLabel
                  control={
                    <Switch
                      checked={summaryReport}
                      onChange={(e) => setSummaryReport(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        Monthly Financial Diagnostics
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Automatically trigger AI cash flow insights and anomaly detection at the start of each month.
                      </Typography>
                    </Box>
                  }
                />
              </Stack>
            </CardContent>
          </Card>

          {/* Section 3: Data & Security Preferences */}
          <Card sx={{ bgcolor: 'background.paper' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1 }}>
                <SecurityOutlinedIcon sx={{ color: 'primary.main', fontSize: 22 }} />
                <Typography variant="subtitle1" fontWeight={700}>
                  Security & Data Management
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 2.5, display: 'block' }}>
                Workspace security protocols and recurring data archival preferences.
              </Typography>

              <Stack spacing={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={twoFactorAuth}
                      onChange={(e) => setTwoFactorAuth(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        Two-Factor Authentication (2FA) Check
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Require secondary verification when logging in from unrecognized devices.
                      </Typography>
                    </Box>
                  }
                />

                <Divider />

                <FormControlLabel
                  control={
                    <Switch
                      checked={autoExportCsv}
                      onChange={(e) => setAutoExportCsv(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        Automatic Monthly CSV Archive
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Generate downloadable transaction spreadsheets at the end of each billing cycle.
                      </Typography>
                    </Box>
                  }
                />
              </Stack>
            </CardContent>
          </Card>

          {/* Section 4: Progressive Web App (PWA) */}
          <Card sx={{ bgcolor: 'background.paper' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1 }}>
                <InstallDesktopOutlinedIcon sx={{ color: 'primary.main', fontSize: 22 }} />
                <Typography variant="subtitle1" fontWeight={700}>
                  Application Installation (PWA)
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 2.5, display: 'block' }}>
                Run Smart Expense Tracker as a standalone desktop or mobile application with offline capabilities.
              </Typography>

              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: { xs: 'flex-start', sm: 'center' },
                  justifyContent: 'space-between',
                  gap: 2,
                  p: 2,
                  borderRadius: 2,
                  bgcolor: isDark ? 'custom.surfaceContainer' : 'custom.surfaceLow',
                }}
              >
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    {isInstalled ? 'App is installed on this device' : 'Install Smart Expense Tracker'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {isInstalled
                      ? 'You are running the standalone Progressive Web App with offline caching enabled.'
                      : 'Add to your home screen or desktop taskbar for 1-click access and full offline viewing.'}
                  </Typography>
                </Box>

                {isInstalled ? (
                  <Button
                    variant="outlined"
                    color="success"
                    disabled
                    startIcon={<CheckCircleOutlinedIcon />}
                    sx={{ borderRadius: '9999px', textTransform: 'none' }}
                  >
                    Installed
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    color="primary"
                    disabled={!isInstallable}
                    onClick={installApp}
                    startIcon={<InstallDesktopOutlinedIcon />}
                    sx={{
                      borderRadius: '9999px',
                      textTransform: 'none',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {isInstallable ? 'Install App Now' : 'Installed / Native'}
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Save & Reset Action Controls */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column-reverse', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 2,
              pt: 1,
            }}
          >
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<RestartAltIcon sx={{ fontSize: 18 }} />}
              onClick={handleResetDefaults}
              sx={{
                borderRadius: '9999px',
                borderColor: 'divider',
                color: 'text.secondary',
                width: { xs: '100%', sm: 'auto' },
                '&:hover': {
                  borderColor: 'divider',
                  bgcolor: isDark ? 'custom.surfaceContainer' : 'custom.surfaceLow',
                },
              }}
            >
              Reset to Defaults
            </Button>

            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon sx={{ fontSize: 18 }} />}
              onClick={handleSaveSettings}
              sx={{
                borderRadius: '9999px',
                px: 3.5,
                width: { xs: '100%', sm: 'auto' },
                bgcolor: isDark ? 'primary.main' : '#006948',
                color: isDark ? '#003824' : '#ffffff',
                '&:hover': {
                  bgcolor: isDark ? 'primary.light' : '#00855d',
                },
              }}
            >
              Save Changes
            </Button>
          </Box>
        </Stack>
      )}
    </Box>
  )
}
