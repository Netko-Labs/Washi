import { parse as parseProgram } from '@babel/parser'
import type * as t from '@babel/types'
import type { Diagnostic, PageSplit } from './types'

export class WsxParseError extends Error {
  readonly diagnostics: Diagnostic[]

  constructor(diagnostics: Diagnostic[]) {
    super(diagnostics.map((diagnostic) => diagnostic.message).join('; '))
    this.name = 'WsxParseError'
    this.diagnostics = diagnostics
  }
}

export function fail(message: string, node?: { loc?: t.SourceLocation | null }): never {
  throw new WsxParseError([
    {
      severity: 'error',
      message,
      line: node?.loc?.start.line,
      column: node?.loc?.start.column,
    },
  ])
}

export function syntaxError(error: unknown, lineOffset: number): WsxParseError {
  if (error instanceof WsxParseError) return error
  const parseError = error as { message?: string; loc?: { line: number; column: number } }
  return new WsxParseError([
    {
      severity: 'error',
      message: parseError.message ?? 'invalid WSX syntax',
      line: parseError.loc ? parseError.loc.line + lineOffset : undefined,
      column: parseError.loc?.column,
    },
  ])
}

function codeOf(text: string): t.Statement[] {
  const statements = parseProgram(text, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript'],
  }).program.body
  for (const statement of statements) {
    if (statement.type === 'ExportDefaultDeclaration') {
      fail('a page is its own default export — export named functions only', statement)
    }
  }
  return statements
}

/** Where the markup may start: every line that opens a `<Sheet`. */
const SHEET_LINE = /^<Sheet\b/gm

/**
 * A page's code and its markup. A page that runs opens with code; its markup is the first `<Sheet`
 * at a line's start with code above it that parses. Throws WsxParseError.
 */
export function splitPage(source: string): PageSplit {
  const text = source.trim()
  if (text.length === 0) throw new WsxParseError([{ severity: 'error', message: 'empty sheet' }])
  const starts = [...text.matchAll(SHEET_LINE)].map((match) => match.index).filter((at) => at > 0)
  if (starts.length === 0 || text.startsWith('<'))
    return { code: null, markup: text, lineOffset: 0 }

  let failure: unknown = null
  for (const start of starts) {
    const code = text.slice(0, start)
    try {
      return {
        code: { text: code.trim(), statements: codeOf(code) },
        markup: text.slice(start),
        lineOffset: code.split('\n').length - 1,
      }
    } catch (error) {
      failure = syntaxError(error, 0)
    }
  }
  throw failure
}
