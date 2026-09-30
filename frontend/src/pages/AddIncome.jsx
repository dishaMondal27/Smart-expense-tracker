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
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import SaveIcon from '@mui/icons-material/Save'
import incomeService from '../services/incomeService'
import categoryService from '../services/categoryService'

function AddIncome() {
  const navigate = useNavigate()

  // Form state
  const [formData, setFormData] = useState({
    amount: '',
    source: '',
    date: new Date().toISOString().split('T')[0], // today in YYYY-MM-DD
    description: '',
  })

  const [categories, setCategories] = useState([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [generalError, setGeneralError] = useState('')

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoadingCategories(true)
        const cats = await categoryService.getCategories('INCOME')
        setCategories(cats)
        if (cats && cats.length > 0) {
          setFormData((prev) => ({ ...prev, source: cats[0].name }))
        }
      } catch (err) {
        console.error('Failed to load income categories', err)
        setGeneralError('Failed to load income categories.')
      } finally {
        setLoadingCategories(false)
      }
    }
    loadCategories()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
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

    // Source validation
    if (!formData.source) {
      errors.source = 'Income source is required'
    }

    // Date validation: not in the future
    if (!formData.date) {
      errors.date = 'Date is required'
    } else {
      const selectedDate = new Date(formData.date)
      const today = new Date()
      today.setHours(23, 59, 59, 999)
      if (selectedDate > today) {
        errors.date = 'Income date cannot be in the future'
      }
    }

    // Description length validation
    if (formData.description && formData.description.trim().length > 255) {
      errors.description = 'Description must not exceed 255 characters'
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
        source: formData.source,
        date: formData.date,
        description: formData.description ? formData.description.trim() : null,
      }

      await incomeService.createIncome(payload)
      navigate('/income', { state: { message: 'Income added successfully!' } })
    } catch (err) {
      console.error('Failed to create income', err)
      if (err.response?.data?.validationErrors) {
        setFieldErrors(err.response.data.validationErrors)
      } else if (err.response?.data?.message) {
        setGeneralError(err.response.data.message)
      } else {
        setGeneralError('Failed to record income. Please check your network and try again.')
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
          onClick={() => navigate('/income')}
          size="small"
        >
          Back to Income
        </Button>
      </Box>

      <Card elevation={2} sx={{ borderRadius: 2 }}>
        <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
          <Typography variant="h5" component="h1" fontWeight="bold" gutterBottom>
            Add New Income
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Record an incoming revenue stream to track your total earnings and savings.
          </Typography>

          {generalError && (
            <Alert severity="error" sx={{ mb: 3 }}>
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

              {/* Source */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  id="source"
                  name="source"
                  label="Source / Category"
                  value={formData.source}
                  onChange={handleChange}
                  error={Boolean(fieldErrors.source)}
                  helperText={fieldErrors.source}
                  disabled={loadingCategories}
                  required
                >
                  {loadingCategories ? (
                    <MenuItem disabled value="">
                      <em>Loading categories...</em>
                    </MenuItem>
                  ) : (
                    categories.map((cat) => (
                      <MenuItem key={cat.id} value={cat.name}>
                        {cat.name}
                      </MenuItem>
                    ))
                  )}
                </TextField>
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

              {/* Description */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="description"
                  name="description"
                  label="Description / Details"
                  placeholder="e.g. October monthly salary, Web design contract"
                  value={formData.description}
                  onChange={handleChange}
                  error={Boolean(fieldErrors.description)}
                  helperText={fieldErrors.description}
                />
              </Grid>

              {/* Form Actions */}
              <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 1 }}>
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={() => navigate('/income')}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="success"
                  startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : 'Save Income'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}

export default AddIncome
