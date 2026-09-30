import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Stack,
  useTheme,
} from '@mui/material'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined'
import SavingsOutlinedIcon from '@mui/icons-material/SavingsOutlined'
import SouthWestIcon from '@mui/icons-material/SouthWest'
import NorthEastIcon from '@mui/icons-material/NorthEast'
import AddIcon from '@mui/icons-material/Add'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined'
import PieChartIcon from '@mui/icons-material/PieChart'
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import dashboardService from '../services/dashboardService'
import expenseService from '../services/expenseService'
import incomeService from '../services/incomeService'
import insightService from '../services/insightService'

// Stitch palette: Emerald, Indigo, Amber, Teal, Coral, Slate
const STITCH_CHART_COLORS = [
  '#006948', // primary emerald
  '#00855d', // emerald medium
  '#565e74', // slate blue
  '#8d4b00', // amber warm
  '#0284c7', // sky
  '#e11d48', // rose
  '#0d9488', // teal
  '#7c3aed', // violet
]

export default function Dashboard() {
  const navigate = useNavigate()
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  const [summary, setSummary] = useState(null)
  const [expenses, setExpenses] = useState([])
  const [incomes, setIncomes] = useState([])
  const [insights, setInsights] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      setErrorMessage('')

      const [summaryRes, expensesRes, incomesRes, insightsRes] = await Promise.all([
        dashboardService.getSummary(),
        expenseService.getExpenses(),
        incomeService.getIncomes(),
        insightService.getInsights(),
      ])

      setSummary(summaryRes)
      setExpenses(expensesRes || [])
      setIncomes(incomesRes || [])
      setInsights(insightsRes || [])
    } catch (err) {
      console.error('Failed to load dashboard data', err)
      setErrorMessage('Failed to load dashboard data. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  // Aggregate expenses by category for Pie Chart
  const categoryChartData = useMemo(() => {
    if (!expenses || expenses.length === 0) return []
    const map = {}
    expenses.forEach((item) => {
      const cat = item.categoryName || 'Other'
      const amt = parseFloat(item.amount || 0)
      map[cat] = (map[cat] || 0) + amt
    })
    return Object.entries(map).map(([name, value]) => ({
      name,
      value: parseFloat(value.toFixed(2)),
    }))
  }, [expenses])

  // Aggregate Income vs Expenses monthly comparison for Bar Chart
  const incomeVsExpenseData = useMemo(() => {
    const monthMap = {}

    const addEntry = (dateStr, amt, type) => {
      if (!dateStr) return
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return
      const key = d.toLocaleString('default', { month: 'short', year: '2-digit' })
      if (!monthMap[key]) {
        monthMap[key] = { month: key, Income: 0, Expenses: 0, sortKey: d.getTime() }
      }
      if (type === 'income') {
        monthMap[key].Income += amt
      } else {
        monthMap[key].Expenses += amt
      }
    }

    incomes.forEach((inc) => addEntry(inc.date, parseFloat(inc.amount || 0), 'income'))
    expenses.forEach((exp) => addEntry(exp.date, parseFloat(exp.amount || 0), 'expense'))

    const result = Object.values(monthMap).sort((a, b) => a.sortKey - b.sortKey)

    if (result.length === 0 && summary) {
      return [
        {
          month: 'This Month',
          Income: parseFloat(summary.totalIncome || 0),
          Expenses: parseFloat(summary.totalExpenses || 0),
        },
      ]
    }

    return result.map(({ month, Income, Expenses }) => ({
      month,
      Income: parseFloat(Income.toFixed(2)),
      Expenses: parseFloat(Expenses.toFixed(2)),
    }))
  }, [expenses, incomes, summary])

  const totalIncome = parseFloat(summary?.totalIncome || 0)
  const totalExpenses = parseFloat(summary?.totalExpenses || 0)
  const currentBalance = parseFloat(summary?.currentBalance || 0)
  const monthlyBudget = parseFloat(summary?.monthlyBudget || 0)
  const remainingBudget = parseFloat(summary?.remainingBudget || 0)
  const savings = parseFloat(summary?.savings || 0)
  const recentTransactions = summary?.recentTransactions || []

  // Budget pace calculation
  const budgetPercentSpent = monthlyBudget > 0 ? Math.min(100, Math.round((totalExpenses / monthlyBudget) * 100)) : 0

  return (
    <Box sx={{ maxWidth: 1240, mx: 'auto', py: 1 }}>
      {/* Top Header / Contextual action bar */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          mb: 3.5,
          gap: 2,
        }}
      >
        <Box>
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
            Financial Overview
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: 'text.secondary', mt: 0.5, letterSpacing: '-0.005em' }}
          >
            Real-time balance, disciplined budget tracking, and spending intelligence.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} sx={{ width: { xs: '100%', sm: 'auto' } }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/income/add')}
            startIcon={<SouthWestIcon sx={{ fontSize: 18 }} />}
            sx={{
              flex: { xs: 1, sm: 'none' },
              borderRadius: '9999px',
              borderColor: 'divider',
              color: 'text.primary',
              bgcolor: 'background.paper',
              '&:hover': {
                bgcolor: isDark ? 'custom.surfaceContainer' : 'custom.surfaceLow',
                borderColor: 'divider',
              },
            }}
          >
            Add Income
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/expenses/add')}
            startIcon={<AddIcon sx={{ fontSize: 20 }} />}
            sx={{
              flex: { xs: 1, sm: 'none' },
              borderRadius: '9999px',
              bgcolor: isDark ? 'primary.main' : '#006948',
              color: isDark ? '#003824' : '#ffffff',
              boxShadow: 'none',
              '&:hover': {
                bgcolor: isDark ? 'primary.light' : '#00855d',
                boxShadow: 'none',
              },
            }}
          >
            New Expense
          </Button>
        </Stack>
      </Box>

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setErrorMessage('')}>
          {errorMessage}
        </Alert>
      )}

      {loading ? (
        <Card sx={{ p: 8, textAlign: 'center', borderRadius: 3 }}>
          <CircularProgress size={38} color="primary" />
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 2 }}>
            Loading financial snapshot...
          </Typography>
        </Card>
      ) : (
        <Stack spacing={3}>
          {/* Key Metric Snapshot (Primary Cards Grid) */}
          <Grid container spacing={2}>
            {/* Card 1: Current Net Balance */}
            <Grid item xs={12} sm={6} md={4} lg={2.4}>
              <Card
                sx={{
                  height: '100%',
                  bgcolor: 'background.paper',
                  p: 0.5,
                  transition: 'border-color 0.2s',
                  '&:hover': { borderColor: 'primary.main' },
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 600,
                        color: 'text.secondary',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        fontSize: '11px',
                      }}
                    >
                      Net Balance
                    </Typography>
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: 1.5,
                        bgcolor: isDark ? 'custom.surfaceContainer' : 'custom.surfaceLow',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'primary.main',
                      }}
                    >
                      <AccountBalanceWalletOutlinedIcon sx={{ fontSize: 16 }} />
                    </Box>
                  </Box>
                  <Typography
                    variant="h5"
                    className="tabular-nums"
                    sx={{
                      fontWeight: 700,
                      letterSpacing: '-0.02em',
                      color: currentBalance < 0 ? 'error.main' : 'text.primary',
                    }}
                  >
                    {currentBalance < 0 ? '-' : ''}₹{Math.abs(currentBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}>
                    Available liquidity
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Card 2: Total Income */}
            <Grid item xs={12} sm={6} md={4} lg={2.4}>
              <Card
                sx={{
                  height: '100%',
                  bgcolor: 'background.paper',
                  p: 0.5,
                  transition: 'border-color 0.2s',
                  '&:hover': { borderColor: 'success.main' },
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 600,
                        color: 'text.secondary',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        fontSize: '11px',
                      }}
                    >
                      Total Inflow
                    </Typography>
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        bgcolor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#059669',
                      }}
                    >
                      <SouthWestIcon sx={{ fontSize: 15 }} />
                    </Box>
                  </Box>
                  <Typography
                    variant="h5"
                    className="tabular-nums"
                    sx={{
                      fontWeight: 700,
                      letterSpacing: '-0.02em',
                      color: '#059669',
                    }}
                  >
                    ₹{totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                    <TrendingUpIcon sx={{ fontSize: 14, color: '#059669' }} />
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Earned revenue
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Card 3: Total Expenses */}
            <Grid item xs={12} sm={6} md={4} lg={2.4}>
              <Card
                sx={{
                  height: '100%',
                  bgcolor: 'background.paper',
                  p: 0.5,
                  transition: 'border-color 0.2s',
                  '&:hover': { borderColor: 'error.main' },
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 600,
                        color: 'text.secondary',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        fontSize: '11px',
                      }}
                    >
                      Total Outflow
                    </Typography>
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        bgcolor: isDark ? 'rgba(244, 63, 94, 0.15)' : '#fff1f2',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#e11d48',
                      }}
                    >
                      <NorthEastIcon sx={{ fontSize: 15 }} />
                    </Box>
                  </Box>
                  <Typography
                    variant="h5"
                    className="tabular-nums"
                    sx={{
                      fontWeight: 700,
                      letterSpacing: '-0.02em',
                      color: totalExpenses > 0 ? '#e11d48' : 'text.primary',
                    }}
                  >
                    ₹{totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                    <TrendingDownIcon sx={{ fontSize: 14, color: '#e11d48' }} />
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Disbursed capital
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Card 4: Monthly Budget Pace */}
            <Grid item xs={12} sm={6} md={4} lg={2.4}>
              <Card
                sx={{
                  height: '100%',
                  bgcolor: 'background.paper',
                  p: 0.5,
                  transition: 'border-color 0.2s',
                  '&:hover': { borderColor: 'warning.main' },
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 600,
                        color: 'text.secondary',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        fontSize: '11px',
                      }}
                    >
                      Budget Left
                    </Typography>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: 9999,
                        backgroundColor:
                          budgetPercentSpent >= 100
                            ? 'rgba(225, 29, 72, 0.12)'
                            : budgetPercentSpent >= 85
                            ? 'rgba(217, 119, 6, 0.12)'
                            : isDark
                            ? 'rgba(16, 185, 129, 0.15)'
                            : '#ecfdf5',
                        color:
                          budgetPercentSpent >= 100
                            ? '#e11d48'
                            : budgetPercentSpent >= 85
                            ? '#d97706'
                            : '#059669',
                      }}
                    >
                      {budgetPercentSpent}% spent
                    </span>
                  </Box>
                  <Typography
                    variant="h5"
                    className="tabular-nums"
                    sx={{
                      fontWeight: 700,
                      letterSpacing: '-0.02em',
                      color: remainingBudget < 0 ? '#e11d48' : 'text.primary',
                    }}
                  >
                    {remainingBudget < 0 ? '-' : ''}₹{Math.abs(remainingBudget).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Typography>
                  {/* Subtle 4px hairline progress bar */}
                  <Box sx={{ mt: 1.2, width: '100%', height: 4, bgcolor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
                    <Box
                      sx={{
                        width: `${Math.min(100, budgetPercentSpent)}%`,
                        height: '100%',
                        bgcolor:
                          budgetPercentSpent >= 100
                            ? '#e11d48'
                            : budgetPercentSpent >= 85
                            ? '#d97706'
                            : '#006948',
                        borderRadius: 2,
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Card 5: Net Savings */}
            <Grid item xs={12} sm={6} md={4} lg={2.4}>
              <Card
                sx={{
                  height: '100%',
                  bgcolor: 'background.paper',
                  p: 0.5,
                  transition: 'border-color 0.2s',
                  '&:hover': { borderColor: 'primary.main' },
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 600,
                        color: 'text.secondary',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        fontSize: '11px',
                      }}
                    >
                      Net Savings
                    </Typography>
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: 1.5,
                        bgcolor: isDark ? 'custom.surfaceContainer' : 'custom.surfaceLow',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#059669',
                      }}
                    >
                      <SavingsOutlinedIcon sx={{ fontSize: 16 }} />
                    </Box>
                  </Box>
                  <Typography
                    variant="h5"
                    className="tabular-nums"
                    sx={{
                      fontWeight: 700,
                      letterSpacing: '-0.02em',
                      color: savings >= 0 ? '#059669' : '#e11d48',
                    }}
                  >
                    {savings < 0 ? '-' : ''}₹{Math.abs(savings).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}>
                    Net retained wealth
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Analytical Charts Container */}
          <Grid container spacing={2.5}>
            {/* Pie Chart: Expenses by Category */}
            <Grid item xs={12} md={5}>
              <Card sx={{ height: '100%', bgcolor: 'background.paper' }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PieChartIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                      <Typography variant="subtitle1" fontWeight={600} sx={{ letterSpacing: '-0.01em' }}>
                        Category Distribution
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      Active cycle
                    </Typography>
                  </Box>

                  {categoryChartData.length === 0 ? (
                    <Box
                      sx={{
                        height: 270,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column',
                        border: '1px dashed',
                        borderColor: 'divider',
                        borderRadius: 2,
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        No category expenses logged yet.
                      </Typography>
                      <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => navigate('/expenses/add')}
                        sx={{ mt: 1.5, borderRadius: '9999px' }}
                      >
                        Log Expense
                      </Button>
                    </Box>
                  ) : (
                    <Box sx={{ width: '100%', height: 270 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryChartData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={85}
                            innerRadius={50}
                            paddingAngle={3}
                            stroke={isDark ? '#111827' : '#ffffff'}
                            strokeWidth={2}
                          >
                            {categoryChartData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={STITCH_CHART_COLORS[index % STITCH_CHART_COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <RechartsTooltip
                            formatter={(value) => [`₹${parseFloat(value).toFixed(2)}`, 'Spent']}
                            contentStyle={{
                              backgroundColor: isDark ? '#111827' : '#ffffff',
                              borderColor: isDark ? '#1e293b' : '#e2e8f0',
                              borderRadius: 10,
                              boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                              fontSize: '12px',
                            }}
                          />
                          <Legend
                            wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
                            iconType="circle"
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Bar Chart: Cashflow Overview */}
            <Grid item xs={12} md={7}>
              <Card sx={{ height: '100%', bgcolor: 'background.paper' }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BarChartOutlinedIcon sx={{ color: 'secondary.main', fontSize: 20 }} />
                      <Typography variant="subtitle1" fontWeight={600} sx={{ letterSpacing: '-0.01em' }}>
                        Income vs Outflow
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#006948' }} />
                        <Typography variant="caption" color="text.secondary">Inflow</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#e11d48' }} />
                        <Typography variant="caption" color="text.secondary">Outflow</Typography>
                      </Box>
                    </Box>
                  </Box>

                  <Box sx={{ width: '100%', height: 270 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={incomeVsExpenseData}
                        margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
                        barGap={6}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#1e293b' : '#f1f5f9'} />
                        <XAxis
                          dataKey="month"
                          stroke={isDark ? '#64748b' : '#94a3b8'}
                          tickLine={false}
                          style={{ fontSize: '11px', fontFamily: 'Inter' }}
                        />
                        <YAxis
                          stroke={isDark ? '#64748b' : '#94a3b8'}
                          tickLine={false}
                          axisLine={false}
                          style={{ fontSize: '11px', fontFamily: 'Inter' }}
                        />
                        <RechartsTooltip
                          formatter={(value) => [`₹${parseFloat(value).toFixed(2)}`, '']}
                          contentStyle={{
                            backgroundColor: isDark ? '#111827' : '#ffffff',
                            borderColor: isDark ? '#1e293b' : '#e2e8f0',
                            borderRadius: 10,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                            fontSize: '12px',
                          }}
                        />
                        <Bar dataKey="Income" fill="#006948" radius={[4, 4, 0, 0]} maxBarSize={36} />
                        <Bar dataKey="Expenses" fill="#e11d48" radius={[4, 4, 0, 0]} maxBarSize={36} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Grouped Ledger: Recent Transactions */}
          <Card sx={{ bgcolor: 'background.paper', overflow: 'hidden' }}>
            <Box
              sx={{
                p: 2.5,
                pb: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Box>
                <Typography variant="subtitle1" fontWeight={700} sx={{ letterSpacing: '-0.015em' }}>
                  Recent Activity
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Structured ledger of the latest financial transactions.
                </Typography>
              </Box>

              <Button
                size="small"
                variant="text"
                endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
                onClick={() => navigate('/expenses')}
                sx={{
                  color: 'primary.main',
                  fontWeight: 600,
                  fontSize: '0.825rem',
                  borderRadius: '9999px',
                  '&:hover': { bgcolor: isDark ? 'custom.surfaceContainer' : 'custom.surfaceLow' },
                }}
              >
                View Ledger
              </Button>
            </Box>

            <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 0 }}>
              <Table size="medium" aria-label="recent transactions table">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Category / Source</TableCell>
                    <TableCell>Payment Method</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell align="right">Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                        <Typography variant="body2" color="text.secondary">
                          No transactions recorded yet. Click &quot;New Expense&quot; or &quot;Add Income&quot; to begin.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentTransactions.map((tx) => {
                      const isIncome = tx.type?.toUpperCase() === 'INCOME'
                      return (
                        <TableRow
                          key={`${tx.type}-${tx.id}`}
                          hover
                          sx={{
                            '&:hover': {
                              bgcolor: isDark ? 'custom.surfaceContainer' : 'custom.surfaceLow',
                            },
                          }}
                        >
                          <TableCell sx={{ color: 'text.secondary', fontSize: '13px' }}>
                            {tx.date}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500} sx={{ color: 'text.primary' }}>
                              {tx.description || '—'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '2px 8px',
                                borderRadius: 9999,
                                fontSize: '11px',
                                fontWeight: 500,
                                backgroundColor: isDark ? '#1e293b' : '#eff4ff',
                                color: isDark ? '#bec6e0' : '#565e74',
                              }}
                            >
                              {tx.category || 'General'}
                            </span>
                          </TableCell>
                          <TableCell sx={{ color: 'text.secondary', fontSize: '13px' }}>
                            {tx.paymentMethod || 'Direct'}
                          </TableCell>
                          <TableCell>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '2px 8px',
                                borderRadius: 9999,
                                fontSize: '10px',
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                                backgroundColor: isIncome
                                  ? isDark
                                    ? 'rgba(16, 185, 129, 0.15)'
                                    : '#ecfdf5'
                                  : isDark
                                  ? 'rgba(244, 63, 94, 0.15)'
                                  : '#fff1f2',
                                color: isIncome ? '#059669' : '#e11d48',
                              }}
                            >
                              {tx.type}
                            </span>
                          </TableCell>
                          <TableCell
                            align="right"
                            className="tabular-nums"
                            sx={{
                              fontWeight: 600,
                              fontSize: '14px',
                              color: isIncome ? '#059669' : 'text.primary',
                            }}
                          >
                            {isIncome ? '+' : '-'}₹{parseFloat(tx.amount).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>

          {/* Smart Insights Analytics Module */}
          <Card
            sx={{
              bgcolor: 'background.paper',
              p: 1,
            }}
          >
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                  <AutoAwesomeIcon sx={{ color: 'primary.main', fontSize: 22 }} />
                  <Typography variant="subtitle1" fontWeight={700}>
                    Smart Financial Insights
                  </Typography>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: 9999,
                      backgroundColor: isDark ? 'rgba(0, 105, 72, 0.25)' : '#ecfdf5',
                      color: isDark ? '#85f8c4' : '#006948',
                    }}
                  >
                    {insights.length} active
                  </span>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Automated cash flow diagnostics
                </Typography>
              </Box>

              {insights.length === 0 ? (
                <Box
                  sx={{
                    p: 3,
                    textAlign: 'center',
                    border: '1px dashed',
                    borderColor: 'divider',
                    borderRadius: 2,
                    bgcolor: isDark ? 'custom.surfaceContainer' : 'custom.surfaceLow',
                  }}
                >
                  <LightbulbOutlinedIcon sx={{ color: 'text.secondary', fontSize: 32, mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    No insights generated yet. Add transactions and budgets to unlock smart diagnostics.
                  </Typography>
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {insights.map((insight, idx) => {
                    const isWarning = insight.severity === 'WARNING'
                    const isSuccess = insight.severity === 'SUCCESS'

                    const iconColor = isWarning
                      ? '#d97706'
                      : isSuccess
                      ? '#059669'
                      : isDark
                      ? '#68dba9'
                      : '#006948'

                    const bgTint = isWarning
                      ? isDark
                        ? 'rgba(217, 119, 6, 0.1)'
                        : '#fffbeb'
                      : isSuccess
                      ? isDark
                        ? 'rgba(5, 150, 105, 0.1)'
                        : '#ecfdf5'
                      : isDark
                      ? 'rgba(0, 105, 72, 0.1)'
                      : '#eff4ff'

                    const IconComponent = isWarning
                      ? WarningAmberIcon
                      : isSuccess
                      ? CheckCircleOutlinedIcon
                      : InfoOutlinedIcon

                    return (
                      <Grid item xs={12} sm={6} md={4} key={`${insight.type}-${idx}`}>
                        <Box
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                            bgcolor: bgTint,
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 0.8,
                            transition: 'border-color 0.2s',
                            '&:hover': {
                              borderColor: iconColor,
                            },
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <IconComponent sx={{ color: iconColor, fontSize: 18 }} />
                            <Typography variant="subtitle2" fontWeight={600} sx={{ color: 'text.primary' }}>
                              {insight.title}
                            </Typography>
                          </Box>
                          <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '13px' }}>
                            {insight.message}
                          </Typography>
                        </Box>
                      </Grid>
                    )
                  })}
                </Grid>
              )}
            </CardContent>
          </Card>
        </Stack>
      )}
    </Box>
  )
}
