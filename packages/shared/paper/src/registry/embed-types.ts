export type EmbedRatio = '16:9' | '4:3' | '3:2' | '1:1'

export interface EmbedProvider {
  name: string
  hosts: string[]
  /** The frame's shape, unless a fixed `height` suits it better (a player bar, a widget). */
  ratio?: EmbedRatio
  height?: number
  player: (url: URL) => string | null
}

export interface KnownEmbed {
  provider: EmbedProvider
  player: string
}
