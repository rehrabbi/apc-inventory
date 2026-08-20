import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { MantineProvider, ColorSchemeScript } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { AuthProvider } from './auth/AuthContext'
import { ToastProvider } from './components/Toast'
import App from './App'
import { theme, cssVariablesResolver } from './theme'

// Mantine styles must load before app styles so app.css can still override
// while the remaining screens are migrated.
import '@mantine/core/styles.css'
import '@mantine/dates/styles.css'
import '@mantine/notifications/styles.css'
import './styles/tokens.css'
import './styles/app.css'

// NOTE: initTheme() and lib/theme.js are gone. Mantine owns the colour scheme.
// See README section "Colour scheme ownership".

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ColorSchemeScript defaultColorScheme="auto" />
    <MantineProvider
      theme={theme}
      cssVariablesResolver={cssVariablesResolver}
      defaultColorScheme="auto"
    >
      <Notifications position="bottom-right" limit={3} />
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </MantineProvider>
  </React.StrictMode>
)
