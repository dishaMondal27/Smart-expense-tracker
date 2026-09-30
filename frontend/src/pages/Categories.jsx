import { useState, useEffect, useCallback, useMemo } from 'react'
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
  Tabs,
  Tab,
  Stack,
  InputAdornment,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import SearchIcon from '@mui/icons-material/Search'
import CategoryIcon from '@mui/icons-material/Category'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import categoryService from '../services/categoryService'

function Categories() {
  // Tab state: 0 -> Expense, 1 -> Income
  const [activeTab, setActiveTab] = useState(0)

  // Categories state
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [bannerMessage, setBannerMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  // Add / Edit Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('add') // 'add' | 'edit'
  const [editingCategoryId, setEditingCategoryId] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    type: 'EXPENSE',
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  // Delete Dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  // Fetch all categories
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true)
      setErrorMessage('')
      const data = await categoryService.getCategories()
      setCategories(data || [])
    } catch (err) {
      console.error('Failed to load categories', err)
      setErrorMessage('Failed to load categories. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  // Filtered categories based on active tab and search
  const currentType = activeTab === 0 ? 'EXPENSE' : 'INCOME'

  const filteredCategories = useMemo(() => {
    return categories
      .filter((cat) => cat.type?.toUpperCase() === currentType)
      .filter((cat) => {
        if (!search.trim()) return true
        return cat.name.toLowerCase().includes(search.trim().toLowerCase())
      })
  }, [categories, currentType, search])

  const expenseCount = useMemo(
    () => categories.filter((c) => c.type?.toUpperCase() === 'EXPENSE').length,
    [categories],
  )
  const incomeCount = useMemo(
    () => categories.filter((c) => c.type?.toUpperCase() === 'INCOME').length,
    [categories],
  )

  // Open Add Modal
  const handleOpenAdd = () => {
    setModalMode('add')
    setEditingCategoryId(null)
    setFormData({
      name: '',
      type: currentType,
    })
    setFieldErrors({})
    setErrorMessage('')
    setModalOpen(true)
  }

  // Open Edit Modal
  const handleOpenEdit = (category) => {
    setModalMode('edit')
    setEditingCategoryId(category.id)
    setFormData({
      name: category.name,
      type: category.type.toUpperCase(),
    })
    setFieldErrors({})
    setErrorMessage('')
    setModalOpen(true)
  }

  // Handle Form Change
  const handleFormChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  // Validate Add/Edit Form
  const validateForm = () => {
    const errors = {}
    if (!formData.name || !formData.name.trim()) {
      errors.name = 'Category name is required'
    } else if (formData.name.trim().length > 100) {
      errors.name = 'Category name cannot exceed 100 characters'
    }

    if (!formData.type) {
      errors.type = 'Category type is required'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle Add/Edit Submit
  const handleFormSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      setSubmitting(true)
      const payload = {
        name: formData.name.trim(),
        type: formData.type.toUpperCase(),
      }

      if (modalMode === 'add') {
        await categoryService.createCategory(payload)
        setBannerMessage(`Category "${payload.name}" created successfully!`)
      } else {
        await categoryService.updateCategory(editingCategoryId, payload)
        setBannerMessage(`Category "${payload.name}" updated successfully!`)
      }

      setModalOpen(false)
      fetchCategories()
    } catch (err) {
      console.error('Failed to save category', err)
      const backendMsg = err.response?.data?.message || err.response?.data?.error
      if (err.response?.data?.validationErrors) {
        setFieldErrors(err.response.data.validationErrors)
      } else if (backendMsg) {
        setErrorMessage(backendMsg)
      } else {
        setErrorMessage('Failed to save category. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  // Open Delete Confirmation
  const handleOpenDelete = (category) => {
    setCategoryToDelete(category)
    setDeleteError('')
    setDeleteDialogOpen(true)
  }

  // Handle Delete Confirmation
  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return

    try {
      setDeleting(true)
      setDeleteError('')
      await categoryService.deleteCategory(categoryToDelete.id)
      setDeleteDialogOpen(false)
      setBannerMessage(`Category "${categoryToDelete.name}" deleted successfully.`)
      setCategoryToDelete(null)
      fetchCategories()
    } catch (err) {
      console.error('Failed to delete category', err)
      const backendMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Cannot delete this category. It may be currently used by one or more records.'
      setDeleteError(backendMsg)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', p: { xs: 1, sm: 2 } }}>
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
            Categories
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Organize your transactions into customizable Expense and Income categories.
          </Typography>
        </div>

        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenAdd}
          sx={{ px: 3, py: 1, borderRadius: 2 }}
        >
          Add Category
        </Button>
      </Box>

      {/* Success / Error Banners */}
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

      {/* KPI Counters */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6}>
          <Card
            elevation={1}
            sx={{
              borderRadius: 2,
              borderLeft: '4px solid',
              borderColor: 'error.main',
            }}
          >
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
              <AccountBalanceWalletIcon color="error" sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight="bold">
                  EXPENSE CATEGORIES
                </Typography>
                <Typography variant="h5" fontWeight="bold">
                  {expenseCount}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Card
            elevation={1}
            sx={{
              borderRadius: 2,
              borderLeft: '4px solid',
              borderColor: 'success.main',
            }}
          >
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
              <TrendingUpIcon color="success" sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight="bold">
                  INCOME CATEGORIES
                </Typography>
                <Typography variant="h5" fontWeight="bold">
                  {incomeCount}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Category Panel */}
      <Card elevation={2} sx={{ borderRadius: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2, pt: 1 }}>
          <Tabs
            value={activeTab}
            onChange={(e, val) => {
              setActiveTab(val)
              setSearch('')
            }}
            indicatorColor="primary"
            textColor="primary"
          >
            <Tab
              icon={<AccountBalanceWalletIcon fontSize="small" />}
              iconPosition="start"
              label={`Expense Categories (${expenseCount})`}
            />
            <Tab
              icon={<TrendingUpIcon fontSize="small" />}
              iconPosition="start"
              label={`Income Categories (${incomeCount})`}
            />
          </Tabs>
        </Box>

        {/* Toolbar: Search */}
        <Box
          sx={{
            p: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
            flexWrap: 'wrap',
          }}
        >
          <TextField
            size="small"
            placeholder={`Search ${currentType.toLowerCase()} categories...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ width: { xs: '100%', sm: 300 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />

          <Typography variant="body2" color="text.secondary">
            Showing <strong>{filteredCategories.length}</strong>{' '}
            {filteredCategories.length === 1 ? 'category' : 'categories'}
          </Typography>
        </Box>

        {/* Categories Table */}
        <TableContainer component={Paper} elevation={0}>
          <Table sx={{ minWidth: 500 }} aria-label="categories table">
            <TableHead sx={{ backgroundColor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Category Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', width: 140 }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={32} />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Loading categories...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : filteredCategories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ py: 6 }}>
                    <CategoryIcon color="disabled" sx={{ fontSize: 48, mb: 1 }} />
                    <Typography variant="subtitle1" color="text.secondary">
                      No categories found
                    </Typography>
                    <Typography variant="body2" color="text.disabled" sx={{ mb: 2 }}>
                      {search
                        ? 'No categories match your search keyword.'
                        : `No ${currentType.toLowerCase()} categories added yet.`}
                    </Typography>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={handleOpenAdd}
                    >
                      Add First Category
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCategories.map((cat) => (
                  <TableRow
                    key={cat.id}
                    hover
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <CategoryIcon
                          fontSize="small"
                          color={cat.type?.toUpperCase() === 'EXPENSE' ? 'error' : 'success'}
                        />
                        <Typography variant="body2" fontWeight="medium">
                          {cat.name}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={cat.type?.toUpperCase()}
                        size="small"
                        color={cat.type?.toUpperCase() === 'EXPENSE' ? 'error' : 'success'}
                        variant="outlined"
                        sx={{ fontWeight: 'bold' }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Edit Category">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleOpenEdit(cat)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Category">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleOpenDelete(cat)}
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

      {/* Add / Edit Category Dialog */}
      <Dialog
        open={modalOpen}
        onClose={() => !submitting && setModalOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          {modalMode === 'add' ? 'Add New Category' : 'Edit Category'}
        </DialogTitle>
        <Box component="form" onSubmit={handleFormSubmit} noValidate>
          <DialogContent dividers>
            <Stack spacing={2.5}>
              <TextField
                fullWidth
                id="name"
                name="name"
                label="Category Name"
                placeholder="e.g. Groceries, Gym, Investments"
                value={formData.name}
                onChange={handleFormChange}
                error={Boolean(fieldErrors.name)}
                helperText={fieldErrors.name}
                autoFocus
                required
              />

              <TextField
                fullWidth
                select
                id="type"
                name="type"
                label="Category Type"
                value={formData.type}
                onChange={handleFormChange}
                error={Boolean(fieldErrors.type)}
                helperText={fieldErrors.type}
                required
              >
                <MenuItem value="EXPENSE">Expense</MenuItem>
                <MenuItem value="INCOME">Income</MenuItem>
              </TextField>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setModalOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : null}
            >
              {submitting
                ? 'Saving...'
                : modalMode === 'add'
                ? 'Create Category'
                : 'Update Category'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => !deleting && setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 'bold', color: 'error.main' }}>
          Delete Category?
        </DialogTitle>
        <DialogContent dividers>
          {deleteError ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {deleteError}
            </Alert>
          ) : (
            <DialogContentText>
              Are you sure you want to delete category{' '}
              <strong>"{categoryToDelete?.name}"</strong> ({categoryToDelete?.type})?
              <br />
              <br />
              <em>Note: Categories currently linked to transactions cannot be deleted.</em>
            </DialogContentText>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
            {deleteError ? 'Close' : 'Cancel'}
          </Button>
          {!deleteError && (
            <Button
              variant="contained"
              color="error"
              onClick={handleConfirmDelete}
              disabled={deleting}
              startIcon={deleting ? <CircularProgress size={18} color="inherit" /> : null}
            >
              {deleting ? 'Deleting...' : 'Delete Category'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Categories
