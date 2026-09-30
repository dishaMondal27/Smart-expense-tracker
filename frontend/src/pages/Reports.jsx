import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Button,
  useTheme,
} from '@mui/material'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import SavingsIcon from '@mui/icons-material/Savings'
import CategoryIcon from '@mui/icons-material/Category'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import PieChartIcon from '@mui/icons-material/PieChart'
import BarChartIcon from '@mui/icons-material/BarChart'
import ShowChartIcon from '@mui/icons-material/ShowChart'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import TableChartIcon from '@mui/icons-material/TableChart'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
} from 'recharts'
import reportService from '../services/reportService'

const CATEGORY_COLORS = [
  '#4f46e5', // Indigo
  '#06b6d4', // Cyan
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#10b981', // Emerald
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#3b82f6', // Blue
  '#14b8a6', // Teal
  '#f97316', // Orange
]

function Reports() {
  const theme = useTheme()

  // Period state: 'daily' | 'weekly' | 'monthly' | 'yearly'
  const [period, setPeriod] = useState('monthly')
  const [reportData, setReportData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [exportingType, setExportingType] = useState(null) // 'csv' | 'pdf' | null

  const fetchReport = useCallback(async (selectedPeriod) => {
    try {
      setLoading(true)
      setErrorMessage('')
      const data = await reportService.getReport(selectedPeriod)
      setReportData(data)
    } catch (err) {
      console.error('Failed to load report data', err)
      setErrorMessage('Failed to generate report for selected period. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchReport(period)
  }, [fetchReport, period])

  const handlePeriodChange = (event, newPeriod) => {
    if (newPeriod !== null) {
      setPeriod(newPeriod)
    }
  }

  const handleExportCsv = async () => {
    try {
      setExportingType('csv')
      const blob = await reportService.exportCsv(period)
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'text/csv;charset=utf-8;' }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `financial-report-${period}-${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to export CSV', err)
      setErrorMessage('Failed to export CSV report. Please try again.')
    } finally {
      setExportingType(null)
    }
  }

  const handleExportPdf = async () => {
    try {
      setExportingType('pdf')
      const blob = await reportService.exportPdf(period)
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `financial-report-${period}-${new Date().toISOString().split('T')[0]}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to export PDF', err)
      setErrorMessage('Failed to export PDF report. Please try again.')
    } finally {
      setExportingType(null)
    }
  }

  // Prepared data for charts
  const categoryData = useMemo(() => {
    if (!reportData?.categoryBreakdown || reportData.categoryBreakdown.length === 0) return []
    return reportData.categoryBreakdown.map((item) => ({
      name: item.categoryName,
      value: parseFloat(item.amount),
      percentage: item.percentage,
    }))
  }, [reportData])

  const trendData = useMemo(() => {
    if (!reportData?.spendingTrends || reportData.spendingTrends.length === 0) return []
    return reportData.spendingTrends.map((t) => ({
      label: t.label,
      Expenses: parseFloat(t.expenses || 0),
      Income: parseFloat(t.income || 0),
    }))
  }, [reportData])

  const totalIncome = parseFloat(reportData?.totalIncome || 0)
  const totalExpenses = parseFloat(reportData?.totalExpenses || 0)
  const savings = parseFloat(reportData?.savings || 0)
  const highestCategory = reportData?.highestSpendingCategory || 'None'
  const transactionCount = reportData?.transactionCount || 0
  const avgDailySpending = parseFloat(reportData?.averageDailySpending || 0)

  return (
    <Box sx={{ maxWidth: 1300, mx: 'auto', p: { xs: 1, sm: 2 } }}>
      {/* Header and Period Selector */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
          mb: 3,
          gap: 2,
        }}
      >
        <div>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Financial Reports & Analytics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Multi-period expense breakdown, trend curves, and cash flow balance.
          </Typography>
        </div>

        {/* Period Selector Tabs and Export Actions */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          spacing={2}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Typography variant="body2" color="text.secondary" fontWeight="bold">
              Period:
            </Typography>
            <ToggleButtonGroup
              value={period}
              exclusive
              onChange={handlePeriodChange}
              size="small"
              color="primary"
            >
              <ToggleButton value="daily" sx={{ px: 2, textTransform: 'capitalize' }}>
                Daily
              </ToggleButton>
              <ToggleButton value="weekly" sx={{ px: 2, textTransform: 'capitalize' }}>
                Weekly
              </ToggleButton>
              <ToggleButton value="monthly" sx={{ px: 2, textTransform: 'capitalize' }}>
                Monthly
              </ToggleButton>
              <ToggleButton value="yearly" sx={{ px: 2, textTransform: 'capitalize' }}>
                Yearly
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>

          {/* Export Action Buttons */}
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              color="primary"
              size="small"
              startIcon={
                exportingType === 'csv' ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <TableChartIcon />
                )
              }
              onClick={handleExportCsv}
              disabled={loading || Boolean(exportingType)}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Export CSV
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="small"
              startIcon={
                exportingType === 'pdf' ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <PictureAsPdfIcon />
                )
              }
              onClick={handleExportPdf}
              disabled={loading || Boolean(exportingType)}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Export PDF
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* Date Range Subheader */}
      {reportData && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <CalendarTodayIcon fontSize="small" color="action" />
          <Typography variant="body2" color="text.secondary">
            Reporting Date Range: <strong>{reportData.startDate}</strong> to{' '}
            <strong>{reportData.endDate}</strong> ({period.toUpperCase()})
          </Typography>
        </Box>
      )}

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErrorMessage('')}>
          {errorMessage}
        </Alert>
      )}

      {loading ? (
        <Card elevation={2} sx={{ p: 8, textAlign: 'center', borderRadius: 2 }}>
          <CircularProgress size={40} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Calculating {period} report metrics & trends...
          </Typography>
        </Card>
      ) : (
        <Stack spacing={3}>
          {/* Summary Stats Cards (6 KPI Metrics) */}
          <Grid container spacing={2.5}>
            {/* Total Income */}
            <Grid item xs={12} sm={6} md={4} lg={2}>
              <Card
                elevation={2}
                sx={{
                  borderRadius: 2,
                  borderLeft: '4px solid',
                  borderColor: 'success.main',
                  height: '100%',
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight="bold">
                    TOTAL INCOME
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="success.main" sx={{ mt: 0.5 }}>
                    ₹{totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Total Expenses */}
            <Grid item xs={12} sm={6} md={4} lg={2}>
              <Card
                elevation={2}
                sx={{
                  borderRadius: 2,
                  borderLeft: '4px solid',
                  borderColor: 'error.main',
                  height: '100%',
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight="bold">
                    TOTAL EXPENSES
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="error.main" sx={{ mt: 0.5 }}>
                    ₹{totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Net Savings */}
            <Grid item xs={12} sm={6} md={4} lg={2}>
              <Card
                elevation={2}
                sx={{
                  borderRadius: 2,
                  borderLeft: '4px solid',
                  borderColor: savings >= 0 ? '#10b981' : 'error.main',
                  height: '100%',
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight="bold">
                    NET SAVINGS
                  </Typography>
                  <Typography
                    variant="h6"
                    fontWeight="bold"
                    color={savings >= 0 ? '#10b981' : 'error.main'}
                    sx={{ mt: 0.5 }}
                  >
                    {savings < 0 ? '-' : ''}₹{Math.abs(savings).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Highest Spending Category */}
            <Grid item xs={12} sm={6} md={4} lg={2}>
              <Card
                elevation={2}
                sx={{
                  borderRadius: 2,
                  borderLeft: '4px solid',
                  borderColor: 'primary.main',
                  height: '100%',
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight="bold">
                    TOP CATEGORY
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" noWrap sx={{ mt: 0.5 }}>
                    {highestCategory}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Transaction Count */}
            <Grid item xs={12} sm={6} md={4} lg={2}>
              <Card
                elevation={2}
                sx={{
                  borderRadius: 2,
                  borderLeft: '4px solid',
                  borderColor: 'secondary.main',
                  height: '100%',
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight="bold">
                    TRANSACTIONS
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" sx={{ mt: 0.5 }}>
                    {transactionCount}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Average Daily Spending */}
            <Grid item xs={12} sm={6} md={4} lg={2}>
              <Card
                elevation={2}
                sx={{
                  borderRadius: 2,
                  borderLeft: '4px solid',
                  borderColor: '#f59e0b',
                  height: '100%',
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight="bold">
                    AVG DAILY SPEND
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="#f59e0b" sx={{ mt: 0.5 }}>
                    ₹{avgDailySpending.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Three Modern Recharts Visualizations */}
          <Grid container spacing={2.5}>
            {/* 1. Pie Chart: Category Distribution */}
            <Grid item xs={12} md={5}>
              <Card elevation={2} sx={{ borderRadius: 2, height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                    <PieChartIcon color="primary" />
                    <Typography variant="subtitle1" fontWeight="bold">
                      Expense Distribution by Category
                    </Typography>
                  </Stack>

                  {categoryData.length === 0 ? (
                    <Box
                      sx={{
                        height: 300,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        No expenses recorded for this {period} period.
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ width: '100%', height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={85}
                            innerRadius={45}
                            paddingAngle={3}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            labelLine={false}
                          >
                            {categoryData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <RechartsTooltip
                            formatter={(value) => [`₹${value}`, 'Amount']}
                            contentStyle={{
                              backgroundColor: theme.palette.background.paper,
                              borderColor: theme.palette.divider,
                              borderRadius: 8,
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* 2. Bar Chart: Income vs Expenses */}
            <Grid item xs={12} md={7}>
              <Card elevation={2} sx={{ borderRadius: 2, height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                    <BarChartIcon color="secondary" />
                    <Typography variant="subtitle1" fontWeight="bold">
                      Income vs Expenses ({period.toUpperCase()})
                    </Typography>
                  </Stack>

                  <Box sx={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={trendData}
                        margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="label" stroke={theme.palette.text.secondary} />
                        <YAxis stroke={theme.palette.text.secondary} />
                        <RechartsTooltip
                          formatter={(value) => [`₹${value}`, '']}
                          contentStyle={{
                            backgroundColor: theme.palette.background.paper,
                            borderColor: theme.palette.divider,
                            borderRadius: 8,
                          }}
                        />
                        <Legend />
                        <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* 3. Line Chart: Spending Trend Over Time */}
            <Grid item xs={12}>
              <Card elevation={2} sx={{ borderRadius: 2 }}>
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                    <ShowChartIcon color="error" />
                    <Typography variant="subtitle1" fontWeight="bold">
                      Spending Trend Over Time ({period.toUpperCase()})
                    </Typography>
                  </Stack>

                  <Box sx={{ width: '100%', height: 320 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={trendData}
                        margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="label" stroke={theme.palette.text.secondary} />
                        <YAxis stroke={theme.palette.text.secondary} />
                        <RechartsTooltip
                          formatter={(value) => [`₹${value}`, '']}
                          contentStyle={{
                            backgroundColor: theme.palette.background.paper,
                            borderColor: theme.palette.divider,
                            borderRadius: 8,
                          }}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="Expenses"
                          stroke="#ef4444"
                          strokeWidth={3}
                          dot={{ r: 4 }}
                          activeDot={{ r: 7 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="Income"
                          stroke="#10b981"
                          strokeWidth={2}
                          strokeDasharray="4 4"
                          dot={{ r: 3 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Stack>
      )}
    </Box>
  )
}

export default Reports
