/** A place outside the workspace the host lends the palette; it opens in a new tab. */
export interface PaletteLink {
  label: string
  href: string
  /** Extra words it is found by. */
  keywords?: string
}

export interface CommandPaletteProps {
  links?: PaletteLink[]
}
