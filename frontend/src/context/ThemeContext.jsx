import { createContext, useContext, useMemo, useState } from 'react'
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { getAppTheme } from '../theme'

const ThemeContext = createContext({
  mode: 'light',
  toggleTheme: () => {},
})

export const useAppTheme = () => useContext(ThemeContext)

export function AppThemeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    return localStorage.getItem('app_theme_mode') || 'light'
  })

  const toggleTheme = () => {
    setMode((prevMode) => {
      const next = prevMode === 'light' ? 'dark' : 'light'
      localStorage.setItem('app_theme_mode', next)
      return next
    })
  }

  const theme = useMemo(() => getAppTheme(mode), [mode])

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  )
}
