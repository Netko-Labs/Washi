import { useRef } from 'react'
import { percent, type RoadmapRowProps, useBarDrag } from './lib'

/** One row: its name, and its bar on the track. Drag a bar to reschedule; click an empty track to date it. */
export function RoadmapRow({ span, calendar, title, onMove, onPlace, onOpen }: RoadmapRowProps) {
  const track = useRef<HTMLDivElement>(null)
  const dayWidth = () => (track.current?.clientWidth ?? 0) / calendar.days
  const drag = useBarDrag(dayWidth, span?.start ?? null, onMove)

  return (
    <div className="wsx-roadmap-row">
      <button type="button" className="wsx-roadmap-name" onClick={onOpen}>
        {title}
      </button>
      <div ref={track} className="wsx-roadmap-track">
        {span ? (
          <div
            className="wsx-roadmap-bar"
            data-dragging={drag.shift !== 0 || undefined}
            title="Drag to reschedule"
            style={{
              left: percent(span.start + drag.shift, calendar),
              width: `${((span.end - span.start + 1) / calendar.days) * 100}%`,
            }}
            onPointerDown={drag.onPointerDown}
          >
            <span>{title}</span>
          </div>
        ) : (
          <button
            type="button"
            className="wsx-roadmap-place"
            aria-label={`Set a date for ${title}`}
            onClick={(event) => {
              const box = event.currentTarget.getBoundingClientRect()
              onPlace(calendar.first + Math.floor((event.clientX - box.left) / dayWidth()))
            }}
          />
        )}
      </div>
    </div>
  )
}
