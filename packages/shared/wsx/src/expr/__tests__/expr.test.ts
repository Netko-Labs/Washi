import { describe, expect, test } from 'bun:test'
import {
  ExprBudgetError,
  type ExprScope,
  type ExprScopeShape,
  ExprSyntaxError,
  evaluateExpr,
  parseExpr,
  validateExpr,
} from '../../index'
import { SCOPE, SHAPE } from './fixtures'

function run(source: string, scope: ExprScope = SCOPE) {
  return evaluateExpr(parseExpr(source), scope)
}

function problems(source: string, shape: ExprScopeShape = SHAPE) {
  return validateExpr(parseExpr(source), shape)
}

describe('parse', () => {
  test('literals', () => {
    expect(parseExpr('42')).toEqual({ kind: 'literal', value: 42 })
    expect(parseExpr('3.5')).toEqual({ kind: 'literal', value: 3.5 })
    expect(parseExpr('-1')).toEqual({ kind: 'literal', value: -1 })
    expect(parseExpr("'it\\'s'")).toEqual({ kind: 'literal', value: "it's" })
    expect(parseExpr('"hi"')).toEqual({ kind: 'literal', value: 'hi' })
    expect(parseExpr('true')).toEqual({ kind: 'literal', value: true })
    expect(parseExpr('null')).toEqual({ kind: 'literal', value: null })
  })

  test('precedence and associativity', () => {
    expect(parseExpr('1 + 2 * 3')).toEqual({
      kind: 'binary',
      operator: '+',
      left: { kind: 'literal', value: 1 },
      right: {
        kind: 'binary',
        operator: '*',
        left: { kind: 'literal', value: 2 },
        right: { kind: 'literal', value: 3 },
      },
    })
    expect(run('(1 + 2) * 3')).toBe(9)
    expect(run('10 - 4 - 3')).toBe(3)
    expect(run('12 / 2 / 3')).toBe(2)
    expect(run('not 1 > 2 and 3 < 4 or false')).toBe(true)
    expect(run('1 + 1 = 2')).toBe(true)
    expect(run('1 == 1')).toBe(true)
    expect(run('-budget * 2')).toBe(-20)
  })

  test('identifiers, args, member access', () => {
    expect(parseExpr('done_count')).toEqual({ kind: 'identifier', name: 'done_count' })
    expect(parseExpr('$value')).toEqual({ kind: 'arg', name: '$value' })
    expect(parseExpr('$row.points')).toEqual({ kind: 'member', arg: '$row', column: 'points' })
  })

  test('aggregates with and without where', () => {
    expect(parseExpr('count(tasks)')).toEqual({
      kind: 'aggregate',
      name: 'count',
      source: { kind: 'table', name: 'tasks' },
      column: null,
      where: null,
    })
    expect(parseExpr("sum($scope.points where status = 'open')")).toMatchObject({
      kind: 'aggregate',
      name: 'sum',
      source: { kind: 'scope' },
      column: 'points',
      where: { kind: 'binary', operator: '=' },
    })
  })

  test('syntax errors carry an offset', () => {
    try {
      parseExpr('1 + ')
      throw new Error('should have thrown')
    } catch (error) {
      expect(error).toBeInstanceOf(ExprSyntaxError)
      expect((error as ExprSyntaxError).offset).toBe(4)
    }
    expect(() => parseExpr('')).toThrow('unexpected end of expression')
    expect(() => parseExpr("'open")).toThrow('unterminated string')
    expect(() => parseExpr('1 2')).toThrow('unexpected `2`')
    expect(() => parseExpr('(1')).toThrow('expected `)`')
    expect(() => parseExpr('1.')).toThrow('malformed number')
    expect(() => parseExpr('$')).toThrow('argument name')
    expect(() => parseExpr('now(1)')).toThrow('takes 0 arguments')
    expect(() => parseExpr('days(1)')).toThrow('takes 2 arguments')
  })

  test('rejects everything outside the grammar', () => {
    const rejected: Array<[string, string]> = [
      ['function f() 1', '`function` is not allowed'],
      ['(x) => x', 'lambdas are not allowed'],
      ['for i in tasks', '`for` is not allowed'],
      ['while true', '`while` is not allowed'],
      ['x := 1', 'assignment'],
      ['7 % 2', '`%` is not in the grammar'],
      ['1 & 2', 'bitwise'],
      ['1 | 2', 'bitwise'],
      ['1 ^ 2', 'bitwise'],
      ['~1', 'bitwise'],
      ['!true', 'use `not`'],
      ['a ? 1 : 2', 'ternaries'],
      ['[1, 2]', 'array literals'],
      ['{ a: 1 }', 'object literals'],
      ['`hi`', 'template strings'],
      ['/abc/', 'unexpected `/`'],
      ['new Foo()', '`new` is not allowed'],
      ["'abc'.length", 'property access is not allowed here'],
      ['label.length', 'property access is only allowed on `$row`'],
      ['$row.a.b', '`.` chains longer than one segment'],
      ['sum(tasks.points.x)', '`.` chains longer than one segment'],
      ['$value.x', 'property access is only allowed on `$row`'],
      ['$row.upper()', 'method calls are not allowed'],
      ['label()', 'unknown function `label`'],
      ['count(count(tasks))', 'aggregates cannot nest'],
      ['count(tasks where count(tasks) > 1)', 'aggregates cannot nest'],
      ['1; 2', 'statements are not allowed'],
      ['this', '`this` is not allowed'],
      ['where', '`where` only belongs inside an aggregate'],
      ['(1)(2)', 'method calls are not allowed'],
    ]
    for (const [source, message] of rejected) {
      expect(() => parseExpr(source), source).toThrow(message)
      try {
        parseExpr(source)
      } catch (error) {
        expect(error, source).toBeInstanceOf(ExprSyntaxError)
      }
    }
  })

  test('source length cap', () => {
    expect(() => parseExpr(`1${' + 1'.repeat(200)}`)).toThrow('longer than 512')
  })

  test('depth cap at parse', () => {
    expect(() => parseExpr(`${'('.repeat(30)}1${')'.repeat(30)}`)).not.toThrow()
    expect(() => parseExpr(`${'-'.repeat(30)}budget`)).toThrow(ExprBudgetError)
    expect(() => parseExpr(`${'-'.repeat(30)}budget`)).toThrow('deeper than 24')
    expect(() => parseExpr(`${'-'.repeat(23)}budget`)).not.toThrow()
  })
})

describe('validate', () => {
  test('accepts a well-formed expression', () => {
    expect(problems('count(tasks where done = true) > budget and $row.points > 1')).toEqual([])
    expect(problems('sum($scope.points where points > 0) / $value')).toEqual([])
    expect(problems("days(now(), '2026-01-01') > done_count")).toEqual([])
  })

  test('names the identifier and the alternatives', () => {
    expect(problems('bugdet + 1')).toEqual([
      'unknown identifier `bugdet` — state keys: `budget`, `done_count`, `label`, `flag`, `status`',
    ])
    expect(problems('x', { ...SHAPE, state: [] })).toEqual([
      'unknown identifier `x` — state keys: none',
    ])
    expect(problems('$nope')).toEqual([
      'unknown argument `$nope` — event args: `$row`, `$value`, `$group`',
    ])
    expect(problems('$row')).toEqual([
      '`$row` is a row, not a value — use `$row.column` (columns: `id`, `points`, `status`)',
    ])
    expect(problems('$row.nope')).toEqual([
      'unknown column `$row.nope` — columns: `id`, `points`, `status`',
    ])
    expect(problems('$row.id', { ...SHAPE, args: ['$value'] })).toEqual([
      '`$row` is not available here — event args: `$value`',
    ])
    expect(problems('$scope')[0]).toContain('only valid as an aggregate source')
  })

  test('aggregate sources and columns', () => {
    expect(problems('count(people)')).toEqual(['unknown table `people` — tables: `tasks`'])
    expect(problems('sum(tasks.weight)')).toEqual([
      'unknown column `tasks.weight` — tasks columns: `id`, `status`, `points`, `done`, `due`',
    ])
    expect(problems('sum(tasks)')[0]).toContain('`sum` needs a column')
    expect(problems('count(tasks.points)')[0]).toContain('`count` counts rows')
    expect(problems('count($scope)', { ...SHAPE, scopeColumns: undefined })).toEqual([
      '`$scope` has no rows in this context',
    ])
    expect(problems('sum($scope.nope)')[0]).toContain('unknown column `$scope.nope`')
  })

  test('where clause scoping', () => {
    expect(problems('count(tasks where nope = 1)')).toEqual([
      'unknown identifier `nope` — tasks columns: `id`, `status`, `points`, `done`, `due`; state keys: `budget`, `done_count`, `label`, `flag`, `status`',
    ])
    expect(problems('count(tasks where points < budget)')).toEqual([])
    expect(problems("count(tasks where status = 'open')")).toEqual([
      'warning: `status` in the where clause reads the tasks column and shadows the state key',
    ])
    expect(problems('count(tasks where $row.points > points)')).toEqual([])
  })

  test('collects every problem', () => {
    expect(problems('a + b + count(c)')).toHaveLength(3)
  })
})
