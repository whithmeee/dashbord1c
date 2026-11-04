import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './shared/theme/fonts.css'
import './index.css'
import './shared/motion/interaction.css'
import { AuthApplication } from './modules/auth/react/auth-application'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthApplication />
  </StrictMode>,
)
