import type { Diagnostic as LintDiagnostic } from '@codemirror/lint'
import type { Text } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { paperRegistry } from '@washi/paper/registry'
import { type Diagnostic, parse, validate, WsxParseError } from '@washi/wsx'

/** The server's own check (`checkSource` in service): parse, then validate against the registry. */
export function checkSource(source: string): Diagnostic[] {
  try {
    return validate(parse(source), paperRegistry)
  } catch (error) {
    if (error instanceof WsxParseError) return error.diagnostics
    throw error
  }
}

export function isSavable(diagnostics: Diagnostic[]) {
  return diagnostics.every((diagnostic) => diagnostic.severity !== 'error')
}

/** Only the parser knows a line; schema problems carry a path and show in the list instead. */
export function toLint(doc: Text, diagnostics: Diagnostic[]): LintDiagnostic[] {
  return diagnostics.flatMap(({ line, column, severity, message }) => {
    if (line === undefined || line < 1 || line > doc.lines) return []
    const at = doc.line(line)
    const from = Math.min(at.from + Math.max((column ?? 1) - 1, 0), at.to)
    return [{ from, to: Math.max(from + 1, at.to), severity, message }]
  })
}

export function sourceTheme() {
  return EditorView.theme({
    '&': { fontSize: '12.5px', backgroundColor: 'transparent', color: 'var(--foreground)' },
    '&.cm-focused': { outline: 'none' },
    '.cm-content': { fontFamily: 'var(--font-mono)', caretColor: 'var(--foreground)' },
    '.cm-gutters': {
      backgroundColor: 'transparent',
      color: 'var(--muted-foreground)',
      border: 'none',
    },
    '.cm-activeLine, .cm-activeLineGutter': {
      backgroundColor: 'color-mix(in oklab, var(--accent) 60%, transparent)',
    },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
      backgroundColor: 'color-mix(in oklab, var(--primary) 18%, transparent)',
    },
  })
}
