import { mediaUrl, styled } from '../../lib'
import type { AudioProps, FileProps, VideoProps } from '../../lib/types'
import { useSheetLook } from '../../look'

const RATIOS: Record<string, string> = {
  '16:9': '16 / 9',
  '4:3': '4 / 3',
  '3:2': '3 / 2',
  '1:1': '1 / 1',
}

const UNITS = ['B', 'KB', 'MB', 'GB']

function sizeLabel(bytes: number): string {
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024
    unit += 1
  }
  return `${value < 10 && unit > 0 ? value.toFixed(1) : Math.round(value)} ${UNITS[unit]}`
}

/** A video plays in place, the browser's own controls; it loads only its first frame until asked. */
export function Video({ src, title, poster, ratio, ...rest }: VideoProps) {
  const look = useSheetLook()
  const url = mediaUrl(src, look)
  const still = poster ? (mediaUrl(poster, look) ?? undefined) : undefined
  return (
    <figure {...styled(rest, 'wsx-media')}>
      {url && (
        // biome-ignore lint/a11y/useMediaCaption: a page's own video carries no caption track
        <video
          src={url}
          poster={still}
          controls
          playsInline
          preload="metadata"
          aria-label={title}
          style={ratio ? { aspectRatio: RATIOS[ratio] } : undefined}
        />
      )}
      {title && <figcaption>{title}</figcaption>}
    </figure>
  )
}

/** A sound with the browser's player, its title above it. */
export function Audio({ src, title, ...rest }: AudioProps) {
  const url = mediaUrl(src, useSheetLook())
  return (
    <figure {...styled(rest, 'wsx-media wsx-audio')}>
      {title && <figcaption>{title}</figcaption>}
      {/* biome-ignore lint/a11y/useMediaCaption: a page's own recording carries no caption track */}
      {url && <audio src={url} controls preload="metadata" aria-label={title} />}
    </figure>
  )
}

/** A document as a line to press: its kind, its name, its size; it opens or downloads. */
export function File({ src, name, bytes, ...rest }: FileProps) {
  const url = mediaUrl(src, useSheetLook())
  const kind = name.includes('.') ? (name.split('.').pop()?.slice(0, 4).toUpperCase() ?? '') : ''
  const body = (
    <>
      <span className="wsx-file-kind">{kind || 'FILE'}</span>
      <span className="wsx-file-name">{name}</span>
      {bytes !== undefined && <span className="wsx-file-size">{sizeLabel(bytes)}</span>}
    </>
  )
  return url ? (
    <a {...styled(rest, 'wsx-file')} href={url} target="_blank" rel="noopener noreferrer">
      {body}
    </a>
  ) : (
    <span {...styled(rest, 'wsx-file')}>{body}</span>
  )
}
