import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './shared/theme/fonts.css'
import './index.css'
import './shared/motion/interaction.css'
import App from './App.tsx'
import { Auth } from './modules/auth/auth'

const isAuthPage = /^\/auth\/?$/.test(window.location.pathname)

createRoot(document.getElementById('root')!).render(
  <StrictMode>{isAuthPage ? <Auth /> : <App />}</StrictMode>,
)
