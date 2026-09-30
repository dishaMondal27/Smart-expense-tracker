import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  MenuItem,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Chip,
  Alert,
  CircularProgress,
  InputAdornment,
  Tabs,
  Tab,
  Stack,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Clear'
import FilterListIcon from '@mui/icons-material/FilterList'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import AutorenewIcon from '@mui/icons-material/Autorenew'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import ReceiptIcon from '@mui/icons-material/Receipt'
import expenseService from '../services/expenseService'
import recurringExpenseService from '../services/recurringExpenseService'

const PAYMENT_METHODS = [
  'All',
  'Cash',
  'UPI',
  'Debit Card',
  'Credit Card',
  'Net Banking',
  'Other',
]

const FORM_PAYMENT_METHODS = [
  'Cash',
  'UPI',
  'Debit Card',
  'Credit Card',
  'Net Banking',
  'Other',
]

function Expenses() {
  const navigate = useNavigate()
  const location = useLocation()

  // Tab state: 0 = Daily Expenses, 1 = Recurring Expenses
  const [activeTab, setActiveTab] = useState(0)

  // Expenses data state
  const [expenses, setExpenses] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [bannerMessage, setBannerMessage] = useState(location.state?.message || '')
  const [errorMessage, setErrorMessage] = useState('')

  // Recurring Expenses state
  const [recurringExpenses, setRecurringExpenses] = useState([])
  const [loadingRecurring, setLoadingRecurring] = useState(false)
  const [recModalOpen, setRecModalOpen] = useState(false)
  const [recModalMode, setRecModalMode] = useState('add') // 'add' | 'edit'
  const [recEditingId, setRecEditingId] = useState(null)
  const [recFormData, setRecFormData] = useState({
    name: '',
    amount: '',
    categoryId: '',
    frequency: 'MONTHLY',
    nextDueDate: new Date().toISOString().split('T')[0],
  })
  const [recFieldErrors, setRecFieldErrors] = useState({})
  const [recSubmitting, setRecSubmitting] = useState(false)
  const [recDeleteDialogOpen, setRecDeleteDialogOpen] = useState(false)
  const [recToDelete, setRecToDelete] = useState(null)
  const [recDeleting, setRecDeleting] = useState(false)
  const [triggeringJob, setTriggeringJob] = useState(false)

  // Filter & Search states
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('All')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Pagination state
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [expenseToDelete, setExpenseToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editFormData, setEditFormData] = useState({
    id: null,
    amount: '',
    categoryId: '',
    description: '',
    date: '',
    paymentMethod: 'UPI',
    notes: '',
  })
  const [editFieldErrors, setEditFieldErrors] = useState({})
  const [editSubmitting, setEditSubmitting] = useState(false)

  // Fetch recurring expenses
  const fetchRecurringExpenses = useCallback(async () => {
    try {
      setLoadingRecurring(true)
      const data = await recurringExpenseService.getRecurringExpenses()
      setRecurringExpenses(data || [])
    } catch (err) {
      console.error('Failed to load recurring expenses', err)
      setErrorMessage('Failed to load recurring expenses.')
    } finally {
      setLoadingRecurring(false)
    }
  }, [])

  // Fetch categories once
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const cats = await expenseService.getCategories()
        setCategories(cats)
      } catch (err) {
        console.error('Error loading categories:', err)
      }
    }
    fetchCats()
    fetchRecurringExpenses()
  }, [fetchRecurringExpenses])

  // Fetch expenses with active filters
  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true)
      setErrorMessage('')
      const params = {}
      if (startDate) params.startDate = startDate
      if (endDate) params.endDate = endDate
      if (selectedCategory) params.categoryId = selectedCategory
      if (selectedPaymentMethod && selectedPaymentMethod !== 'All') {
        params.paymentMethod = selectedPaymentMethod
      }
      if (search && search.trim()) params.search = search.trim()

      const data = await expenseService.getExpenses(params)
      setExpenses(data)
    } catch (err) {
      console.error('Failed to load expenses', err)
      setErrorMessage('Failed to load expenses. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate, selectedCategory, selectedPaymentMethod, search])

  useEffect(() => {
    fetchExpenses()
  }, [fetchExpenses])

  // Reset filters
  const handleClearFilters = () => {
    setSearch('')
    setSelectedCategory('')
    setSelectedPaymentMethod('All')
    setStartDate('')
    setEndDate('')
  }

  // Open Edit Modal
  const handleOpenEdit = (expense) => {
    setEditFormData({
      id: expense.id,
      amount: expense.amount.toString(),
      categoryId: expense.categoryId || '',
      description: expense.description || '',
      date: expense.date || '',
      paymentMethod: expense.paymentMethod || 'UPI',
      notes: expense.notes || '',
    })
    setEditFieldErrors({})
    setEditModalOpen(true)
  }

  const handleEditChange = (e) => {
    const { name, value } = e.target
    setEditFormData((prev) => ({ ...prev, [name]: value }))
    if (editFieldErrors[name]) {
      setEditFieldErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const validateEdit = () => {
    const errors = {}
    if (!editFormData.amount || isNaN(editFormData.amount) || parseFloat(editFormData.amount) <= 0) {
      errors.amount = 'Amount must be a positive number'
    }
    if (!editFormData.categoryId) {
      errors.categoryId = 'Category is required'
    }
    if (!editFormData.description || !editFormData.description.trim()) {
      errors.description = 'Description is required'
    }
    if (!editFormData.date) {
      errors.date = 'Date is required'
    } else {
      const selected = new Date(editFormData.date)
      const today = new Date()
      today.setHours(23, 59, 59, 999)
      if (selected > today) {
        errors.date = 'Date cannot be in the future'
      }
    }
    if (!editFormData.paymentMethod) {
      errors.paymentMethod = 'Payment method is required'
    }

    setEditFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSaveEdit = async () => {
    if (!validateEdit()) return

    try {
      setEditSubmitting(true)
      const payload = {
        amount: parseFloat(editFormData.amount),
        categoryId: Number(editFormData.categoryId),
        description: editFormData.description.trim(),
        date: editFormData.date,
        paymentMethod: editFormData.paymentMethod,
        notes: editFormData.notes ? editFormData.notes.trim() : null,
      }

      await expenseService.updateExpense(editFormData.id, payload)
      setEditModalOpen(false)
      setBannerMessage('Expense updated successfully!')
      fetchExpenses()
    } catch (err) {
      console.error('Failed to update expense', err)
      if (err.response?.data?.validationErrors) {
        setEditFieldErrors(err.response.data.validationErrors)
      } else {
        setErrorMessage(err.response?.data?.message || 'Failed to update expense.')
      }
    } finally {
      setEditSubmitting(false)
    }
  }

  // Open Delete confirmation
  const handleOpenDelete = (expense) => {
    setExpenseToDelete(expense)
    setDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!expenseToDelete) return
    try {
      setDeleting(true)
      await expenseService.deleteExpense(expenseToDelete.id)
      setDeleteModalOpen(false)
      setExpenseToDelete(null)
      setBannerMessage('Expense deleted successfully.')
      fetchExpenses()
    } catch (err) {
      console.error('Failed to delete expense', err)
      setErrorMessage(err.response?.data?.message || 'Failed to delete expense.')
    } finally {
      setDeleting(false)
    }
  }

  // Recurring Expenses handlers
  const handleOpenAddRecurring = () => {
    setRecModalMode('add')
    setRecEditingId(null)
    setRecFormData({
      name: '',
      amount: '',
      categoryId: categories.length > 0 ? categories[0].id : '',
      frequency: 'MONTHLY',
      nextDueDate: new Date().toISOString().split('T')[0],
    })
    setRecFieldErrors({})
    setRecModalOpen(true)
  }

  const handleOpenEditRecurring = (rec) => {
    setRecModalMode('edit')
    setRecEditingId(rec.id)
    setRecFormData({
      name: rec.name,
      amount: rec.amount.toString(),
      categoryId: rec.categoryId || (categories.length > 0 ? categories[0].id : ''),
      frequency: rec.frequency || 'MONTHLY',
      nextDueDate: rec.nextDueDate || new Date().toISOString().split('T')[0],
    })
    setRecFieldErrors({})
    setRecModalOpen(true)
  }

  const handleRecFormChange = (e) => {
    const { name, value } = e.target
    setRecFormData((prev) => ({ ...prev, [name]: value }))
    if (recFieldErrors[name]) {
      setRecFieldErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const validateRecForm = () => {
    const errors = {}
    if (!recFormData.name || !recFormData.name.trim()) {
      errors.name = 'Name / Description is required'
    }
    if (!recFormData.amount || isNaN(recFormData.amount) || parseFloat(recFormData.amount) <= 0) {
      errors.amount = 'Amount must be greater than 0'
    }
    if (!recFormData.categoryId) {
      errors.categoryId = 'Please select a category'
    }
    if (!recFormData.frequency) {
      errors.frequency = 'Frequency is required'
    }
    if (!recFormData.nextDueDate) {
      errors.nextDueDate = 'Next due date is required'
    }
    setRecFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSaveRecurring = async (e) => {
    e.preventDefault()
    if (!validateRecForm()) return

    try {
      setRecSubmitting(true)
      const payload = {
        name: recFormData.name.trim(),
        amount: parseFloat(recFormData.amount),
        categoryId: Number(recFormData.categoryId),
        frequency: recFormData.frequency,
        nextDueDate: recFormData.nextDueDate,
      }

      if (recModalMode === 'add') {
        await recurringExpenseService.createRecurringExpense(payload)
        setBannerMessage(`Recurring expense "${payload.name}" created successfully!`)
      } else {
        await recurringExpenseService.updateRecurringExpense(recEditingId, payload)
        setBannerMessage(`Recurring expense "${payload.name}" updated successfully!`)
      }

      setRecModalOpen(false)
      fetchRecurringExpenses()
    } catch (err) {
      console.error('Failed to save recurring expense', err)
      const msg = err.response?.data?.message || 'Failed to save recurring expense.'
      setErrorMessage(msg)
    } finally {
      setRecSubmitting(false)
    }
  }

  const handleOpenDeleteRecurring = (rec) => {
    setRecToDelete(rec)
    setRecDeleteDialogOpen(true)
  }

  const handleConfirmDeleteRecurring = async () => {
    if (!recToDelete) return
    try {
      setRecDeleting(true)
      await recurringExpenseService.deleteRecurringExpense(recToDelete.id)
      setRecDeleteDialogOpen(false)
      setRecToDelete(null)
      setBannerMessage('Recurring expense deleted successfully.')
      fetchRecurringExpenses()
    } catch (err) {
      console.error('Failed to delete recurring expense', err)
      setErrorMessage(err.response?.data?.message || 'Failed to delete recurring expense.')
    } finally {
      setRecDeleting(false)
    }
  }

  const handleTriggerJob = async () => {
    try {
      setTriggeringJob(true)
      const res = await recurringExpenseService.triggerJob()
      setBannerMessage(`Processed ${res.processedCount || 0} due recurring expense(s) into actual expenses!`)
      fetchRecurringExpenses()
      fetchExpenses()
    } catch (err) {
      console.error('Failed to trigger scheduled job', err)
      setErrorMessage(err.response?.data?.message || 'Failed to trigger scheduled job.')
    } finally {
      setTriggeringJob(false)
    }
  }

  // Calculate totals
  const totalAmount = expenses.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0)

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 1, sm: 2 } }}>
      {/* Header Banner */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          mb: 2.5,
          gap: 2,
        }}
      >
        <div>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Expenses
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your daily transactions and automated recurring subscriptions.
          </Typography>
        </div>

        <Stack direction="row" spacing={1.5}>
          {activeTab === 1 && (
            <Button
              variant="outlined"
              color="secondary"
              startIcon={triggeringJob ? <CircularProgress size={18} color="inherit" /> : <PlayArrowIcon />}
              onClick={handleTriggerJob}
              disabled={triggeringJob}
              sx={{ px: 2, py: 1, borderRadius: 2 }}
            >
              {triggeringJob ? 'Processing...' : 'Run Scheduled Check'}
            </Button>
          )}

          {activeTab === 0 ? (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => navigate('/expenses/add')}
              sx={{ px: 3, py: 1, borderRadius: 2 }}
            >
              Add Expense
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleOpenAddRecurring}
              sx={{ px: 3, py: 1, borderRadius: 2 }}
            >
              Add Recurring
            </Button>
          )}
        </Stack>
      </Box>

      {/* Tabs: Daily Expenses vs Recurring Expenses */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, val) => setActiveTab(val)}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab
            icon={<ReceiptIcon fontSize="small" />}
            iconPosition="start"
            label={`Daily Expenses (${expenses.length})`}
          />
          <Tab
            icon={<AutorenewIcon fontSize="small" />}
            iconPosition="start"
            label={`Recurring Expenses (${recurringExpenses.length})`}
          />
        </Tabs>
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

      {/* TAB 0: DAILY EXPENSES */}
      {activeTab === 0 && (
        <>
          {/* Filter and Search Panel */}
          <Card elevation={2} sx={{ mb: 3, borderRadius: 2 }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                <FilterListIcon fontSize="small" color="action" />
                <Typography variant="subtitle2" fontWeight="bold">
                  Filter Expenses
                </Typography>
              </Box>

              <Grid container spacing={2} alignItems="center">
                {/* Search */}
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Search"
                    placeholder="Description or notes..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                {/* Category */}
                <Grid item xs={12} sm={6} md={2.5}>
                  <TextField
                    fullWidth
                    size="small"
                    select
                    label="Category"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <MenuItem value="">All Categories</MenuItem>
                    {categories.map((cat) => (
                      <MenuItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                {/* Payment Method */}
                <Grid item xs={12} sm={6} md={2.5}>
                  <TextField
                    fullWidth
                    size="small"
                    select
                    label="Payment Method"
                    value={selectedPaymentMethod}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                  >
                    {PAYMENT_METHODS.map((method) => (
                      <MenuItem key={method} value={method}>
                        {method}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                {/* Start Date */}
                <Grid item xs={6} sm={3} md={1.7}>
                  <TextField
                    fullWidth
                    size="small"
                    label="From Date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                {/* End Date */}
                <Grid item xs={6} sm={3} md={1.7}>
                  <TextField
                    fullWidth
                    size="small"
                    label="To Date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                {/* Reset Button */}
                <Grid item xs={12} md={0.6} sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Tooltip title="Clear Filters">
                    <IconButton onClick={handleClearFilters} size="small" color="secondary">
                      <ClearIcon />
                    </IconButton>
                  </Tooltip>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Summary KPI Bar */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
              px: 1,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Showing <strong>{expenses.length}</strong> {expenses.length === 1 ? 'expense' : 'expenses'}
            </Typography>

            <Chip
              icon={<AttachMoneyIcon />}
              label={`Total: ₹${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 'bold' }}
            />
          </Box>

          {/* Expenses Table */}
          <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2 }}>
            <Table sx={{ minWidth: 650 }} aria-label="expenses table">
              <TableHead sx={{ backgroundColor: 'action.hover' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Payment Method</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    Amount (₹)
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                      <CircularProgress size={32} />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Loading expenses...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : expenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                      <Typography variant="subtitle1" color="text.secondary">
                        No expenses found
                      </Typography>
                      <Typography variant="body2" color="text.disabled" sx={{ mb: 2 }}>
                        Try changing your search/filters or record a new expense.
                      </Typography>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => navigate('/expenses/add')}
                      >
                        Add Expense
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  expenses
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((expense) => (
                    <TableRow
                      key={expense.id}
                      hover
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell>{expense.date}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {expense.description}
                        </Typography>
                        {expense.notes && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            {expense.notes}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={expense.categoryName || 'General'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={expense.paymentMethod}
                          size="small"
                          color="default"
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                        -₹{parseFloat(expense.amount).toFixed(2)}
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Edit Expense">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleOpenEdit(expense)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Expense">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleOpenDelete(expense)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={expenses.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10))
                setPage(0)
              }}
            />
          </TableContainer>
        </>
      )}

      {/* TAB 1: RECURRING EXPENSES */}
      {activeTab === 1 && (
        <Card elevation={2} sx={{ borderRadius: 2 }}>
          <TableContainer component={Paper} elevation={0}>
            <Table sx={{ minWidth: 650 }} aria-label="recurring expenses table">
              <TableHead sx={{ backgroundColor: 'action.hover' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Name / Subscription</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Frequency</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Next Due Date</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    Amount (₹)
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingRecurring ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                      <CircularProgress size={32} />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Loading recurring expenses...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : recurringExpenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                      <AutorenewIcon color="disabled" sx={{ fontSize: 48, mb: 1 }} />
                      <Typography variant="subtitle1" color="text.secondary">
                        No recurring expenses scheduled
                      </Typography>
                      <Typography variant="body2" color="text.disabled" sx={{ mb: 2 }}>
                        Set up automated subscriptions like Netflix, Rent, Gym, or Broadband.
                      </Typography>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={handleOpenAddRecurring}
                      >
                        Add First Recurring Expense
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  recurringExpenses.map((rec) => (
                    <TableRow
                      key={rec.id}
                      hover
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <AutorenewIcon fontSize="small" color="primary" />
                          <Typography variant="body2" fontWeight="medium">
                            {rec.name}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={rec.categoryName || 'General'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={rec.frequency}
                          size="small"
                          color={rec.frequency === 'WEEKLY' ? 'secondary' : 'primary'}
                          variant="filled"
                          sx={{ fontWeight: 'bold', fontSize: '0.72rem' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {rec.nextDueDate}
                        </Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                        ₹{parseFloat(rec.amount).toFixed(2)}
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Edit Recurring Expense">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleOpenEditRecurring(rec)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Recurring Expense">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleOpenDeleteRecurring(rec)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Edit Expense Dialog */}
      <Dialog
        open={editModalOpen}
        onClose={() => !editSubmitting && setEditModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 'bold' }}>Edit Expense</DialogTitle>
        <DialogContent dividers>
          <Box component="form" noValidate sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              {/* Amount */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="amount"
                  label="Amount"
                  type="number"
                  inputProps={{ step: '0.01', min: '0.01' }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
                  value={editFormData.amount}
                  onChange={handleEditChange}
                  error={Boolean(editFieldErrors.amount)}
                  helperText={editFieldErrors.amount}
                  required
                />
              </Grid>

              {/* Category */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  name="categoryId"
                  label="Category"
                  value={editFormData.categoryId}
                  onChange={handleEditChange}
                  error={Boolean(editFieldErrors.categoryId)}
                  helperText={editFieldErrors.categoryId}
                  required
                >
                  {categories.map((cat) => (
                    <MenuItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Description */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="description"
                  label="Description"
                  value={editFormData.description}
                  onChange={handleEditChange}
                  error={Boolean(editFieldErrors.description)}
                  helperText={editFieldErrors.description}
                  required
                />
              </Grid>

              {/* Date */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="date"
                  label="Date"
                  type="date"
                  value={editFormData.date}
                  onChange={handleEditChange}
                  error={Boolean(editFieldErrors.date)}
                  helperText={editFieldErrors.date}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>

              {/* Payment Method */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  name="paymentMethod"
                  label="Payment Method"
                  value={editFormData.paymentMethod}
                  onChange={handleEditChange}
                  error={Boolean(editFieldErrors.paymentMethod)}
                  helperText={editFieldErrors.paymentMethod}
                  required
                >
                  {FORM_PAYMENT_METHODS.map((method) => (
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
                  name="notes"
                  label="Optional Notes"
                  multiline
                  rows={2}
                  value={editFormData.notes}
                  onChange={handleEditChange}
                  error={Boolean(editFieldErrors.notes)}
                  helperText={editFieldErrors.notes}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditModalOpen(false)} disabled={editSubmitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveEdit}
            disabled={editSubmitting}
            startIcon={editSubmitting ? <CircularProgress size={18} color="inherit" /> : null}
          >
            {editSubmitting ? 'Saving...' : 'Update Expense'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteModalOpen}
        onClose={() => !deleting && setDeleteModalOpen(false)}
      >
        <DialogTitle sx={{ fontWeight: 'bold' }}>Delete Expense?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this expense:
            <br />
            <strong>"{expenseToDelete?.description}"</strong> for{' '}
            <strong>₹{expenseToDelete?.amount}</strong>?
            <br />
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteModalOpen(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={18} color="inherit" /> : null}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add / Edit Recurring Expense Dialog */}
      <Dialog
        open={recModalOpen}
        onClose={() => !recSubmitting && setRecModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          {recModalMode === 'add' ? 'Add Recurring Expense' : 'Edit Recurring Expense'}
        </DialogTitle>
        <Box component="form" onSubmit={handleSaveRecurring} noValidate>
          <DialogContent dividers>
            <Grid container spacing={2}>
              {/* Name */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="recName"
                  name="name"
                  label="Name / Description"
                  placeholder="e.g. Netflix Subscription, Apartment Rent, Gym Membership"
                  value={recFormData.name}
                  onChange={handleRecFormChange}
                  error={Boolean(recFieldErrors.name)}
                  helperText={recFieldErrors.name}
                  required
                  autoFocus
                />
              </Grid>

              {/* Amount */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="recAmount"
                  name="amount"
                  label="Amount"
                  type="number"
                  inputProps={{ step: '0.01', min: '0.01' }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
                  value={recFormData.amount}
                  onChange={handleRecFormChange}
                  error={Boolean(recFieldErrors.amount)}
                  helperText={recFieldErrors.amount}
                  required
                />
              </Grid>

              {/* Category */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  id="recCategoryId"
                  name="categoryId"
                  label="Category"
                  value={recFormData.categoryId}
                  onChange={handleRecFormChange}
                  error={Boolean(recFieldErrors.categoryId)}
                  helperText={recFieldErrors.categoryId}
                  required
                >
                  {categories.map((cat) => (
                    <MenuItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Frequency */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  id="recFrequency"
                  name="frequency"
                  label="Frequency"
                  value={recFormData.frequency}
                  onChange={handleRecFormChange}
                  error={Boolean(recFieldErrors.frequency)}
                  helperText={recFieldErrors.frequency}
                  required
                >
                  <MenuItem value="MONTHLY">Monthly</MenuItem>
                  <MenuItem value="WEEKLY">Weekly</MenuItem>
                </TextField>
              </Grid>

              {/* Next Due Date */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="recNextDueDate"
                  name="nextDueDate"
                  label="Next Due Date"
                  type="date"
                  value={recFormData.nextDueDate}
                  onChange={handleRecFormChange}
                  error={Boolean(recFieldErrors.nextDueDate)}
                  helperText={recFieldErrors.nextDueDate}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setRecModalOpen(false)} disabled={recSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={recSubmitting}
              startIcon={recSubmitting ? <CircularProgress size={18} color="inherit" /> : null}
            >
              {recSubmitting
                ? 'Saving...'
                : recModalMode === 'add'
                ? 'Create Recurring Expense'
                : 'Update Recurring Expense'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Delete Recurring Expense Dialog */}
      <Dialog
        open={recDeleteDialogOpen}
        onClose={() => !recDeleting && setRecDeleteDialogOpen(false)}
      >
        <DialogTitle sx={{ fontWeight: 'bold' }}>Delete Recurring Expense?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to stop and delete recurring expense:
            <br />
            <strong>"{recToDelete?.name}"</strong> for <strong>₹{recToDelete?.amount}</strong> ({recToDelete?.frequency})?
            <br />
            Past recorded expenses will remain intact.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setRecDeleteDialogOpen(false)} disabled={recDeleting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDeleteRecurring}
            disabled={recDeleting}
            startIcon={recDeleting ? <CircularProgress size={18} color="inherit" /> : null}
          >
            {recDeleting ? 'Deleting...' : 'Delete Recurring'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Expenses
