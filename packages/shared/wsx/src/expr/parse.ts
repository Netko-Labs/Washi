import {
  AGGREGATE_NAMES,
  EXPR_LIMITS,
  FUNCTION_ARITY,
  FUNCTION_NAMES,
  SCOPE_ARG,
} from './constants'
import { ExprBudgetError, ExprSyntaxError } from './errors'
import { tokenize } from './tokenize'
import type {
  AggregateName,
  AggregateSource,
  BinaryOperator,
  ExprAst,
  FunctionName,
  Scalar,
  Token,
} from './types'

const COMPARISON: BinaryOperator[] = ['=', '!=', '<', '<=', '>', '>=']
const ADDITIVE: BinaryOperator[] = ['+', '-']
const MULTIPLICATIVE: BinaryOperator[] = ['*', '/']
const KEYWORD_LITERALS: Record<string, Scalar> = { true: true, false: false, null: null }
const LEGAL_CALLS = [...AGGREGATE_NAMES, ...FUNCTION_NAMES].join(', ')

function isAggregate(name: string): name is AggregateName {
  return (AGGREGATE_NAMES as readonly string[]).includes(name)
}

function isFunction(name: string): name is FunctionName {
  return (FUNCTION_NAMES as readonly string[]).includes(name)
}

function describe(token: Token): string {
  return token.type === 'eof' ? 'end of expression' : `\`${token.value}\``
}

class Parser {
  private readonly tokens: Token[]
  private index = 0
  private insideWhere = false

  constructor(tokens: Token[]) {
    this.tokens = tokens
  }

  parse(): ExprAst {
    const ast = this.parseOr()
    if (this.peek().type !== 'eof') this.fail(`unexpected ${describe(this.peek())}`)
    return ast
  }

  private peek(): Token {
    return this.tokens[this.index] as Token
  }

  private next(): Token {
    const token = this.peek()
    this.index += 1
    return token
  }

  private fail(message: string, token: Token = this.peek()): never {
    throw new ExprSyntaxError(message, token.offset)
  }

  private at(type: Token['type'], value: string): boolean {
    const token = this.peek()
    return token.type === type && token.value === value
  }

  private expect(value: string): Token {
    if (!this.at('punct', value)) this.fail(`expected \`${value}\`, got ${describe(this.peek())}`)
    return this.next()
  }

  private parseOr(): ExprAst {
    let left = this.parseAnd()
    while (this.at('ident', 'or')) {
      this.next()
      left = { kind: 'binary', operator: 'or', left, right: this.parseAnd() }
    }
    return left
  }

  private parseAnd(): ExprAst {
    let left = this.parseNot()
    while (this.at('ident', 'and')) {
      this.next()
      left = { kind: 'binary', operator: 'and', left, right: this.parseNot() }
    }
    return left
  }

  private parseNot(): ExprAst {
    if (this.at('ident', 'not')) {
      this.next()
      return { kind: 'unary', operator: 'not', operand: this.parseNot() }
    }
    return this.parseBinary(COMPARISON, () => this.parseBinary(ADDITIVE, () => this.parseTerm()))
  }

  private parseTerm(): ExprAst {
    return this.parseBinary(MULTIPLICATIVE, () => this.parseUnary())
  }

  private parseBinary(operators: BinaryOperator[], operand: () => ExprAst): ExprAst {
    let left = operand()
    for (;;) {
      const token = this.peek()
      if (token.type !== 'punct' || !operators.includes(token.value as BinaryOperator)) return left
      this.next()
      left = { kind: 'binary', operator: token.value as BinaryOperator, left, right: operand() }
    }
  }

  private parseUnary(): ExprAst {
    if (this.at('punct', '-')) {
      this.next()
      const operand = this.parseUnary()
      if (operand.kind === 'literal' && typeof operand.value === 'number') {
        return { kind: 'literal', value: -operand.value }
      }
      return { kind: 'unary', operator: '-', operand }
    }
    return this.parsePrimary()
  }

  private parsePrimary(): ExprAst {
    const token = this.next()
    switch (token.type) {
      case 'number':
        this.rejectPostfix()
        return { kind: 'literal', value: Number(token.value) }
      case 'string':
        this.rejectPostfix()
        return { kind: 'literal', value: token.value }
      case 'arg':
        return this.parseArg(token)
      case 'ident':
        return this.parseIdentifier(token)
      case 'punct':
        if (token.value === '(') {
          const inner = this.parseOr()
          this.expect(')')
          this.rejectPostfix()
          return inner
        }
        return this.fail(`unexpected \`${token.value}\``, token)
      case 'eof':
        return this.fail('unexpected end of expression', token)
    }
  }

  private parseArg(token: Token): ExprAst {
    if (this.at('punct', '.')) {
      this.next()
      if (token.value !== '$row') {
        this.fail(`property access is only allowed on \`$row\`, not \`${token.value}\``, token)
      }
      const column = this.next()
      if (column.type !== 'ident') this.fail('expected a column name after `$row.`', column)
      this.rejectChain()
      this.rejectPostfix()
      return { kind: 'member', arg: token.value, column: column.value }
    }
    this.rejectPostfix()
    return { kind: 'arg', name: token.value }
  }

  private parseIdentifier(token: Token): ExprAst {
    const keyword = KEYWORD_LITERALS[token.value]
    if (keyword !== undefined) {
      this.rejectPostfix()
      return { kind: 'literal', value: keyword }
    }
    if (token.value === 'where') {
      this.fail('`where` only belongs inside an aggregate, like `count(t where x)`', token)
    }
    if (this.at('punct', '(')) return this.parseCall(token)
    if (this.at('punct', '.')) {
      this.fail(
        'property access is only allowed on `$row` (`$row.column`) or on a table inside an aggregate (`sum(tasks.points)`)',
        this.peek(),
      )
    }
    return { kind: 'identifier', name: token.value }
  }

  private parseCall(name: Token): ExprAst {
    if (isAggregate(name.value)) return this.parseAggregate(name.value, name)
    if (isFunction(name.value)) return this.parseFunction(name.value)
    return this.fail(`unknown function \`${name.value}\` — only ${LEGAL_CALLS}`, name)
  }

  private parseFunction(name: FunctionName): ExprAst {
    this.expect('(')
    const args: ExprAst[] = []
    if (!this.at('punct', ')')) {
      args.push(this.parseOr())
      while (this.at('punct', ',')) {
        this.next()
        args.push(this.parseOr())
      }
    }
    this.expect(')')
    this.rejectPostfix()
    const arity = FUNCTION_ARITY[name]
    if (args.length !== arity)
      this.fail(`\`${name}()\` takes ${arity} arguments, got ${args.length}`)
    return { kind: 'call', name, args }
  }

  private parseAggregate(name: AggregateName, at: Token): ExprAst {
    if (this.insideWhere) this.fail('aggregates cannot nest inside a `where` clause', at)
    this.expect('(')
    const source = this.parseAggregateSource()
    let column: string | null = null
    if (this.at('punct', '.')) {
      this.next()
      const token = this.next()
      if (token.type !== 'ident') this.fail('expected a column name', token)
      column = token.value
      this.rejectChain()
    }
    let where: ExprAst | null = null
    if (this.at('ident', 'where')) {
      this.next()
      this.insideWhere = true
      where = this.parseOr()
      this.insideWhere = false
    }
    this.expect(')')
    this.rejectPostfix()
    return { kind: 'aggregate', name, source, column, where }
  }

  private parseAggregateSource(): AggregateSource {
    const token = this.next()
    if (token.type === 'arg' && token.value === SCOPE_ARG) return { kind: 'scope' }
    if (token.type === 'ident') {
      if (this.at('punct', '(')) this.fail('aggregates cannot nest', token)
      return { kind: 'table', name: token.value }
    }
    return this.fail(`expected a table name or \`$scope\`, got ${describe(token)}`, token)
  }

  private rejectChain(): void {
    if (this.at('punct', '.')) this.fail('`.` chains longer than one segment are not allowed')
  }

  private rejectPostfix(): void {
    if (this.at('punct', '(')) this.fail('method calls are not allowed')
    if (this.at('punct', '.')) this.fail('property access is not allowed here')
  }
}

export function depthOf(ast: ExprAst): number {
  switch (ast.kind) {
    case 'literal':
    case 'identifier':
    case 'arg':
    case 'member':
      return 1
    case 'unary':
      return 1 + depthOf(ast.operand)
    case 'binary':
      return 1 + Math.max(depthOf(ast.left), depthOf(ast.right))
    case 'aggregate':
      return 1 + (ast.where ? depthOf(ast.where) : 0)
    case 'call':
      return 1 + ast.args.reduce((max, arg) => Math.max(max, depthOf(arg)), 0)
  }
}

/** Parse expr source into an AST. Throws ExprSyntaxError; ExprBudgetError past the depth cap. */
export function parseExpr(source: string, maxDepth = EXPR_LIMITS.depth): ExprAst {
  const ast = new Parser(tokenize(source)).parse()
  if (depthOf(ast) > maxDepth) throw new ExprBudgetError('depth', maxDepth)
  return ast
}
