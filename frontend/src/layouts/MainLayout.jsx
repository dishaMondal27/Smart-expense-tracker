import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import notificationService from '../services/notificationService'
import {
  AppBar,
  Avatar,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Menu,
  MenuItem,
  Toolbar,
  Tooltip,
  Typography,
  Badge,
  useTheme,
  useMediaQuery,
} from '@mui/material'

import {
  Menu as MenuIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Dashboard as DashboardIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
  AddCircleOutlineRounded as AddCircleOutlineIcon,
  TrendingUp as TrendingUpIcon,
  AddBox as AddBoxIcon,
  Savings as SavingsIcon,
  BarChart as BarChartIcon,
  Category as CategoryIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Paid as PaidIcon,
  GetApp as GetAppIcon,
} from '@mui/icons-material'

import { useAppTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { usePWA } from '../context/PWAContext'

import Logo from '../components/Logo'

const DRAWER_WIDTH = 260

const navGroups = [
  {
    subheader: 'Overview',
    items: [
      { text: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
    ],
  },
  {
    subheader: 'Transactions',
    items: [
      { text: 'Expenses', path: '/expenses', icon: <AccountBalanceWalletIcon /> },
      { text: 'Add Expense', path: '/expenses/add', icon: <AddCircleOutlineIcon /> },
      { text: 'Income', path: '/income', icon: <TrendingUpIcon /> },
      { text: 'Add Income', path: '/income/add', icon: <AddBoxIcon /> },
      { text: 'Budget', path: '/budget', icon: <SavingsIcon /> },
    ],
  },
  {
    subheader: 'Analytics & Setup',
    items: [
      { text: 'Reports', path: '/reports', icon: <BarChartIcon /> },
      { text: 'Categories', path: '/categories', icon: <CategoryIcon /> },
    ],
  },
  {
    subheader: 'Account',
    items: [
      { text: 'Notifications', path: '/notifications', icon: <NotificationsIcon /> },
      { text: 'Profile', path: '/profile', icon: <PersonIcon /> },
      { text: 'Settings', path: '/settings', icon: <SettingsIcon /> },
    ],
  },
]

function MainLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuAnchor, setUserMenuAnchor] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const { mode, toggleTheme } = useAppTheme()
  const { user, logout } = useAuth()
  const { isInstallable, installApp } = usePWA()
  const navigate = useNavigate()
  const location = useLocation()

  // Polling unread notifications count
  useEffect(() => {
    let isMounted = true

    const fetchUnread = async () => {
      try {
        const notifs = await notificationService.getNotifications()
        if (isMounted && Array.isArray(notifs)) {
          const unread = notifs.filter((n) => !n.isRead).length
          setUnreadCount(unread)
        }
      } catch (err) {
        // Silently skip if unauthenticated or network drop
      }
    }

    fetchUnread()
    const interval = setInterval(fetchUnread, 15000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [location.pathname])

  const handleLogout = () => {
    handleUserMenuClose()
    logout()
    navigate('/login')
  }

  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((part) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U'

  const handleDrawerToggle = () => {
    setMobileOpen((prev) => !prev)
  }

  const handleUserMenuOpen = (event) => {
    setUserMenuAnchor(event.currentTarget)
  }

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null)
  }

  const handleNavClick = (path) => {
    navigate(path)
    if (isMobile) {
      setMobileOpen(false)
    }
  }

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Brand Header */}
      <Toolbar
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 2.5,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Logo size={34} />
        <Box>
          <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2} noWrap sx={{ letterSpacing: '-0.02em' }}>
            Smart Expense
          </Typography>
          <Typography variant="caption" color="text.secondary" fontWeight={500} sx={{ letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '10px' }}>
            Tracker
          </Typography>
        </Box>
      </Toolbar>

      {/* Navigation Links */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', py: 1 }}>
        <List component="nav" disablePadding>
          {navGroups.map((group, groupIndex) => (
            <Box key={group.subheader || groupIndex}>
              {groupIndex > 0 && <Divider sx={{ my: 1, mx: 2 }} />}
              <ListSubheader
                component="div"
                disableSticky
                sx={{
                  bgcolor: 'transparent',
                  color: 'text.secondary',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  px: 2.5,
                  py: 0.5,
                  lineHeight: '24px',
                }}
              >
                {group.subheader}
              </ListSubheader>
              {group.items.map((item) => {
                const isSelected = location.pathname === item.path
                return (
                  <ListItem key={item.path} disablePadding>
                    <ListItemButton
                      selected={isSelected}
                      onClick={() => handleNavClick(item.path)}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 40,
                          color: isSelected ? 'inherit' : 'text.secondary',
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.text}
                        primaryTypographyProps={{
                          fontSize: '0.9rem',
                          fontWeight: isSelected ? 600 : 500,
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                )
              })}
            </Box>
          ))}
        </List>
      </Box>

      {/* Footer / User Preview */}
      <Divider />
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{ width: 34, height: 34, bgcolor: 'secondary.main', fontSize: '0.85rem' }}>
          {userInitials}
        </Avatar>
        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
          <Typography variant="body2" fontWeight={600} noWrap>
            {user?.name || 'User'}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap display="block">
            {user?.email || ''}
          </Typography>
        </Box>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Top App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          bgcolor: 'background.paper',
          color: 'text.primary',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ display: { md: 'none' }, mr: 1 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" component="div" noWrap sx={{ fontWeight: 600 }}>
              Smart Expense Tracker
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Install App Button if installable */}
            {isInstallable && (
              <Tooltip title="Install Smart Expense Tracker App">
                <IconButton
                  onClick={installApp}
                  color="primary"
                  size="medium"
                  sx={{
                    bgcolor: (th) =>
                      th.palette.mode === 'dark' ? 'rgba(104, 219, 169, 0.12)' : 'rgba(0, 105, 72, 0.08)',
                    '&:hover': {
                      bgcolor: (th) =>
                        th.palette.mode === 'dark' ? 'rgba(104, 219, 169, 0.22)' : 'rgba(0, 105, 72, 0.16)',
                    },
                  }}
                >
                  <GetAppIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}

            {/* Theme Toggle Button */}
            <Tooltip title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}>
              <IconButton onClick={toggleTheme} color="inherit" size="medium">
                {mode === 'light' ? <DarkModeIcon fontSize="small" /> : <LightModeIcon fontSize="small" />}
              </IconButton>
            </Tooltip>

            {/* Notifications Button */}
            <Tooltip title="Notifications">
              <IconButton
                color="inherit"
                size="medium"
                onClick={() => handleNavClick('/notifications')}
              >
                <Badge badgeContent={unreadCount} color="error">
                  <NotificationsIcon fontSize="small" />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* User Menu Trigger */}
            <Tooltip title="Account menu">
              <IconButton onClick={handleUserMenuOpen} size="small" sx={{ ml: 1 }}>
                <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: '0.85rem' }}>
                  {userInitials}
                </Avatar>
              </IconButton>
            </Tooltip>

            {/* User Dropdown Menu */}
            <Menu
              anchorEl={userMenuAnchor}
              open={Boolean(userMenuAnchor)}
              onClose={handleUserMenuClose}
              onClick={handleUserMenuClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              slotProps={{
                paper: {
                  sx: {
                    minWidth: 180,
                    mt: 1.5,
                    boxShadow: 3,
                  },
                },
              }}
            >
              <MenuItem onClick={() => handleNavClick('/profile')}>
                <ListItemIcon>
                  <PersonIcon fontSize="small" />
                </ListItemIcon>
                Profile
              </MenuItem>
              <MenuItem onClick={() => handleNavClick('/settings')}>
                <ListItemIcon>
                  <SettingsIcon fontSize="small" />
                </ListItemIcon>
                Settings
              </MenuItem>
              {isInstallable && (
                <MenuItem onClick={installApp}>
                  <ListItemIcon>
                    <GetAppIcon fontSize="small" color="primary" />
                  </ListItemIcon>
                  <Typography color="primary.main" variant="inherit" fontWeight={600}>
                    Install App
                  </Typography>
                </MenuItem>
              )}
              <Divider />
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" color="error" />
                </ListItemIcon>
                <Typography color="error.main" variant="inherit">
                  Log Out
                </Typography>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Left Navigation Sidebar */}
      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
        aria-label="navigation folders"
      >
        {/* Mobile Temporary Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
              bgcolor: 'background.paper',
            },
          }}
        >
          {drawerContent}
        </Drawer>

        {/* Desktop Permanent Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
              bgcolor: 'background.paper',
            },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2.5, sm: 3.5 },
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          minHeight: '100vh',
          bgcolor: 'background.default',
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  )
}

export default MainLayout
