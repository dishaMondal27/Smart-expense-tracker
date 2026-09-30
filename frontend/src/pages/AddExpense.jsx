import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  MenuItem,
  Grid,
  Alert,
  CircularProgress,
  InputAdornment,
  Chip,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import SaveIcon from '@mui/icons-material/Save'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import expenseService from '../services/expenseService'

const PAYMENT_METHODS = [
  'Cash',
  'UPI',
  'Debit Card',
  'Credit Card',
  'Net Banking',
  'Other',
]

function AddExpense() {
  const navigate = useNavigate()

  // Form state
  const [formData, setFormData] = useState({
    amount: '',
    categoryId: '',
    description: '',
    date: new Date().toISOString().split('T')[0], // today in YYYY-MM-DD
    paymentMethod: 'UPI',
    notes: '',
  })

  const [categories, setCategories] = useState([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [generalError, setGeneralError] = useState('')
  const [scanSuccessMessage, setScanSuccessMessage] = useState('')
  const [suggestedCategoryInfo, setSuggestedCategoryInfo] = useState(null)
  const [isSuggesting, setIsSuggesting] = useState(false)
  const [manuallyChangedCategory, setManuallyChangedCategory] = useState(false)
  const [scanningReceipt, setScanningReceipt] = useState(false)

  const handleReceiptUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setScanningReceipt(true)
      setGeneralError('')
      setScanSuccessMessage('')

      const result = await expenseService.scanReceipt(file)

      if (result && result.success) {
        setFormData((prev) => ({
          ...prev,
          amount: result.amount ? String(result.amount) : prev.amount,
          description: result.merchantName ? result.merchantName : prev.description,
          date: result.date ? result.date : prev.date,
          notes: prev.notes ? prev.notes : (result.rawText ? `OCR Scan: ${result.rawText.substring(0, 100).replace(/\r?\n/g, ' ')}...` : ''),
        }))

        // Pre-fill suggested category if matched
        if (result.suggestedCategory && categories.length > 0) {
          const matched = categories.find(
            (c) => c.name.toLowerCase() === result.suggestedCategory.toLowerCase()
          )
          if (matched) {
            setFormData((prev) => ({ ...prev, categoryId: matched.id }))
            setSuggestedCategoryInfo({
              suggestedCategory: result.suggestedCategory,
              matchedKeyword: result.merchantName,
            })
          }
        }

        setScanSuccessMessage(
          `Receipt scanned successfully! Pre-filled: ${result.merchantName || 'Merchant'} ${
            result.amount ? `(₹${result.amount})` : ''
          }. Please review and adjust if needed.`
        )
      } else {
        setGeneralError(
          result?.message || 'Could not extract details from receipt. Please enter details manually.'
        )
      }
    } catch (err) {
      console.error('Failed to scan receipt', err)
      setGeneralError(
        'Receipt scan failed. Please check that the image is clear or fill in the details manually.'
      )
    } finally {
      setScanningReceipt(false)
      // reset file input
      event.target.value = ''
    }
  }

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoadingCategories(true)
        const cats = await expenseService.getCategories()
        setCategories(cats)
        if (cats && cats.length > 0) {
          setFormData((prev) => ({ ...prev, categoryId: cats[0].id }))
        }
      } catch (err) {
        console.error('Failed to load categories', err)
        setGeneralError('Failed to load categories. Please try again.')
      } finally {
        setLoadingCategories(false)
      }
    }

    loadCategories()
  }, [])

  // Debounced Category Suggestion based on description
  useEffect(() => {
    const desc = formData.description?.trim()
    if (!desc || desc.length < 2) {
      setSuggestedCategoryInfo(null)
      return
    }

    const timer = setTimeout(async () => {
      try {
        setIsSuggesting(true)
        const res = await expenseService.suggestCategory(desc)
        if (res && res.suggestedCategory) {
          setSuggestedCategoryInfo(res)
          // Find matching category in categories list
          const matchedCat = categories.find(
            (c) => c.name.toLowerCase() === res.suggestedCategory.toLowerCase()
          )
          // If found and user has not explicitly hand-picked a different category (or user wants suggestion pre-filled)
          if (matchedCat && !manuallyChangedCategory) {
            setFormData((prev) => ({
              ...prev,
              categoryId: matchedCat.id,
            }))
          }
        } else {
          setSuggestedCategoryInfo(null)
        }
      } catch (err) {
        console.warn('Category suggestion error:', err)
      } finally {
        setIsSuggesting(false)
      }
    }, 400) // 400ms debounce

    return () => clearTimeout(timer)
  }, [formData.description, categories, manuallyChangedCategory])

  const handleChange = (e) => {
    const { name, value } = e.target

    if (name === 'categoryId') {
      setManuallyChangedCategory(true)
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Clear inline error when typing
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({
        ...prev,
        [name]: '',
      }))
    }
    if (generalError) {
      setGeneralError('')
    }
  }

  const validate = () => {
    const errors = {}

    // Amount validation: > 0
    if (!formData.amount) {
      errors.amount = 'Amount is required'
    } else if (isNaN(formData.amount) || parseFloat(formData.amount) <= 0) {
      errors.amount = 'Amount must be a positive number greater than 0'
    }

    // Category validation
    if (!formData.categoryId) {
      errors.categoryId = 'Please select a category'
    }

    // Description validation
    if (!formData.description || !formData.description.trim()) {
      errors.description = 'Description is required'
    } else if (formData.description.trim().length > 255) {
      errors.description = 'Description must not exceed 255 characters'
    }

    // Date validation: not in the future
    if (!formData.date) {
      errors.date = 'Date is required'
    } else {
      const selectedDate = new Date(formData.date)
      const today = new Date()
      today.setHours(23, 59, 59, 999)
      if (selectedDate > today) {
        errors.date = 'Expense date cannot be in the future'
      }
    }

    // Payment method validation
    if (!formData.paymentMethod) {
      errors.paymentMethod = 'Payment method is required'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    try {
      setSubmitting(true)
      setGeneralError('')

      const payload = {
        amount: parseFloat(formData.amount),
        categoryId: Number(formData.categoryId),
        description: formData.description.trim(),
        date: formData.date,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes ? formData.notes.trim() : null,
      }

      await expenseService.createExpense(payload)
      navigate('/expenses', { state: { message: 'Expense added successfully!' } })
    } catch (err) {
      console.error('Failed to create expense', err)
      if (err.response?.data?.validationErrors) {
        setFieldErrors(err.response.data.validationErrors)
      } else if (err.response?.data?.message) {
        setGeneralError(err.response.data.message)
      } else {
        setGeneralError('Failed to record expense. Please check your network and try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: { xs: 1, sm: 2 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/expenses')}
          size="small"
        >
          Back to Expenses
        </Button>
      </Box>

      <Card elevation={2} sx={{ borderRadius: 2 }}>
        <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
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
              <Typography variant="h5" component="h1" fontWeight="bold">
                Add New Expense
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Record an expense manually or upload a physical/digital receipt.
              </Typography>
            </div>

            {/* Receipt Upload Action */}
            <Box>
              <input
                accept="image/*,.pdf"
                style={{ display: 'none' }}
                id="receipt-file-input"
                type="file"
                onChange={handleReceiptUpload}
                disabled={scanningReceipt}
              />
              <label htmlFor="receipt-file-input">
                <Button
                  variant="outlined"
                  component="span"
                  color="secondary"
                  disabled={scanningReceipt}
                  startIcon={
                    scanningReceipt ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : (
                      <ReceiptLongIcon />
                    )
                  }
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  {scanningReceipt ? 'Scanning Receipt...' : 'Upload Receipt'}
                </Button>
              </label>
            </Box>
          </Box>

          {scanSuccessMessage && (
            <Alert
              severity="success"
              onClose={() => setScanSuccessMessage('')}
              sx={{ mb: 3 }}
            >
              {scanSuccessMessage}
            </Alert>
          )}

          {generalError && (
            <Alert severity="error" onClose={() => setGeneralError('')} sx={{ mb: 3 }}>
              {generalError}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Grid container spacing={3}>
              {/* Amount */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="amount"
                  name="amount"
                  label="Amount"
                  type="number"
                  inputProps={{ step: '0.01', min: '0.01' }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
                  value={formData.amount}
                  onChange={handleChange}
                  error={Boolean(fieldErrors.amount)}
                  helperText={fieldErrors.amount}
                  required
                />
              </Grid>

              {/* Description */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="description"
                  name="description"
                  label="Description / Purpose"
                  placeholder="e.g. Grocery shopping at DMart, Uber cab to airport, Netflix"
                  value={formData.description}
                  onChange={handleChange}
                  error={Boolean(fieldErrors.description)}
                  helperText={
                    fieldErrors.description ||
                    'Type your expense details — we will automatically suggest a matching category.'
                  }
                  required
                />
              </Grid>

              {/* Category with Auto-Suggestion indicator */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  id="categoryId"
                  name="categoryId"
                  label="Category"
                  value={formData.categoryId}
                  onChange={handleChange}
                  error={Boolean(fieldErrors.categoryId)}
                  helperText={
                    fieldErrors.categoryId ||
                    (suggestedCategoryInfo?.suggestedCategory
                      ? `Suggested based on keyword "${suggestedCategoryInfo.matchedKeyword}"`
                      : 'Select or keep suggested category')
                  }
                  disabled={loadingCategories}
                  required
                >
                  {loadingCategories ? (
                    <MenuItem disabled value="">
                      <em>Loading categories...</em>
                    </MenuItem>
                  ) : (
                    categories.map((cat) => (
                      <MenuItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </MenuItem>
                    ))
                  )}
                </TextField>

                {/* Visual badge when category is auto-suggested */}
                {suggestedCategoryInfo?.suggestedCategory && (
                  <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      icon={<AutoAwesomeIcon sx={{ fontSize: '16px !important' }} />}
                      label={`Suggested: ${suggestedCategoryInfo.suggestedCategory}`}
                      size="small"
                      color="primary"
                      variant="outlined"
                      clickable
                      onClick={() => {
                        const matched = categories.find(
                          (c) =>
                            c.name.toLowerCase() ===
                            suggestedCategoryInfo.suggestedCategory.toLowerCase()
                        )
                        if (matched) {
                          setFormData((prev) => ({ ...prev, categoryId: matched.id }))
                          setManuallyChangedCategory(false)
                        }
                      }}
                    />
                    {manuallyChangedCategory && (
                      <Typography variant="caption" color="text.secondary">
                        (Overridden manually)
                      </Typography>
                    )}
                  </Box>
                )}
              </Grid>

              {/* Date */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="date"
                  name="date"
                  label="Date"
                  type="date"
                  value={formData.date}
                  onChange={handleChange}
                  error={Boolean(fieldErrors.date)}
                  helperText={fieldErrors.date}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>

              {/* Payment Method */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  id="paymentMethod"
                  name="paymentMethod"
                  label="Payment Method"
                  value={formData.paymentMethod}
                  onChange={handleChange}
                  error={Boolean(fieldErrors.paymentMethod)}
                  helperText={fieldErrors.paymentMethod}
                  required
                >
                  {PAYMENT_METHODS.map((method) => (
                    <MenuItem key={method} value={method}>
                      {method}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Notes */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="notes"
                  name="notes"
                  label="Optional Notes"
                  placeholder="Additional context, invoice number, or reminders..."
                  multiline
                  rows={3}
                  value={formData.notes}
                  onChange={handleChange}
                  error={Boolean(fieldErrors.notes)}
                  helperText={fieldErrors.notes}
                />
              </Grid>

              {/* Form Actions */}
              <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 1 }}>
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={() => navigate('/expenses')}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                  disabled={submitting || loadingCategories}
                >
                  {submitting ? 'Saving...' : 'Save Expense'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}

export default AddExpense
