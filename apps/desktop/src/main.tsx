import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import './index.css'
// Runtime Tailwind engine: agent-written classes are runtime data the build
// JIT never sees. Watches the DOM and compiles sheet utilities on the fly.
import '@tailwindcss/browser'

const root = document.getElementById('root')
if (!root) throw new Error('missing #root')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
