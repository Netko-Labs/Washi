import { EXPR_MAX_SOURCE_LENGTH } from './constants'
import { ExprSyntaxError } from './errors'
import type { Scan, Token } from './types'

const PUNCTUATION = ['<=', '>=', '!=', '==', '(', ')', ',', '.', '+', '-', '*', '/', '=', '<', '>']

const FORBIDDEN: Record<string, string> = {
  '%': '`%` is not in the grammar',
  '?': 'ternaries are not allowed',
  ':': 'ternaries and assignment are not allowed',
  '[': 'array literals and indexing are not allowed',
  ']': 'array literals and indexing are not allowed',
  '{': 'object literals are not allowed',
  '}': 'object literals are not allowed',
  '`': 'template strings are not allowed',
  '&': 'bitwise ops are not allowed — use `and`',
  '|': 'bitwise ops are not allowed — use `or`',
  '^': 'bitwise ops are not allowed',
  '~': 'bitwise ops are not allowed',
  ';': 'statements are not allowed',
  '\\': 'backslashes are only allowed inside strings',
}

const RESERVED = new Set([
  'function',
  'new',
  'if',
  'else',
  'for',
  'while',
  'do',
  'return',
  'let',
  'const',
  'var',
  'class',
  'this',
  'import',
  'export',
  'typeof',
  'in',
  'of',
  'yield',
  'async',
  'await',
])

const IDENT_START = /[a-zA-Z_]/
const IDENT_PART = /[a-zA-Z0-9_]/
const DIGIT = /[0-9]/
const WHITESPACE = /\s/

function readWhile(source: string, from: number, pattern: RegExp): number {
  let end = from
  while (end < source.length && pattern.test(source[end] as string)) end += 1
  return end
}

function readString(source: string, start: number): Scan {
  const quote = source[start]
  let out = ''
  let i = start + 1
  while (i < source.length) {
    const char = source[i] as string
    if (char === '\\') {
      const next = source[i + 1]
      if (next === undefined) break
      out += next === 'n' ? '\n' : next === 't' ? '\t' : next
      i += 2
      continue
    }
    if (char === quote) return { token: { type: 'string', value: out, offset: start }, end: i + 1 }
    out += char
    i += 1
  }
  throw new ExprSyntaxError('unterminated string', start)
}

function readNumber(source: string, start: number): Scan {
  let end = readWhile(source, start, DIGIT)
  if (source[end] === '.' && DIGIT.test(source[end + 1] ?? '')) {
    end = readWhile(source, end + 1, DIGIT)
  }
  if (IDENT_START.test(source[end] ?? '') || source[end] === '.') {
    throw new ExprSyntaxError(`malformed number at \`${source.slice(start, end + 1)}\``, start)
  }
  return { token: { type: 'number', value: source.slice(start, end), offset: start }, end }
}

function readWord(source: string, start: number): Scan {
  const end = readWhile(source, start + 1, IDENT_PART)
  const value = source.slice(start, end)
  if (RESERVED.has(value)) {
    throw new ExprSyntaxError(
      `\`${value}\` is not allowed — expr has no definitions, loops, or assignment`,
      start,
    )
  }
  return { token: { type: 'ident', value, offset: start }, end }
}

function readArg(source: string, start: number): Scan {
  if (!IDENT_START.test(source[start + 1] ?? '')) {
    throw new ExprSyntaxError('`$` must be followed by an argument name, like `$row`', start)
  }
  const end = readWhile(source, start + 1, IDENT_PART)
  return { token: { type: 'arg', value: source.slice(start, end), offset: start }, end }
}

function readPunctuation(source: string, start: number): Scan {
  const punct = PUNCTUATION.find((candidate) => source.startsWith(candidate, start))
  if (!punct) {
    const char = source[start]
    const message =
      char === '!' ? '`!` is not allowed — use `not`' : `unexpected character \`${char}\``
    throw new ExprSyntaxError(message, start)
  }
  const value = punct === '==' ? '=' : punct
  return { token: { type: 'punct', value, offset: start }, end: start + punct.length }
}

function scan(source: string, i: number, char: string): Scan {
  if (char === '"' || char === "'") return readString(source, i)
  if (DIGIT.test(char)) return readNumber(source, i)
  if (IDENT_START.test(char)) return readWord(source, i)
  if (char === '$') return readArg(source, i)
  return readPunctuation(source, i)
}

export function tokenize(source: string): Token[] {
  if (source.length > EXPR_MAX_SOURCE_LENGTH) {
    throw new ExprSyntaxError(
      `expression is longer than ${EXPR_MAX_SOURCE_LENGTH} characters`,
      EXPR_MAX_SOURCE_LENGTH,
    )
  }
  const tokens: Token[] = []
  let i = 0
  while (i < source.length) {
    const char = source[i] as string
    if (WHITESPACE.test(char)) {
      i += 1
      continue
    }
    if (source.startsWith('=>', i)) throw new ExprSyntaxError('lambdas are not allowed', i)
    const forbidden = FORBIDDEN[char]
    if (forbidden) throw new ExprSyntaxError(forbidden, i)
    const { token, end } = scan(source, i, char)
    tokens.push(token)
    i = end
  }
  tokens.push({ type: 'eof', value: '', offset: source.length })
  return tokens
}
