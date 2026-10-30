export const TERMINAL_HEIGHT = 360

/** A terminal is dark wherever it sits; the screen paints itself inside this. */
export const TERMINAL_STYLE = `:root { color-scheme: dark; }
html, body, #root { height: 100%; margin: 0; }
body { background: #0d0f12; }
.screen { box-sizing: border-box; height: 100%; margin: 0; overflow: auto; color: #dcdfe4; white-space: pre; font-variant-ligatures: none; tab-size: 8; }`

export const OFF_WORDS = 'runs a program, as a widget does — widgets are off in this workspace.'
export const ELSEWHERE_WORDS = 'a terminal runs inside a workspace'
