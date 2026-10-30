import { type CSSProperties, useRef } from 'react'
import { styled } from '../../lib'
import type { TerminalProps } from '../../lib/types'
import { isBusy, OFF_WORDS, statusWords, TERMINAL_HEIGHT, useTerminal } from './lib'

/**
 * A Node-style program run in a widget's frame (D119): no origin, no network unless listed, its
 * files read as the reader and handed in, Node's own modules lent by the frame. It runs only from
 * a press, and only where an owner turned widgets on.
 */
export function Terminal({ title, height, files, program, ...rest }: TerminalProps) {
  const box = useRef<HTMLElement>(null)
  const frame = useRef<HTMLIFrameElement>(null)
  const { gate, bundle, state, runs, run, stop, onLoad } = useTerminal(frame, program, files)
  const name = title ?? 'A terminal'
  const isReady = gate === 'on' && bundle.status === 'ready'
  const tall = { '--widget-h': `${height ?? TERMINAL_HEIGHT}px` } as CSSProperties

  return (
    <figure ref={box} {...styled(rest, 'wsx-widget wsx-terminal')}>
      {isReady && (
        <iframe
          key={runs}
          ref={frame}
          title={name}
          sandbox="allow-scripts"
          srcDoc={bundle.document}
          style={tall}
          onLoad={onLoad}
        />
      )}
      {gate === 'off' && (
        <p className="wsx-embed-blocked">
          <span>
            <strong>{name}</strong> {OFF_WORDS}
          </span>
        </p>
      )}
      {gate === 'on' && bundle.status === 'failed' && (
        <p className="wsx-embed-blocked">
          <span>
            <strong>{name}</strong> can’t run: {bundle.reason}
          </span>
        </p>
      )}
      {!isReady && gate !== 'off' && bundle.status !== 'failed' && (
        <div className="wsx-embed-wait" style={{ height: height ?? TERMINAL_HEIGHT }} />
      )}
      {isReady && (
        <figcaption>
          <span>{title}</span>
          <span className="wsx-terminal-status" aria-live="polite">
            {statusWords(state, files)}
          </span>
          <span className="wsx-terminal-controls">
            {isBusy(state) ? (
              <>
                <button type="button" className="wsx-terminal-button" onClick={stop}>
                  ■ Stop
                </button>
                <button type="button" className="wsx-terminal-button" onClick={() => void run()}>
                  ⟲ Restart
                </button>
              </>
            ) : (
              <button type="button" className="wsx-terminal-button" onClick={() => void run()}>
                ▶ Run
              </button>
            )}
            <button
              type="button"
              className="wsx-widget-full"
              aria-label={`Show ${name} full screen`}
              onClick={() => void box.current?.requestFullscreen?.()}
            >
              ⤢ Full screen
            </button>
          </span>
        </figcaption>
      )}
    </figure>
  )
}
