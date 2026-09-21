import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import './index.css'
// Runtime Tailwind engine: agent-written classes are runtime data the build JIT
// never sees (spec Q9). Watches the DOM and compiles sheet utilities on the fly.
// It ships a compiler to every client — the §10 item still owed is precompiling
// per sheet on the server and caching by source hash.
import '@tailwindcss/browser'

const root = document.getElementById('root')
if (!root) throw new Error('no #root in index.html')

createRoot(root).render(
  <StrictMode>
    <div className="min-h-dvh bg-background font-sans text-[14px] text-foreground">
      <App />
    </div>
  </StrictMode>,
)
