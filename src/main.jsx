import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterApp } from './router/RouterApp'
import { AuthProvider } from './context/AuthContext'
import { LanguageProvider } from './context/LanguageContext'
import { WorkspaceProvider } from './context/WorkspaceContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LanguageProvider>
      <AuthProvider>
        <WorkspaceProvider>
          <RouterApp />
        </WorkspaceProvider>
      </AuthProvider>
    </LanguageProvider>
  </StrictMode>,
)
