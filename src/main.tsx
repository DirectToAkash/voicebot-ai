import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import VoiceBot from './components/VoiceBot'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <VoiceBot />
  </StrictMode>
)
