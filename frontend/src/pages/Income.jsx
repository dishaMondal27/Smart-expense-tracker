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
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Clear'
import FilterListIcon from '@mui/icons-material/FilterList'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import incomeService from '../services/incomeService'
import categoryService from '../services/categoryService'

const FILTER_SOURCES = [
  'All',
  'Salary',
  'Freelancing',
  'Scholarship',
  'Business',
  'Gift',
  'Other',
]

const INCOME_SOURCES = [
  'Salary',
  'Freelancing',
  'Scholarship',
  'Business',
  'Gift',
  'Other',
]

function Income() {
  const navigate = useNavigate()
  const location = useLocation()

  // Incomes data state
  const [incomes, setIncomes] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [bannerMessage, setBannerMessage] = useState(location.state?.message || '')
  const [errorMessage, setErrorMessage] = useState('')

  // Filter & Search states
  const [search, setSearch] = useState('')
  const [selectedSource, setSelectedSource] = useState('All')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Pagination state
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  // Fetch income categories
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const cats = await categoryService.getCategories('INCOME')
        setCategories(cats)
      } catch (err) {
        console.error('Failed to load income categories:', err)
      }
    }
    fetchCats()
  }, [])

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [incomeToDelete, setIncomeToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editFormData, setEditFormData] = useState({
    id: null,
    amount: '',
    source: 'Salary',
    date: '',
    description: '',
  })
  const [editFieldErrors, setEditFieldErrors] = useState({})
  const [editSubmitting, setEditSubmitting] = useState(false)

  // Fetch incomes with active filters
  const fetchIncomes = useCallback(async () => {
    try {
      setLoading(true)
      setErrorMessage('')
      const params = {}
      if (startDate) params.startDate = startDate
      if (endDate) params.endDate = endDate
      if (selectedSource && selectedSource !== 'All') {
        params.source = selectedSource
      }
      if (search && search.trim()) params.search = search.trim()

      const data = await incomeService.getIncomes(params)
      setIncomes(data)
    } catch (err) {
      console.error('Failed to load income records', err)
      setErrorMessage('Failed to load income records. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate, selectedSource, search])

  useEffect(() => {
    fetchIncomes()
  }, [fetchIncomes])

  // Reset filters
  const handleClearFilters = () => {
    setSearch('')
    setSelectedSource('All')
    setStartDate('')
    setEndDate('')
  }

  // Open Edit Modal
  const handleOpenEdit = (income) => {
    setEditFormData({
      id: income.id,
      amount: income.amount.toString(),
      source: income.source || 'Salary',
      date: income.date || '',
      description: income.description || '',
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
      errors.amount = 'Amount must be a positive number greater than 0'
    }
    if (!editFormData.source) {
      errors.source = 'Income source is required'
    }
    if (!editFormData.date) {
      errors.date = 'Date is required'
    } else {
      const selected = new Date(editFormData.date)
      const today = new Date()
      today.setHours(23, 59, 59, 999)
      if (selected > today) {
        errors.date = 'Income date cannot be in the future'
      }
    }
    if (editFormData.description && editFormData.description.trim().length > 255) {
      errors.description = 'Description must not exceed 255 characters'
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
        source: editFormData.source,
        date: editFormData.date,
        description: editFormData.description ? editFormData.description.trim() : null,
      }

      await incomeService.updateIncome(editFormData.id, payload)
      setEditModalOpen(false)
      setBannerMessage('Income updated successfully!')
      fetchIncomes()
    } catch (err) {
      console.error('Failed to update income', err)
      if (err.response?.data?.validationErrors) {
        setEditFieldErrors(err.response.data.validationErrors)
      } else {
        setErrorMessage(err.response?.data?.message || 'Failed to update income.')
      }
    } finally {
      setEditSubmitting(false)
    }
  }

  // Open Delete confirmation
  const handleOpenDelete = (income) => {
    setIncomeToDelete(income)
    setDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!incomeToDelete) return
    try {
      setDeleting(true)
      await incomeService.deleteIncome(incomeToDelete.id)
      setDeleteModalOpen(false)
      setIncomeToDelete(null)
      setBannerMessage('Income record deleted successfully.')
      fetchIncomes()
    } catch (err) {
      console.error('Failed to delete income', err)
      setErrorMessage(err.response?.data?.message || 'Failed to delete income.')
    } finally {
      setDeleting(false)
    }
  }

  // Calculate totals
  const totalIncome = incomes.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0)

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 1, sm: 2 } }}>
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
            Income
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your incoming cash flow, salary, freelancing, and other earnings.
          </Typography>
        </div>

        <Button
          variant="contained"
          color="success"
          startIcon={<AddIcon />}
          onClick={() => navigate('/income/add')}
          sx={{ px: 3, py: 1, borderRadius: 2 }}
        >
          Add Income
        </Button>
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

      {/* Filter and Search Panel */}
      <Card elevation={2} sx={{ mb: 3, borderRadius: 2 }}>
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
            <FilterListIcon fontSize="small" color="action" />
            <Typography variant="subtitle2" fontWeight="bold">
              Filter Income
            </Typography>
          </Box>

          <Grid container spacing={2} alignItems="center">
            {/* Search */}
            <Grid item xs={12} sm={6} md={3.5}>
              <TextField
                fullWidth
                size="small"
                label="Search"
                placeholder="Description or source..."
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

            {/* Source */}
            <Grid item xs={12} sm={6} md={2.5}>
              <TextField
                fullWidth
                size="small"
                select
                label="Source"
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
              >
                <MenuItem value="All">All Sources</MenuItem>
                {categories.length > 0
                  ? categories.map((cat) => (
                      <MenuItem key={cat.id} value={cat.name}>
                        {cat.name}
                      </MenuItem>
                    ))
                  : FILTER_SOURCES.filter((s) => s !== 'All').map((source) => (
                      <MenuItem key={source} value={source}>
                        {source}
                      </MenuItem>
                    ))}
              </TextField>
            </Grid>

            {/* Start Date */}
            <Grid item xs={6} sm={3} md={2.5}>
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
            <Grid item xs={6} sm={3} md={2.5}>
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
            <Grid item xs={12} md={1} sx={{ display: 'flex', justifyContent: 'center' }}>
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
          Showing <strong>{incomes.length}</strong> {incomes.length === 1 ? 'record' : 'records'}
        </Typography>

        <Chip
          icon={<TrendingUpIcon />}
          label={`Total Income: ₹${totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          color="success"
          variant="outlined"
          sx={{ fontWeight: 'bold' }}
        />
      </Box>

      {/* Incomes Table */}
      <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2 }}>
        <Table sx={{ minWidth: 650 }} aria-label="income table">
          <TableHead sx={{ backgroundColor: 'action.hover' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Source</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
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
                <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={32} />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Loading income records...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : incomes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                  <Typography variant="subtitle1" color="text.secondary">
                    No income records found
                  </Typography>
                  <Typography variant="body2" color="text.disabled" sx={{ mb: 2 }}>
                    Try changing your search/filters or record new income.
                  </Typography>
                  <Button
                    variant="contained"
                    color="success"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/income/add')}
                  >
                    Add Income
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              incomes
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((item) => (
                <TableRow
                  key={item.id}
                  hover
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell>{item.date}</TableCell>
                  <TableCell>
                    <Chip
                      label={item.source}
                      size="small"
                      color="success"
                      variant="outlined"
                      sx={{ fontWeight: 'bold' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {item.description || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                    +₹{parseFloat(item.amount).toFixed(2)}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Edit Income">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpenEdit(item)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Income">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleOpenDelete(item)}
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
          count={incomes.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10))
            setPage(0)
          }}
        />
      </TableContainer>

      {/* Edit Income Dialog */}
      <Dialog
        open={editModalOpen}
        onClose={() => !editSubmitting && setEditModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 'bold' }}>Edit Income</DialogTitle>
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

              {/* Source */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  name="source"
                  label="Source"
                  value={editFormData.source}
                  onChange={handleEditChange}
                  error={Boolean(editFieldErrors.source)}
                  helperText={editFieldErrors.source}
                  required
                >
                  {categories.length > 0
                    ? categories.map((cat) => (
                        <MenuItem key={cat.id} value={cat.name}>
                          {cat.name}
                        </MenuItem>
                      ))
                    : INCOME_SOURCES.map((source) => (
                        <MenuItem key={source} value={source}>
                          {source}
                        </MenuItem>
                      ))}
                </TextField>
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

              {/* Description */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="description"
                  label="Description"
                  value={editFormData.description}
                  onChange={handleEditChange}
                  error={Boolean(editFieldErrors.description)}
                  helperText={editFieldErrors.description}
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
            color="success"
            onClick={handleSaveEdit}
            disabled={editSubmitting}
            startIcon={editSubmitting ? <CircularProgress size={18} color="inherit" /> : null}
          >
            {editSubmitting ? 'Saving...' : 'Update Income'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteModalOpen}
        onClose={() => !deleting && setDeleteModalOpen(false)}
      >
        <DialogTitle sx={{ fontWeight: 'bold' }}>Delete Income?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this income entry:
            <br />
            <strong>"{incomeToDelete?.source}"</strong> ({incomeToDelete?.description || 'No description'}) for{' '}
            <strong>₹{incomeToDelete?.amount}</strong>?
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
    </Box>
  )
}

export default Income
