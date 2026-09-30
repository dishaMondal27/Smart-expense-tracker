import { createTheme } from '@mui/material/styles'

// Stitch Design System - Semantic tokens and palettes
export const stitchTokens = {
  light: {
    primary: '#006948',
    primaryContainer: '#00855d',
    onPrimary: '#ffffff',
    onPrimaryContainer: '#f5fff7',
    primaryFixed: '#85f8c4',
    secondary: '#565e74',
    secondaryContainer: '#dae2fd',
    onSecondary: '#ffffff',
    onSecondaryContainer: '#5c647a',
    tertiary: '#8d4b00',
    tertiaryContainer: '#b15f00',
    onTertiary: '#ffffff',
    error: '#ba1a1a',
    errorContainer: '#ffdad6',
    onError: '#ffffff',
    onErrorContainer: '#93000a',
    background: '#f8f9ff',
    surface: '#f8f9ff',
    surfaceContainerLowest: '#ffffff',
    surfaceContainerLow: '#eff4ff',
    surfaceContainer: '#e5eeff',
    surfaceContainerHigh: '#dce9ff',
    surfaceContainerHighest: '#d3e4fe',
    onSurface: '#0b1c30',
    onSurfaceVariant: '#3d4a42',
    outline: '#6d7a72',
    outlineVariant: '#bccac0',
    divider: '#e2e8f0',
  },
  dark: {
    primary: '#68dba9',
    primaryContainer: '#005137',
    onPrimary: '#003824',
    onPrimaryContainer: '#85f8c4',
    primaryFixed: '#85f8c4',
    secondary: '#bec6e0',
    secondaryContainer: '#3f465c',
    onSecondary: '#283044',
    onSecondaryContainer: '#dae2fd',
    tertiary: '#ffb77d',
    tertiaryContainer: '#6e3900',
    onTertiary: '#4c2200',
    error: '#ffb4ab',
    errorContainer: '#93000a',
    onError: '#690005',
    onErrorContainer: '#ffdad6',
    background: '#0b0f17',
    surface: '#0b0f17',
    surfaceContainerLowest: '#111827',
    surfaceContainerLow: '#151d2e',
    surfaceContainer: '#1e293b',
    surfaceContainerHigh: '#283548',
    surfaceContainerHighest: '#334155',
    onSurface: '#f8fafc',
    onSurfaceVariant: '#94a3b8',
    outline: '#64748b',
    outlineVariant: '#334155',
    divider: '#1e293b',
  },
}

export const getAppTheme = (mode = 'light') => {
  const tokens = stitchTokens[mode] || stitchTokens.light

  return createTheme({
    palette: {
      mode,
      primary: {
        main: tokens.primary,
        light: tokens.primaryFixed,
        dark: tokens.primaryContainer,
        contrastText: tokens.onPrimary,
      },
      secondary: {
        main: tokens.secondary,
        light: tokens.secondaryContainer,
        dark: tokens.onSecondaryContainer,
        contrastText: tokens.onSecondary,
      },
      error: {
        main: tokens.error,
        light: tokens.errorContainer,
        contrastText: tokens.onError,
      },
      warning: {
        main: mode === 'light' ? '#d97706' : '#f59e0b',
        contrastText: '#ffffff',
      },
      success: {
        main: mode === 'light' ? '#059669' : '#10b981',
        contrastText: '#ffffff',
      },
      background: {
        default: tokens.background,
        paper: tokens.surfaceContainerLowest,
      },
      text: {
        primary: tokens.onSurface,
        secondary: tokens.onSurfaceVariant,
      },
      divider: tokens.divider,
      custom: {
        surfaceLow: tokens.surfaceContainerLow,
        surfaceContainer: tokens.surfaceContainer,
        surfaceHigh: tokens.surfaceContainerHigh,
        surfaceHighest: tokens.surfaceContainerHighest,
        outlineVariant: tokens.outlineVariant,
      },
    },
    typography: {
      fontFamily: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'].join(','),
      h1: {
        fontWeight: 600,
        letterSpacing: '-0.025em',
      },
      h2: {
        fontWeight: 600,
        letterSpacing: '-0.02em',
      },
      h3: {
        fontWeight: 600,
        letterSpacing: '-0.02em',
      },
      h4: {
        fontWeight: 600,
        letterSpacing: '-0.02em',
      },
      h5: {
        fontWeight: 600,
        letterSpacing: '-0.015em',
      },
      h6: {
        fontWeight: 600,
        letterSpacing: '-0.01em',
      },
      subtitle1: {
        fontWeight: 500,
        letterSpacing: '0em',
      },
      subtitle2: {
        fontWeight: 500,
        letterSpacing: '0.01em',
      },
      body1: {
        letterSpacing: '-0.005em',
      },
      body2: {
        letterSpacing: '0em',
      },
      button: {
        textTransform: 'none',
        fontWeight: 600,
        letterSpacing: '0em',
      },
    },
    shape: {
      borderRadius: 12, // 0.75rem rounded-xl
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            backgroundImage: 'none',
            border: `1px solid ${tokens.divider}`,
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.02)',
            transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            textTransform: 'none',
            fontWeight: 600,
            padding: '8px 16px',
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none',
            },
          },
          containedPrimary: {
            backgroundColor: tokens.primary,
            color: tokens.onPrimary,
            '&:hover': {
              backgroundColor: tokens.primaryContainer,
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 9999,
            fontWeight: 500,
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderColor: tokens.divider,
            padding: '12px 16px',
            fontVariantNumeric: 'tabular-nums',
          },
          head: {
            fontWeight: 600,
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: tokens.onSurfaceVariant,
            backgroundColor: tokens.surfaceContainerLow,
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: mode === 'light' ? 'rgba(255, 255, 255, 0.85)' : 'rgba(17, 24, 39, 0.85)',
            backdropFilter: 'blur(16px)',
            color: tokens.onSurface,
            boxShadow: '0 1px 8px rgba(0, 0, 0, 0.04)',
            backgroundImage: 'none',
            borderColor: tokens.divider,
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: tokens.surfaceContainerLowest,
            backgroundImage: 'none',
            borderColor: tokens.divider,
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            margin: '3px 12px',
            '&.Mui-selected': {
              backgroundColor: mode === 'light' ? tokens.surfaceContainerHigh : tokens.surfaceContainer,
              color: tokens.onSurface,
              fontWeight: 600,
              '& .MuiListItemIcon-root': {
                color: tokens.primary,
              },
              '&:hover': {
                backgroundColor: mode === 'light' ? tokens.surfaceContainerHighest : tokens.surfaceContainerHigh,
              },
            },
            '&:hover': {
              backgroundColor: tokens.surfaceContainerLow,
            },
          },
        },
      },
    },
  })
}
