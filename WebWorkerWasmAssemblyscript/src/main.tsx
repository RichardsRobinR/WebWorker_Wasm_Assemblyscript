import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { preloadWorker } from './hooks/useDataWorker.tsx'

// ⚡ Preload Web Worker + WASM immediately at startup
preloadWorker();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

