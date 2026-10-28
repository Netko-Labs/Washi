import { styled } from '../../lib'
import type { BookmarkProps } from '../../lib/types'

/**
 * Notion's web bookmark: a link as a card. What it says was read once, when it was made, and is
 * the page's own data — nothing is fetched to draw it; the picture asks its host with no referrer.
 */
export function Bookmark({ href, title, description, image, site, ...rest }: BookmarkProps) {
  const url = new URL(href)
  const where = `${url.hostname}${url.pathname === '/' ? '' : url.pathname}`

  return (
    <a
      {...styled(rest, 'wsx-bookmark')}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      data-image={image ? true : undefined}
    >
      <span className="wsx-bookmark-text">
        <span className="wsx-bookmark-title">{title ?? where}</span>
        {description && <span className="wsx-bookmark-description">{description}</span>}
        <span className="wsx-bookmark-site">
          <span aria-hidden>↗</span> {site ? `${site} · ${url.hostname}` : where}
        </span>
      </span>
      {image && (
        <img
          className="wsx-bookmark-image"
          src={image}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      )}
    </a>
  )
}
