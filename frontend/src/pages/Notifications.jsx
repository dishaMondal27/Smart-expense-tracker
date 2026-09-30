import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Stack,
  IconButton,
  Tooltip,
  Paper,
  Divider,
} from '@mui/material'
import NotificationsIcon from '@mui/icons-material/Notifications'
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import ErrorOutlinedIcon from '@mui/icons-material/ErrorOutlined'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import RefreshIcon from '@mui/icons-material/Refresh'
import notificationService from '../services/notificationService'

function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [bannerMessage, setBannerMessage] = useState('')
  const [markingId, setMarkingId] = useState(null)

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true)
      setErrorMessage('')
      const data = await notificationService.getNotifications()
      setNotifications(data || [])
    } catch (err) {
      console.error('Failed to load notifications', err)
      setErrorMessage('Failed to load notifications. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()

    // Interval polling every 30 seconds
    const interval = setInterval(() => {
      notificationService
        .getNotifications()
        .then((data) => setNotifications(data || []))
        .catch((err) => console.error('Silent polling error:', err))
    }, 30000)

    return () => clearInterval(interval)
  }, [fetchNotifications])

  const handleMarkAsRead = async (id) => {
    try {
      setMarkingId(id)
      const updated = await notificationService.markAsRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      )
      setBannerMessage('Notification marked as read.')
    } catch (err) {
      console.error('Failed to mark notification as read', err)
      setErrorMessage('Failed to update notification status.')
    } finally {
      setMarkingId(null)
    }
  }

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  )

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'BUDGET_EXCEEDED':
        return <ErrorOutlinedIcon color="error" sx={{ fontSize: 28 }} />
      case 'BUDGET_WARNING':
        return <WarningAmberIcon color="warning" sx={{ fontSize: 28 }} />
      default:
        return <InfoOutlinedIcon color="primary" sx={{ fontSize: 28 }} />
    }
  }

  const getBorderColor = (type, isRead) => {
    if (isRead) return 'divider'
    switch (type) {
      case 'BUDGET_EXCEEDED':
        return 'error.main'
      case 'BUDGET_WARNING':
        return 'warning.main'
      default:
        return 'primary.main'
    }
  }

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', p: { xs: 1, sm: 2 } }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <div>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <NotificationsIcon color="primary" sx={{ fontSize: 32 }} />
            <Typography variant="h4" component="h1" fontWeight="bold">
              Notifications
            </Typography>
            {unreadCount > 0 && (
              <Chip
                label={`${unreadCount} New`}
                color="error"
                size="small"
                sx={{ fontWeight: 'bold' }}
              />
            )}
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Automated budget alerts, spending limit warnings, and system notices.
          </Typography>
        </div>

        <Tooltip title="Refresh Notifications">
          <IconButton onClick={fetchNotifications} disabled={loading} color="primary">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

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

      {loading ? (
        <Card elevation={2} sx={{ p: 6, textAlign: 'center', borderRadius: 2 }}>
          <CircularProgress size={36} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Loading notifications...
          </Typography>
        </Card>
      ) : notifications.length === 0 ? (
        <Paper
          elevation={1}
          sx={{
            p: 6,
            textAlign: 'center',
            borderRadius: 2,
            bgcolor: 'background.paper',
          }}
        >
          <CheckCircleOutlinedIcon color="success" sx={{ fontSize: 56, mb: 1.5 }} />
          <Typography variant="h6" fontWeight="bold">
            All Caught Up!
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 450, mx: 'auto', mt: 1 }}>
            You have no notifications at this time. Alerts will be automatically generated whenever your monthly expenses reach 80% or exceed your budget.
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {notifications.map((item) => {
            const isUnread = !item.isRead
            return (
              <Card
                key={item.id}
                elevation={isUnread ? 3 : 1}
                sx={{
                  borderRadius: 2,
                  borderLeft: '5px solid',
                  borderColor: getBorderColor(item.type, item.isRead),
                  bgcolor: isUnread ? 'action.hover' : 'background.paper',
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: 2,
                    }}
                  >
                    <Stack direction="row" spacing={2} sx={{ minWidth: 0, flexGrow: 1 }}>
                      <Box sx={{ pt: 0.5 }}>{getNotificationIcon(item.type)}</Box>
                      <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                        <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                          <Typography
                            variant="subtitle1"
                            fontWeight={isUnread ? 700 : 600}
                            color={isUnread ? 'text.primary' : 'text.secondary'}
                          >
                            {item.title}
                          </Typography>
                          {isUnread && (
                            <Chip
                              label="Unread"
                              color="primary"
                              size="small"
                              variant="outlined"
                              sx={{ height: 20, fontSize: '0.65rem', fontWeight: 'bold' }}
                            />
                          )}
                        </Stack>

                        <Typography
                          variant="body2"
                          color="text.primary"
                          sx={{ mt: 0.5, lineHeight: 1.5 }}
                        >
                          {item.message}
                        </Typography>

                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block', mt: 1 }}
                        >
                          {item.createdAt
                            ? new Date(item.createdAt).toLocaleString(undefined, {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              })
                            : 'Just now'}
                        </Typography>
                      </Box>
                    </Stack>

                    {/* Action */}
                    {isUnread && (
                      <Button
                        size="small"
                        variant="outlined"
                        color="primary"
                        startIcon={
                          markingId === item.id ? (
                            <CircularProgress size={14} color="inherit" />
                          ) : (
                            <MarkEmailReadIcon fontSize="small" />
                          )
                        }
                        onClick={() => handleMarkAsRead(item.id)}
                        disabled={markingId === item.id}
                        sx={{ flexShrink: 0, textTransform: 'none' }}
                      >
                        Mark Read
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            )
          })}
        </Stack>
      )}
    </Box>
  )
}

export default Notifications
