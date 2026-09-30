import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
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
  IconButton,
  Tooltip,
  useTheme,
} from '@mui/material'
import PersonIcon from '@mui/icons-material/Person'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined'
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined'
import CurrencyExchangeOutlinedIcon from '@mui/icons-material/CurrencyExchangeOutlined'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import SaveIcon from '@mui/icons-material/Save'
import CameraAltOutlinedIcon from '@mui/icons-material/CameraAltOutlined'
import CloseIcon from '@mui/icons-material/Close'
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined'

import { useAuth } from '../context/AuthContext'
import { useAppTheme } from '../context/ThemeContext'
import authService from '../services/authService'

export default function Profile() {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const { user } = useAuth()
  const { mode, toggleTheme } = useAppTheme()
  const fileInputRef = useRef(null)

  // Profile data from backend
  const [profileData, setProfileData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Profile Picture Upload states
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  // Preference states (persisted locally)
  const [currency, setCurrency] = useState(() => localStorage.getItem('app_currency') || 'INR')
  const [emailAlerts, setEmailAlerts] = useState(() => localStorage.getItem('app_email_alerts') !== 'false')
  const [budgetWarnings, setBudgetWarnings] = useState(() => localStorage.getItem('app_budget_warnings') !== 'false')
  const [summaryReport, setSummaryReport] = useState(() => localStorage.getItem('app_summary_report') !== 'false')

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordStatus, setPasswordStatus] = useState({ type: '', text: '' })

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true)
      setErrorMessage('')
      const data = await authService.getCurrentUser()
      setProfileData(data)
    } catch (err) {
      console.error('Failed to load user profile:', err)
      if (user) {
        setProfileData(user)
      } else {
        setErrorMessage('Unable to load profile data from the server. Please try refreshing.')
      }
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  // File Picker Trigger & Validation
  const handleAvatarClick = () => {
    if (uploading) return
    setUploadError('')
    fileInputRef.current?.click()
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError('')

    // Validate type (JPG, PNG, WEBP)
    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type.toLowerCase())) {
      setUploadError('Invalid file format. Please upload a JPG, PNG, or WEBP image.')
      e.target.value = ''
      return
    }

    // Validate size (max 2MB)
    const maxSize = 2 * 1024 * 1024
    if (file.size > maxSize) {
      setUploadError('Image size exceeds 2MB limit. Please choose a smaller image.')
      e.target.value = ''
      return
    }

    setSelectedFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleCancelUpload = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setUploadError('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSaveUpload = async () => {
    if (!selectedFile) return

    try {
      setUploading(true)
      setUploadError('')
      const updatedProfile = await authService.uploadProfilePicture(selectedFile)

      setProfileData((prev) => ({
        ...prev,
        profilePictureUrl: updatedProfile.profilePictureUrl,
      }))
      setSuccessMessage('Profile picture updated successfully.')
      setTimeout(() => setSuccessMessage(''), 3000)

      handleCancelUpload()
    } catch (err) {
      console.error('Profile picture upload failed:', err)
      const msg =
        err.response?.data?.message ||
        'Failed to upload profile picture. Please verify the file size and try again.'
      setUploadError(msg)
    } finally {
      setUploading(false)
    }
  }

  const handleSavePreferences = () => {
    localStorage.setItem('app_currency', currency)
    localStorage.setItem('app_email_alerts', String(emailAlerts))
    localStorage.setItem('app_budget_warnings', String(budgetWarnings))
    localStorage.setItem('app_summary_report', String(summaryReport))
    setSuccessMessage('Preferences updated successfully.')
    setTimeout(() => setSuccessMessage(''), 3000)
  }

  const handlePasswordSubmit = (e) => {
    e.preventDefault()
    setPasswordStatus({ type: '', text: '' })

    if (!currentPassword) {
      setPasswordStatus({ type: 'error', text: 'Please enter your current password.' })
      return
    }
    if (!newPassword || newPassword.length < 6) {
      setPasswordStatus({ type: 'error', text: 'New password must be at least 6 characters.' })
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: 'error', text: 'New passwords do not match.' })
      return
    }

    setPasswordStatus({
      type: 'success',
      text: 'Password updated successfully.',
    })
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  const displayName = profileData?.name || user?.name || 'Account User'
  const displayEmail = profileData?.email || user?.email || '—'
  const rawPicture = previewUrl || profileData?.profilePictureUrl || null
  const activePicture =
    rawPicture && rawPicture.startsWith('/') && !rawPicture.startsWith('data:') && !rawPicture.startsWith('blob:')
      ? `${(import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '').replace(/\/api$/, '')}${rawPicture}`
      : rawPicture

  const memberSince = profileData?.createdAt
    ? new Date(profileData.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Active'

  const userInitials = displayName
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <Box sx={{ maxWidth: 1040, mx: 'auto', py: 1 }}>
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
      />

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
          User Profile
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          Manage your personal details, profile picture, workspace preferences, and security settings.
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
            Loading user profile...
          </Typography>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {/* Left Column: Profile Card & Quick Info */}
          <Grid item xs={12} md={4.5}>
            <Stack spacing={3}>
              {/* Identity Card */}
              <Card sx={{ bgcolor: 'background.paper', overflow: 'hidden' }}>
                <Box
                  sx={{
                    height: 90,
                    bgcolor: isDark ? 'custom.surfaceContainer' : '#e5eeff',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                  }}
                />
                <CardContent sx={{ pt: 0, pb: 3, px: 3, textAlign: 'center', mt: -6 }}>
                  {/* Interactive Circular Profile Picture with Hover Edit Overlay */}
                  <Box sx={{ position: 'relative', width: 92, height: 92, mx: 'auto' }}>
                    <Tooltip title="Click to upload profile photo" arrow>
                      <Box
                        onClick={handleAvatarClick}
                        sx={{
                          position: 'relative',
                          width: '100%',
                          height: '100%',
                          cursor: uploading ? 'default' : 'pointer',
                          borderRadius: '50%',
                          overflow: 'hidden',
                          border: '3px solid',
                          borderColor: previewUrl ? 'primary.main' : 'background.paper',
                          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                          '&:hover .avatar-overlay': {
                            opacity: uploading ? 0 : 1,
                          },
                        }}
                      >
                        <Avatar
                          src={activePicture || undefined}
                          alt={displayName}
                          sx={{
                            width: '100%',
                            height: '100%',
                            bgcolor: isDark ? 'primary.dark' : 'primary.main',
                            color: '#ffffff',
                            fontSize: '1.75rem',
                            fontWeight: 600,
                          }}
                        >
                          {!activePicture && userInitials}
                        </Avatar>

                        {/* Hover Overlay with Camera Icon */}
                        <Box
                          className="avatar-overlay"
                          sx={{
                            position: 'absolute',
                            inset: 0,
                            bgcolor: 'rgba(0, 0, 0, 0.55)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ffffff',
                            opacity: 0,
                            transition: 'opacity 0.2s ease',
                          }}
                        >
                          <CameraAltOutlinedIcon sx={{ fontSize: 22 }} />
                          <Typography variant="caption" sx={{ fontSize: '10px', fontWeight: 600, mt: 0.2 }}>
                            CHANGE
                          </Typography>
                        </Box>
                      </Box>
                    </Tooltip>

                    {/* Small Camera Badge Icon when not hovering */}
                    <IconButton
                      size="small"
                      onClick={handleAvatarClick}
                      disabled={uploading}
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        right: -2,
                        bgcolor: isDark ? 'primary.main' : '#006948',
                        color: isDark ? '#003824' : '#ffffff',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                        p: 0.6,
                        '&:hover': {
                          bgcolor: isDark ? 'primary.light' : '#00855d',
                        },
                      }}
                    >
                      <CameraAltOutlinedIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Box>

                  {/* Upload Error Banner */}
                  {uploadError && (
                    <Alert severity="error" sx={{ mt: 2, textAlign: 'left', fontSize: '12px' }}>
                      {uploadError}
                    </Alert>
                  )}

                  {/* Preview Confirmation Controls */}
                  {selectedFile && (
                    <Box
                      sx={{
                        mt: 2,
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: isDark ? 'custom.surfaceContainer' : 'custom.surfaceLow',
                        border: '1px solid',
                        borderColor: 'primary.light',
                      }}
                    >
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1, fontWeight: 600 }}>
                        Save new profile picture?
                      </Typography>
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={handleCancelUpload}
                          disabled={uploading}
                          startIcon={<CloseIcon sx={{ fontSize: 16 }} />}
                          sx={{ borderRadius: '9999px', fontSize: '12px', py: 0.4 }}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          onClick={handleSaveUpload}
                          disabled={uploading}
                          startIcon={
                            uploading ? (
                              <CircularProgress size={14} color="inherit" />
                            ) : (
                              <CloudUploadOutlinedIcon sx={{ fontSize: 16 }} />
                            )
                          }
                          sx={{
                            borderRadius: '9999px',
                            fontSize: '12px',
                            py: 0.4,
                            bgcolor: isDark ? 'primary.main' : '#006948',
                            color: isDark ? '#003824' : '#ffffff',
                          }}
                        >
                          {uploading ? 'Saving...' : 'Save Picture'}
                        </Button>
                      </Stack>
                    </Box>
                  )}

                  <Typography variant="h6" fontWeight={700} sx={{ mt: 1.5, letterSpacing: '-0.015em' }}>
                    {displayName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '13px' }}>
                    {displayEmail}
                  </Typography>

                  <Box sx={{ display: 'inline-flex', mt: 1.5 }}>
                    <span
                      style={{
                        padding: '4px 12px',
                        borderRadius: 9999,
                        fontSize: '11px',
                        fontWeight: 600,
                        letterSpacing: '0.03em',
                        textTransform: 'uppercase',
                        backgroundColor: isDark ? 'rgba(0, 105, 72, 0.25)' : '#ecfdf5',
                        color: isDark ? '#85f8c4' : '#006948',
                      }}
                    >
                      Active Member
                    </span>
                  </Box>

                  <Divider sx={{ my: 2.5 }} />

                  <Stack spacing={1.5} sx={{ textAlign: 'left' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <PersonIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Account ID
                        </Typography>
                        <Typography variant="body2" fontWeight={600} className="tabular-nums">
                          #{profileData?.id || user?.id || '—'}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <CalendarMonthOutlinedIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Member Since
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {memberSince}
                        </Typography>
                      </Box>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>

              {/* Workspace Preferences */}
              <Card sx={{ bgcolor: 'background.paper' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <PaletteOutlinedIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                    <Typography variant="subtitle1" fontWeight={700}>
                      Appearance & Locale
                    </Typography>
                  </Box>

                  <Stack spacing={2.5}>
                    {/* Theme Switch */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          Dark Mode
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Toggle subdued dark canvas
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

                    {/* Currency Select */}
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5, display: 'block' }}>
                        Base Currency
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
                    </Box>

                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<SaveIcon sx={{ fontSize: 18 }} />}
                      onClick={handleSavePreferences}
                      sx={{
                        borderRadius: '9999px',
                        borderColor: 'divider',
                        color: 'text.primary',
                        '&:hover': {
                          bgcolor: isDark ? 'custom.surfaceContainer' : 'custom.surfaceLow',
                        },
                      }}
                    >
                      Save Preferences
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </Grid>

          {/* Right Column: Account Details, Security & Notification Settings */}
          <Grid item xs={12} md={7.5}>
            <Stack spacing={3}>
              {/* Account Information Card */}
              <Card sx={{ bgcolor: 'background.paper' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5, letterSpacing: '-0.01em' }}>
                    Account Details
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 2.5, display: 'block' }}>
                    Basic credentials associated with your account profile.
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Full Name"
                        value={displayName}
                        disabled
                        slotProps={{
                          input: {
                            startAdornment: (
                              <PersonIcon sx={{ color: 'text.secondary', fontSize: 18, mr: 1 }} />
                            ),
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Email Address"
                        value={displayEmail}
                        disabled
                        slotProps={{
                          input: {
                            startAdornment: (
                              <EmailOutlinedIcon sx={{ color: 'text.secondary', fontSize: 18, mr: 1 }} />
                            ),
                          },
                        }}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Notification Preferences */}
              <Card sx={{ bgcolor: 'background.paper' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <NotificationsNoneOutlinedIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                    <Typography variant="subtitle1" fontWeight={700} sx={{ letterSpacing: '-0.01em' }}>
                      Notification Preferences
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                    Configure automated notifications and budget alert thresholds.
                  </Typography>

                  <Stack spacing={1.5}>
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
                            Budget Limit Alerts
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Receive notifications when monthly spend exceeds 85% of budget.
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
                            System Announcements
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Get system notifications for scheduled reports and insights.
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
                            Monthly Financial Digest
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Enable summary analytics calculation on the 1st of every month.
                          </Typography>
                        </Box>
                      }
                    />
                  </Stack>
                </CardContent>
              </Card>

              {/* Password & Security Card */}
              <Card sx={{ bgcolor: 'background.paper' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <LockOutlinedIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                    <Typography variant="subtitle1" fontWeight={700} sx={{ letterSpacing: '-0.01em' }}>
                      Security & Password
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 2.5, display: 'block' }}>
                    Update your account password to ensure continued account protection.
                  </Typography>

                  {passwordStatus.text && (
                    <Alert
                      severity={passwordStatus.type}
                      sx={{ mb: 2.5, borderRadius: 2 }}
                      onClose={() => setPasswordStatus({ type: '', text: '' })}
                    >
                      {passwordStatus.text}
                    </Alert>
                  )}

                  <Box component="form" onSubmit={handlePasswordSubmit}>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          size="small"
                          type="password"
                          label="Current Password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          size="small"
                          type="password"
                          label="New Password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          helperText="Minimum 6 characters"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          size="small"
                          type="password"
                          label="Confirm New Password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                      </Grid>
                    </Grid>

                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        startIcon={<CheckCircleOutlinedIcon sx={{ fontSize: 18 }} />}
                        sx={{
                          borderRadius: '9999px',
                          px: 3,
                          bgcolor: isDark ? 'primary.main' : '#006948',
                          color: isDark ? '#003824' : '#ffffff',
                          '&:hover': {
                            bgcolor: isDark ? 'primary.light' : '#00855d',
                          },
                        }}
                      >
                        Update Password
                      </Button>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Stack>
          </Grid>
        </Grid>
      )}
    </Box>
  )
}
