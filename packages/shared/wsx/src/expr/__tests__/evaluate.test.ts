import { describe, expect, test } from 'bun:test'
import {
  ExprBudgetError,
  ExprEvalError,
  type ExprScope,
  ExprSyntaxError,
  evaluateExpr,
  parseExpr,
} from '../../index'
import { SCOPE } from './fixtures'

function run(source: string, scope: ExprScope = SCOPE) {
  return evaluateExpr(parseExpr(source), scope)
}

describe('evaluate', () => {
  test('arithmetic', () => {
    expect(run('1 + 2')).toBe(3)
    expect(run('5 - 7')).toBe(-2)
    expect(run('3 * 2.5')).toBe(7.5)
    expect(run('7 / 2')).toBe(3.5)
    expect(run('7 / 0')).toBeNull()
    expect(run('null + 1')).toBeNull()
    expect(run('-budget')).toBe(-10)
  })

  test('string join and the format guard', () => {
    expect(run("'a' + 'b'")).toBe('ab')
    expect(run("label + '!'")).toBe('Q3!')
    expect(() => run("'total: ' + budget")).toThrow(ExprEvalError)
    expect(() => run("'total: ' + budget")).toThrow(
      'expr may compute a value, never format it — use Money/Text',
    )
    expect(() => run("now() + ' ms'")).toThrow('never format it')
    expect(() => run('true + 1')).toThrow('expects numbers or strings')
    expect(() => run("'a' * 2")).toThrow('`*` expects numbers')
  })

  test('comparison', () => {
    expect(run('1 < 2')).toBe(true)
    expect(run('2 <= 2')).toBe(true)
    expect(run('3 > 4')).toBe(false)
    expect(run('4 >= 4')).toBe(true)
    expect(run("'a' < 'b'")).toBe(true)
    expect(run("1 = '1'")).toBe(false)
    expect(run("1 != '1'")).toBe(true)
    expect(run('null = null')).toBe(true)
    expect(run('null != 1')).toBe(true)
    expect(run("1 < 'a'")).toBe(false)
    expect(run('null < 1')).toBe(false)
    expect(run('true < false')).toBe(false)
  })

  test('boolean', () => {
    expect(run('true and false')).toBe(false)
    expect(run('true or false')).toBe(true)
    expect(run('not flag')).toBe(false)
    expect(run('null or true')).toBe(true)
    expect(run('false and (1 / 0)')).toBe(false)
    expect(run('true or (1 / 0)')).toBe(true)
    expect(() => run('1 and true')).toThrow('`and` expects a boolean')
    expect(() => run("not 'x'")).toThrow('`not` expects a boolean')
  })

  test('state, args, $row.column', () => {
    expect(run('budget - done_count')).toBe(9)
    expect(run('$value * 2')).toBe(84)
    expect(run("$group = 'open'")).toBe(true)
    expect(run('$row.points + 1')).toBe(4)
    expect(run('$row.missing')).toBeNull()
    expect(() => run('$row')).toThrow('is a row, not a value')
    expect(() => run('$value.x')).toThrow(ExprSyntaxError)
    expect(() => run('nope')).toThrow('unknown identifier `nope`')
    expect(() => run('$nope')).toThrow('unknown argument `$nope`')
  })

  test('aggregates', () => {
    expect(run('count(tasks)')).toBe(4)
    expect(run('sum(tasks.points)')).toBe(16)
    expect(run('avg(tasks.points)')).toBeCloseTo(16 / 3)
    expect(run('min(tasks.points)')).toBe(3)
    expect(run('max(tasks.points)')).toBe(8)
    expect(run("count(tasks where status = 'open')")).toBe(3)
    expect(run('sum(tasks.points where done = true)')).toBe(5)
    expect(run('sum(tasks.points where done = false and points > 3)')).toBe(8)
    expect(run('avg(tasks.points where points > 100)')).toBeNull()
    expect(run('min(tasks.points where points > 100)')).toBeNull()
    expect(run('sum(tasks.points where points > 100)')).toBe(0)
    expect(run('count(tasks where points = null)')).toBe(1)
  })

  test('where clause resolves columns first, then state', () => {
    expect(run("count(tasks where status = 'state-status')")).toBe(0)
    expect(run('count(tasks where points < budget)')).toBe(3)
    expect(run('count(tasks where points > $row.points)')).toBe(2)
  })

  test('$scope aggregates', () => {
    expect(run('count($scope)')).toBe(2)
    expect(run('sum($scope.points)')).toBe(8)
    expect(run("count($scope where status = 'open')")).toBe(1)
    expect(() => run('count($scope)', { ...SCOPE, scopeRows: undefined })).toThrow(
      '`$scope` has no rows',
    )
  })

  test('unknown table names the table', () => {
    expect(() => run('count(people)')).toThrow('unknown table `people`')
    const throwing: ExprScope = {
      ...SCOPE,
      rows: () => {
        throw new Error('boom')
      },
    }
    expect(() => run('count(tasks)', throwing)).toThrow('unknown table `tasks`')
  })

  test('now() and days()', () => {
    expect(run('now()')).toBe(SCOPE.now)
    expect(run("days('2026-09-01', '2026-09-08')")).toBe(7)
    expect(run("days('2026-09-08', '2026-09-01')")).toBe(-7)
    expect(run("days('2026-09-01', now())")).toBe(7)
    expect(run("days(now(), '2026-09-08T12:00:00Z')")).toBe(0)
    expect(run('days(0, 86400000 * 3)')).toBe(3)
    expect(run('days(null, now())')).toBeNull()
    expect(() => run("days('yesterday', now())")).toThrow('expected an ISO date string')
    expect(run("days(now(), '2026-09-30') > 20")).toBe(true)
  })

  test('month(), year() and when() — what a formula column needs', () => {
    expect(run("month('2026-11-01')")).toBe('2026-11')
    expect(run("month('2026-11-30T23:00:00Z')")).toBe('2026-11')
    expect(run("year('2026-11-01')")).toBe(2026)
    expect(run('month(null)')).toBeNull()
    expect(run("when(1 > 0, 'yes', 'no')")).toBe('yes')
    expect(run('when(false, 1 / 0, 2)')).toBe(2)
    expect(() => run('month(1, 2)')).toThrow('takes 1 arguments')
  })

  test('step budget', () => {
    expect(() => run('count(tasks)')).not.toThrow()
    expect(() => evaluateExpr(parseExpr('count(tasks)'), SCOPE, { budget: 3 })).toThrow(
      ExprBudgetError,
    )
    expect(() => evaluateExpr(parseExpr('count(tasks)'), SCOPE, { budget: 3 })).toThrow(
      'step budget of 3',
    )
    const wide = Array.from({ length: 3000 }, (_, i) => ({ n: i }))
    const big: ExprScope = { ...SCOPE, rows: () => wide }
    expect(() => run('count(wide)', big)).toThrow(ExprBudgetError)
    expect(evaluateExpr(parseExpr('count(wide)'), big, { budget: 5000 })).toBe(3000)
  })

  test('depth cap at evaluate', () => {
    const ast = parseExpr('((((1))))')
    expect(evaluateExpr(ast, SCOPE)).toBe(1)
    const deep = parseExpr(`${'-'.repeat(10)}budget`)
    expect(() => evaluateExpr(deep, SCOPE, { depth: 5 })).toThrow(ExprBudgetError)
    expect(() => evaluateExpr(deep, SCOPE, { depth: 5 })).toThrow('deeper than 5')
  })
})
