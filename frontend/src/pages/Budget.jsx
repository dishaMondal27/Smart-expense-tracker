import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  LinearProgress,
  Alert,
  CircularProgress,
  InputAdornment,
  Chip,
  Stack,
  Divider,
} from '@mui/material'
import SavingsIcon from '@mui/icons-material/Savings'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import ErrorOutlinedIcon from '@mui/icons-material/ErrorOutlined'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import EditIcon from '@mui/icons-material/Edit'
import SaveIcon from '@mui/icons-material/Save'
import CancelIcon from '@mui/icons-material/Cancel'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import budgetService from '../services/budgetService'

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

function Budget() {
  const currentDate = useMemo(() => new Date(), [])
  const currentMonthIndex = currentDate.getMonth() // 0-based
  const currentYear = currentDate.getFullYear()
  const monthName = MONTH_NAMES[currentMonthIndex]

  // Budget data state
  const [budgetData, setBudgetData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [bannerMessage, setBannerMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  // Editing state
  const [isEditing, setIsEditing] = useState(false)
  const [budgetAmountInput, setBudgetAmountInput] = useState('')
  const [fieldError, setFieldError] = useState('')
  const [saving, setSaving] = useState(false)

  // Fetch current month's budget & calculation metrics
  const fetchCurrentBudget = useCallback(async () => {
    try {
      setLoading(true)
      setErrorMessage('')
      const data = await budgetService.getCurrentBudget()
      setBudgetData(data)
      setBudgetAmountInput(data?.budgetAmount ? data.budgetAmount.toString() : '')
    } catch (err) {
      console.error('Failed to load current budget', err)
      setErrorMessage('Failed to load budget details. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCurrentBudget()
  }, [fetchCurrentBudget])

  const budgetAmount = parseFloat(budgetData?.budgetAmount || 0)
  const spentAmount = parseFloat(budgetData?.spentAmount || 0)
  const remainingAmount = parseFloat(budgetData?.remainingAmount || 0)
  const percentUsed = parseFloat(budgetData?.percentUsed || 0)

  // Color & status determination
  const isExceeded = budgetAmount > 0 && percentUsed >= 100
  const isWarning = budgetAmount > 0 && percentUsed >= 80 && percentUsed < 100
  const isHealthy = budgetAmount > 0 && percentUsed < 80

  const getProgressColor = () => {
    if (isExceeded) return 'error'
    if (isWarning) return 'warning'
    return 'primary'
  }

  const handleStartEdit = () => {
    setIsEditing(true)
    setFieldError('')
    setBannerMessage('')
    setBudgetAmountInput(budgetAmount > 0 ? budgetAmount.toString() : '')
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setFieldError('')
    setBudgetAmountInput(budgetAmount > 0 ? budgetAmount.toString() : '')
  }

  const handleSaveBudget = async (e) => {
    e.preventDefault()

    const parsed = parseFloat(budgetAmountInput)
    if (!budgetAmountInput || isNaN(parsed) || parsed <= 0) {
      setFieldError('Budget amount must be a positive number greater than 0')
      return
    }

    try {
      setSaving(true)
      setFieldError('')
      setErrorMessage('')

      const payload = {
        amount: parsed,
        month: currentMonthIndex + 1,
        year: currentYear,
      }

      const updated = await budgetService.setBudget(payload)
      setBudgetData(updated)
      setIsEditing(false)
      setBannerMessage(`Monthly budget updated to ₹${parsed.toLocaleString('en-IN', { minimumFractionDigits: 2 })} successfully!`)
    } catch (err) {
      console.error('Failed to update budget', err)
      const msg = err.response?.data?.message || 'Failed to update budget. Please check your network and try again.'
      setErrorMessage(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', p: { xs: 1, sm: 2 } }}>
      {/* Header Banner */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          mb: 3,
          gap: 2,
        }}
      >
        <div>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Budget Management
          </Typography>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5 }}>
            <CalendarMonthIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              Current Period: <strong>{monthName} {currentYear}</strong>
            </Typography>
          </Stack>
        </div>

        {!isEditing && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<EditIcon />}
            onClick={handleStartEdit}
            disabled={loading}
            sx={{ px: 3, py: 1, borderRadius: 2 }}
          >
            {budgetAmount > 0 ? 'Edit Budget' : 'Set Monthly Budget'}
          </Button>
        )}
      </Box>

      {/* Notifications */}
      {bannerMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setBannerMessage('')}>
          {bannerMessage}
        </Alert>
      )}

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMessage('')}>
          {errorMessage}
        </Alert>
      )}

      {/* Loading state */}
      {loading ? (
        <Card elevation={2} sx={{ p: 6, textAlign: 'center', borderRadius: 2 }}>
          <CircularProgress size={36} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Calculating monthly budget and expenses...
          </Typography>
        </Card>
      ) : (
        <Stack spacing={3}>
          {/* Alert Callouts for 80% / 100% states */}
          {budgetAmount > 0 && isExceeded && (
            <Alert
              severity="error"
              icon={<ErrorOutlinedIcon fontSize="inherit" />}
              variant="filled"
              sx={{ borderRadius: 2, fontWeight: 500 }}
            >
              <strong>Budget Exceeded!</strong> You have spent ₹{spentAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} ({percentUsed.toFixed(1)}% of your monthly budget of ₹{budgetAmount.toLocaleString('en-IN')}). You are over budget by ₹{Math.abs(remainingAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}.
            </Alert>
          )}

          {budgetAmount > 0 && isWarning && (
            <Alert
              severity="warning"
              icon={<WarningAmberIcon fontSize="inherit" />}
              variant="filled"
              sx={{ borderRadius: 2, fontWeight: 500 }}
            >
              <strong>Budget Warning:</strong> You have reached {percentUsed.toFixed(1)}% of your monthly limit! Only ₹{remainingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} remaining for the rest of {monthName}.
            </Alert>
          )}

          {budgetAmount > 0 && isHealthy && (
            <Alert
              severity="info"
              icon={<CheckCircleOutlinedIcon fontSize="inherit" />}
              sx={{ borderRadius: 2 }}
            >
              Your spending is on track! You have utilized <strong>{percentUsed.toFixed(1)}%</strong> of your budget with <strong>₹{remainingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong> remaining.
            </Alert>
          )}

          {budgetAmount === 0 && !isEditing && (
            <Alert
              severity="warning"
              action={
                <Button color="inherit" size="small" onClick={handleStartEdit}>
                  Set Now
                </Button>
              }
              sx={{ borderRadius: 2 }}
            >
              You haven't set a budget for {monthName} {currentYear} yet. Set a spending limit to track your progress and avoid overspending!
            </Alert>
          )}

          {/* Metric KPI Cards */}
          <Grid container spacing={2}>
            {/* Monthly Budget */}
            <Grid item xs={12} sm={4}>
              <Card
                elevation={2}
                sx={{
                  borderRadius: 2,
                  borderLeft: '4px solid',
                  borderColor: 'primary.main',
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
                    <SavingsIcon color="primary" />
                    <Typography variant="caption" color="text.secondary" fontWeight="bold">
                      TOTAL MONTHLY BUDGET
                    </Typography>
                  </Stack>
                  <Typography variant="h5" fontWeight="bold">
                    ₹{budgetAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Allocated for {monthName}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Total Spent */}
            <Grid item xs={12} sm={4}>
              <Card
                elevation={2}
                sx={{
                  borderRadius: 2,
                  borderLeft: '4px solid',
                  borderColor: isExceeded ? 'error.main' : isWarning ? 'warning.main' : 'info.main',
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
                    <AccountBalanceWalletIcon color={isExceeded ? 'error' : isWarning ? 'warning' : 'info'} />
                    <Typography variant="caption" color="text.secondary" fontWeight="bold">
                      SPENT THIS MONTH
                    </Typography>
                  </Stack>
                  <Typography
                    variant="h5"
                    fontWeight="bold"
                    color={isExceeded ? 'error.main' : isWarning ? 'warning.main' : 'text.primary'}
                  >
                    ₹{spentAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {budgetAmount > 0 ? `${percentUsed.toFixed(1)}% of total budget` : 'No budget set'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Remaining Amount */}
            <Grid item xs={12} sm={4}>
              <Card
                elevation={2}
                sx={{
                  borderRadius: 2,
                  borderLeft: '4px solid',
                  borderColor: remainingAmount < 0 ? 'error.main' : 'success.main',
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
                    <TrendingDownIcon color={remainingAmount < 0 ? 'error' : 'success'} />
                    <Typography variant="caption" color="text.secondary" fontWeight="bold">
                      REMAINING BUDGET
                    </Typography>
                  </Stack>
                  <Typography
                    variant="h5"
                    fontWeight="bold"
                    color={remainingAmount < 0 ? 'error.main' : 'success.main'}
                  >
                    {remainingAmount < 0 ? '-' : ''}₹{Math.abs(remainingAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                  <Typography variant="caption" color={remainingAmount < 0 ? 'error.main' : 'text.secondary'}>
                    {remainingAmount < 0 ? 'Deficit / Overspent' : 'Available to spend'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Progress Bar Card */}
          <Card elevation={2} sx={{ borderRadius: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Monthly Budget Utilization
                </Typography>
                <Chip
                  label={
                    budgetAmount === 0
                      ? 'No Budget'
                      : isExceeded
                      ? `${percentUsed.toFixed(1)}% EXCEEDED`
                      : isWarning
                      ? `${percentUsed.toFixed(1)}% WARNING`
                      : `${percentUsed.toFixed(1)}% ON TRACK`
                  }
                  color={getProgressColor()}
                  variant={isHealthy ? 'outlined' : 'filled'}
                  size="small"
                  sx={{ fontWeight: 'bold' }}
                />
              </Box>

              <LinearProgress
                variant="determinate"
                value={Math.min(percentUsed, 100)}
                color={getProgressColor()}
                sx={{
                  height: 14,
                  borderRadius: 7,
                  bgcolor: 'action.hover',
                  mb: 1.5,
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 7,
                  },
                }}
              />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  Spent: <strong>₹{spentAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Target: <strong>₹{budgetAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Editable Field to Set / Update Monthly Budget */}
          <Card elevation={2} sx={{ borderRadius: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                {isEditing ? 'Update Monthly Budget' : 'Budget Settings'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Define how much you plan to spend in <strong>{monthName} {currentYear}</strong>. Antigravity Tracker will automatically track your progress and notify you when you reach 80% or exceed 100%.
              </Typography>

              {isEditing ? (
                <Box component="form" onSubmit={handleSaveBudget} noValidate sx={{ mt: 2 }}>
                  <Grid container spacing={2} alignItems="flex-start">
                    <Grid item xs={12} sm={7} md={6}>
                      <TextField
                        fullWidth
                        id="budgetAmount"
                        name="budgetAmount"
                        label="Monthly Budget Amount"
                        type="number"
                        inputProps={{ step: '100', min: '1' }}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                        }}
                        value={budgetAmountInput}
                        onChange={(e) => {
                          setBudgetAmountInput(e.target.value)
                          if (fieldError) setFieldError('')
                        }}
                        error={Boolean(fieldError)}
                        helperText={fieldError || `Applies to ${monthName} ${currentYear}`}
                        autoFocus
                        required
                      />
                    </Grid>

                    <Grid item xs={12} sm={5} md={6} sx={{ display: 'flex', gap: 1.5, pt: { sm: 1 } }}>
                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={saving}
                        startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                      >
                        {saving ? 'Saving...' : 'Save Budget'}
                      </Button>
                      <Button
                        variant="outlined"
                        color="inherit"
                        onClick={handleCancelEdit}
                        disabled={saving}
                        startIcon={<CancelIcon />}
                      >
                        Cancel
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                  <Typography variant="body1">
                    Current Limit: <strong>₹{budgetAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={handleStartEdit}
                  >
                    Change Limit
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Stack>
      )}
    </Box>
  )
}

export default Budget
