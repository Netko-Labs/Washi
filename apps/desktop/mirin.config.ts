import { defineConfig } from 'mirinjs/config'

export default defineConfig({
  id: 'dev.netko.washi',
  name: 'Washi',
  publisher: 'Netko Labs',
  main: 'src/bun/index.ts',
  // Icon Composer document at the repo root: macOS 26 resolves its light/dark
  // appearance variants from the compiled Assets.car. Linux and Windows cannot
  // read a .icon, so they keep the rendered iconset.
  icon: {
    default: 'icon.iconset',
    macos: '../../icon.icon',
  },

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
