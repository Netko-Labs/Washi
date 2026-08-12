import type { Router } from '@washi/desktop-api'
import { client } from 'mirinjs/client'

// Typed client over mirin's RPC transport (window.mirin WebSocket to the worker).
export const api = client<Router>()
