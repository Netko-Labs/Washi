import { createRoot } from 'react-dom/client'
import { App } from '@/components/core/app'
import '@/styles.css'

const root = document.getElementById('root')
if (!root) throw new Error('mihon needs a #root')
createRoot(root).render(<App />)
