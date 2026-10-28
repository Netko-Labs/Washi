import { coverStyle } from '../../lib'
import { useSheetLook } from '../../look'
import { FILE_KEY } from '../../registry/looks'
import { CardValue } from './card-value'
import type { GalleryCardProps } from './lib'

const COVER_KEY = /^(preset|picture):[a-z0-9-]{1,48}$/

/** One row as Notion's gallery card: its picture, its title, a few properties under it. */
export function GalleryCard({ db, row, title, cover, shown, onOpen }: GalleryCardProps) {
  const look = useSheetLook()
  const picture = cover ? row[cover.name] : undefined
  const isUrl = typeof picture === 'string' && picture.startsWith('https://')
  const isKey = typeof picture === 'string' && (COVER_KEY.test(picture) || FILE_KEY.test(picture))
  const name = title ? row[title.name] : undefined

  return (
    <button type="button" className="wsx-db-card" onClick={onOpen} disabled={!onOpen}>
      {cover && (
        <span
          className="wsx-db-card-cover"
          data-empty={isUrl || isKey ? undefined : true}
          style={isKey && typeof picture === 'string' ? coverStyle(picture, look) : undefined}
        >
          {isUrl && <img src={picture} alt="" loading="lazy" referrerPolicy="no-referrer" />}
        </span>
      )}
      <span className="wsx-db-card-body">
        <span className="wsx-db-card-title">{name ? String(name) : 'Untitled'}</span>
        {shown.map((column) => (
          <CardValue key={column.name} db={db} column={column} value={row[column.name]} />
        ))}
      </span>
    </button>
  )
}
