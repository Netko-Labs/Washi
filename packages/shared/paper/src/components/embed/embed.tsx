import { styled } from '../../lib'
import type { EmbedProps } from '../../lib/types'
import { knownEmbed } from '../../registry/embed-providers'
import { useEmbed } from './lib'

const RATIOS: Record<string, string> = {
  '16:9': '16 / 9',
  '4:3': '4 / 3',
  '3:2': '3 / 2',
  '1:1': '1 / 1',
}

/**
 * Another site inside the page, in a sandboxed frame: https only, a built-in provider or a host the
 * workspace lists. Anything else is a link, so a page can never put a stranger's site in front of
 * its reader.
 */
export function Embed({ src, title, ratio, height, ...rest }: EmbedProps) {
  const state = useEmbed(src)
  const provider = knownEmbed(src)?.provider
  const site = new URL(src).hostname
  const fixed = height ?? (ratio ? undefined : provider?.height)
  const shape = fixed ? undefined : RATIOS[ratio ?? provider?.ratio ?? '16:9']

  return (
    <figure {...styled(rest, 'wsx-embed')} data-state={state.status}>
      {state.status === 'playing' && (
        <iframe
          src={state.player}
          title={title ?? provider?.name ?? site}
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-presentation allow-forms"
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture; clipboard-write"
          allowFullScreen
          style={{ aspectRatio: shape, height: fixed }}
        />
      )}
      {state.status === 'asking' && (
        <div className="wsx-embed-wait" style={{ aspectRatio: shape, height: fixed }} />
      )}
      {state.status === 'blocked' && (
        <div className="wsx-embed-blocked">
          <span>
            <strong>{site}</strong> is not on this workspace’s embed list.
          </span>
          <a href={src} target="_blank" rel="noopener noreferrer">
            Open it ↗
          </a>
        </div>
      )}
      {title && <figcaption>{title}</figcaption>}
    </figure>
  )
}
