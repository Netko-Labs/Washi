import { rpc } from 'mirinjs/rpc'

export function systemRoutes() {
  return {
    ping: rpc.query((): string => 'pong'),
    getAppInfo: rpc.query((): { name: string; version: string } => ({
      name: 'Washi',
      version: '0.1.0',
    })),
  }
}
