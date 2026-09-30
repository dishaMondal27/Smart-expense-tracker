import { useState, useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import {
  Snackbar,
  Alert,
  Button,
  Box,
  Typography,
} from '@mui/material'
import SystemUpdateAltIcon from '@mui/icons-material/SystemUpdateAlt'

export default function ReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      if (r) {
        console.log('[PWA] Service Worker registered:', r)
      }
    },
    onRegisterError(error) {
      console.error('[PWA] Service Worker registration failed:', error)
    },
  })

  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (offlineReady || needRefresh) {
      setOpen(true)
    }
  }, [offlineReady, needRefresh])

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return
    }
    setOpen(false)
    if (offlineReady) {
      setOfflineReady(false)
    }
  }

  const handleUpdate = () => {
    updateServiceWorker(true)
  }

  return (
    <Snackbar
      open={open}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      autoHideDuration={offlineReady && !needRefresh ? 5000 : null}
      onClose={handleClose}
      sx={{ zIndex: 3000 }}
    >
      <Alert
        severity={needRefresh ? 'info' : 'success'}
        variant="filled"
        onClose={handleClose}
        action={
          needRefresh ? (
            <Button
              color="inherit"
              size="small"
              variant="outlined"
              startIcon={<SystemUpdateAltIcon fontSize="small" />}
              onClick={handleUpdate}
              sx={{
                borderColor: 'rgba(255,255,255,0.7)',
                color: '#fff',
                textTransform: 'none',
                fontWeight: 600,
                ml: 1,
                '&:hover': {
                  borderColor: '#fff',
                  bgcolor: 'rgba(255,255,255,0.1)',
                },
              }}
            >
              Update Now
            </Button>
          ) : null
        }
        sx={{
          borderRadius: 2.5,
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          bgcolor: needRefresh ? '#006948' : '#059669',
          color: '#ffffff',
          alignItems: 'center',
          maxWidth: 420,
        }}
      >
        <Box>
          <Typography variant="subtitle2" fontWeight={600} lineHeight={1.2}>
            {needRefresh ? 'New version available!' : 'App ready to work offline'}
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.9, display: 'block', mt: 0.3 }}>
            {needRefresh
              ? 'Click update to reload and apply the latest improvements.'
              : 'Cached pages and assets can now be browsed even without an internet connection.'}
          </Typography>
        </Box>
      </Alert>
    </Snackbar>
  )
}
