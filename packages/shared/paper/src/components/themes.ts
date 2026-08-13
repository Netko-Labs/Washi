import type { CSSProperties } from 'react'

/**
 * Sheet presets: complete design systems as scoped token rebinds. Components
 * only ever speak tokens, so swapping the tokens re-skins every block — a
 * sheet becomes its own site without the grammar ever opening (spec Q1/Q9).
 */

export type SheetPreset = 'washi' | 'midnight' | 'broadsheet' | 'sticker' | 'terminal' | 'blueprint'

type TokenSet = CSSProperties & Record<`--${string}`, string>

interface PresetDef {
  style: TokenSet
  /** Font face class applied to the article unless theme.face overrides it. */
  faceClass: string
}

export const SHEET_PRESETS: Record<SheetPreset, PresetDef> = {
  washi: {
    faceClass: 'font-sans',
    style: {
      backgroundColor: 'var(--card)',
      color: 'var(--foreground)',
    },
  },

  midnight: {
    faceClass: 'font-sans',
    style: {
      backgroundColor: 'oklch(0.17 0.018 262)',
      color: 'oklch(0.93 0.012 250)',
      '--foreground': 'oklch(0.93 0.012 250)',
      '--card': 'oklch(0.215 0.022 260)',
      '--card-foreground': 'oklch(0.93 0.012 250)',
      '--muted': 'oklch(0.25 0.022 260)',
      '--muted-foreground': 'oklch(0.66 0.02 255)',
      '--accent': 'oklch(0.28 0.025 260)',
      '--accent-foreground': 'oklch(0.93 0.012 250)',
      '--border': 'oklch(0.31 0.025 260)',
      '--primary': 'oklch(0.82 0.14 185)',
      '--primary-foreground': 'oklch(0.16 0.018 262)',
      '--sheet-accent': 'oklch(0.82 0.14 185)',
    },
  },

  broadsheet: {
    faceClass: 'font-serif',
    style: {
      backgroundColor: 'oklch(0.955 0.009 92)',
      color: 'oklch(0.2 0.012 75)',
      '--foreground': 'oklch(0.2 0.012 75)',
      '--card': 'oklch(0.955 0.009 92)',
      '--card-foreground': 'oklch(0.2 0.012 75)',
      '--muted': 'oklch(0.92 0.01 90)',
      '--muted-foreground': 'oklch(0.42 0.014 78)',
      '--accent': 'oklch(0.9 0.012 88)',
      '--border': 'oklch(0.72 0.014 82)',
      '--primary': 'oklch(0.48 0.18 27)',
      '--primary-foreground': 'oklch(0.97 0.008 92)',
      '--sheet-accent': 'oklch(0.48 0.18 27)',
      '--radius-md': '0px',
      '--radius-lg': '0px',
      '--radius-xl': '0px',
      '--radius-2xl': '0px',
    },
  },

  sticker: {
    faceClass: 'font-rounded',
    style: {
      backgroundColor: 'oklch(0.965 0.035 90)',
      color: 'oklch(0.26 0.03 60)',
      '--foreground': 'oklch(0.26 0.03 60)',
      '--card': 'oklch(0.995 0.005 95)',
      '--card-foreground': 'oklch(0.26 0.03 60)',
      '--muted': 'oklch(0.93 0.04 88)',
      '--muted-foreground': 'oklch(0.5 0.04 65)',
      '--accent': 'oklch(0.9 0.05 85)',
      '--border': 'oklch(0.55 0.09 70)',
      '--primary': 'oklch(0.65 0.19 40)',
      '--primary-foreground': 'oklch(0.99 0.005 95)',
      '--sheet-accent': 'oklch(0.65 0.19 40)',
      '--radius-md': '0.9rem',
      '--radius-lg': '1.1rem',
      '--radius-xl': '1.4rem',
    },
  },

  terminal: {
    faceClass: 'font-mono',
    style: {
      backgroundColor: 'oklch(0.15 0.012 155)',
      color: 'oklch(0.85 0.13 152)',
      '--foreground': 'oklch(0.85 0.13 152)',
      '--card': 'oklch(0.19 0.016 155)',
      '--card-foreground': 'oklch(0.85 0.13 152)',
      '--muted': 'oklch(0.22 0.018 155)',
      '--muted-foreground': 'oklch(0.6 0.09 152)',
      '--accent': 'oklch(0.25 0.02 155)',
      '--border': 'oklch(0.32 0.05 152)',
      '--primary': 'oklch(0.85 0.16 152)',
      '--primary-foreground': 'oklch(0.15 0.012 155)',
      '--sheet-accent': 'oklch(0.85 0.16 152)',
      '--radius-md': '2px',
      '--radius-lg': '3px',
      '--radius-xl': '4px',
    },
  },

  blueprint: {
    faceClass: 'font-sans',
    style: {
      backgroundColor: 'oklch(0.36 0.085 257)',
      backgroundImage:
        'linear-gradient(rgb(255 255 255 / 0.07) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / 0.07) 1px, transparent 1px)',
      backgroundSize: '24px 24px',
      color: 'oklch(0.97 0.01 250)',
      '--foreground': 'oklch(0.97 0.01 250)',
      '--card': 'oklch(0.32 0.08 257)',
      '--card-foreground': 'oklch(0.97 0.01 250)',
      '--muted': 'oklch(0.3 0.075 257)',
      '--muted-foreground': 'oklch(0.8 0.04 252)',
      '--accent': 'oklch(0.42 0.09 257)',
      '--border': 'oklch(0.62 0.07 252)',
      '--primary': 'oklch(0.9 0.06 95)',
      '--primary-foreground': 'oklch(0.3 0.08 257)',
      '--sheet-accent': 'oklch(0.9 0.06 95)',
      '--radius-md': '2px',
      '--radius-lg': '4px',
      '--radius-xl': '6px',
    },
  },
}
