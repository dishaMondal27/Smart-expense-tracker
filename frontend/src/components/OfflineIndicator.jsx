import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Slide,
} from '@mui/material'
import WifiOffIcon from '@mui/icons-material/WifiOff'
import WifiIcon from '@mui/icons-material/Wifi'

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true))
  const [justReconnected, setJustReconnected] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setJustReconnected(true)
      const timer = setTimeout(() => {
        setJustReconnected(false)
      }, 4000)
      return () => clearTimeout(timer)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setJustReconnected(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const showBanner = !isOnline || justReconnected

  return (
    <Slide direction="down" in={showBanner} mountOnEnter unmountOnExit>
      <Box
        role="status"
        aria-live="polite"
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 1400,
          width: '100%',
          py: 0.85,
          px: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1.2,
          bgcolor: !isOnline ? '#ba1a1a' : '#059669',
          color: '#ffffff',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          transition: 'background-color 0.3s ease',
        }}
      >
        {!isOnline ? (
          <>
            <WifiOffIcon sx={{ fontSize: 18 }} />
            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
              You are offline. Viewing cached data. Modifications require a network connection.
            </Typography>
          </>
        ) : (
          <>
            <WifiIcon sx={{ fontSize: 18 }} />
            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
              Back online! Connection restored.
            </Typography>
          </>
        )}
      </Box>
    </Slide>
  )
}
