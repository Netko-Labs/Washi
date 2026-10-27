export type Scalar = string | number | boolean | null
export type Row = Record<string, Scalar>
export type ExprValue = Scalar

export type ArithmeticOperator = '+' | '-' | '*' | '/'
export type ComparisonOperator = '=' | '!=' | '<' | '<=' | '>' | '>='
export type LogicalOperator = 'and' | 'or'
export type BinaryOperator = ArithmeticOperator | ComparisonOperator | LogicalOperator
export type UnaryOperator = '-' | 'not'
export type AggregateName = 'count' | 'sum' | 'avg' | 'min' | 'max'
export type FunctionName = 'now' | 'days' | 'month' | 'year' | 'when'

export interface LiteralNode {
  kind: 'literal'
  value: Scalar
}

/** A bare name: a state key, or a row column inside an aggregate `where`. */
export interface IdentifierNode {
  kind: 'identifier'
  name: string
}

export interface ArgNode {
  kind: 'arg'
  name: string
}

export interface MemberNode {
  kind: 'member'
  arg: string
  column: string
}

export interface UnaryNode {
  kind: 'unary'
  operator: UnaryOperator
  operand: ExprAst
}

export interface BinaryNode {
  kind: 'binary'
  operator: BinaryOperator
  left: ExprAst
  right: ExprAst
}

export type AggregateSource = { kind: 'table'; name: string } | { kind: 'scope' }

export interface AggregateNode {
  kind: 'aggregate'
  name: AggregateName
  source: AggregateSource
  column: string | null
  where: ExprAst | null
}

export interface CallNode {
  kind: 'call'
  name: FunctionName
  args: ExprAst[]
}

export type ExprAst =
  | LiteralNode
  | IdentifierNode
  | ArgNode
  | MemberNode
  | UnaryNode
  | BinaryNode
  | AggregateNode
  | CallNode

export type TokenType = 'number' | 'string' | 'ident' | 'arg' | 'punct' | 'eof'

export interface Token {
  type: TokenType
  value: string
  offset: number
}

export interface Scan {
  token: Token
  end: number
}

export interface ExprScopeShape {
  state: string[]
  args: string[]
  tables: Record<string, string[]>
  scopeColumns?: string[]
}

export interface ExprScope {
  state: Record<string, Scalar>
  args: Record<string, Scalar | Row>
  rows: (table: string) => Row[] | undefined
  scopeRows?: Row[]
  now: number
}

export interface ExprLimits {
  budget: number
  depth: number
}

export type ExprEvaluateOptions = Partial<ExprLimits>

export type ExprLimitKind = keyof ExprLimits

export interface EvalContext {
  scope: ExprScope
  limits: ExprLimits
  steps: number
  row: Row | null
}

export interface ValidateContext {
  shape: ExprScopeShape
  columns: string[] | null
  sourceLabel: string | null
  problems: string[]
}
