import { defineConfig } from 'mirinjs/config'

export default defineConfig({
  id: 'dev.netko.washi',
  name: 'Washi',
  publisher: 'Netko Labs',
  main: 'src/bun/index.ts',

  cef: {
    locales: ['en-US'],
  },

  windows: {
    // Opened manually from src/bun/index.ts so we can restore the saved frame.
    main: {
      title: 'Washi',
      width: 1280,
      height: 820,
      minWidth: 880,
      minHeight: 600,
      titleBarStyle: 'hiddenInset',
      url: 'app://ui/index.html',
      show: 'ready',
      open: 'manual',
    },
  },
})
