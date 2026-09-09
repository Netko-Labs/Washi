# WSX — the page format

The format an agent writes and Washi renders. Draft 0.4. This is the complete vocabulary: if a
design needs something that is not here, it writes `<Missing kind reason />` and the registry hears
about it — there is no escape hatch.

Generated against the live registry (`@washi/paper`) on 2026-09-08.

> **Components own appearance; pages own content and meaning.**
> A page cannot express a colour, a font size, a margin or a radius. It picks from four enums. That
> is what makes agent-written pages look consistent without prompting.

---

## 1. What a page is

A single JSX-shaped element tree stored as text. It looks like React and is **not React**: it is
data. Parsed, schema-validated, rendered. Nothing in it executes.

```jsx
<Sheet title="Sprint 12" icon="kanban" feel="board" theme="aizome" wsx="1">
  <Hero title="Sprint 12" subtitle="Two weeks, one demo." size="md" />
  <Grid>
    <Card span={4}><Stat label="open" expr="count(tasks where status = 'open')" /></Card>
    <Card span={4}><Stat label="points" expr="sum(tasks.points)" trend="up" /></Card>
    <Card span={4}><Stat label="done" expr="count(tasks where done = true) / count(tasks) * 100" /></Card>
  </Grid>
  <Section title="By status">
    <Board bind={{ table: 'tasks' }} groupBy="status" />
  </Section>
  <Button action={{ verb: 'table.insert', table: 'tasks', data: { title: 'New task', status: 'todo' } }}>
    Add task
  </Button>
</Sheet>
```

---

## 2. Grammar

Hard rules. Violating any of them is a validation error, not a warning.

| Rule | Detail |
|---|---|
| One root | Exactly one `<Sheet>`. No fragments |
| Registry primitives only | Capitalised names from §5. No `<div>`, no `<Box>`, no `<Span>`, no `<H1>` |
| Props are JSON literals | Strings, numbers, booleans, `null`, arrays, objects. `{-1}` is allowed |
| No expressions in props | Except the `expr` prop, which takes the closed grammar in §7 as a string |
| No handlers | There is no `onClick`. Side effects are `action` objects (§9) |
| Children | Elements, text, or a `{literal}` that renders as text |

---

## 3. The Sheet

| Prop | Type | Notes |
|---|---|---|
| `title` | string, 1–200 | Required. Sidebar, tabs, breadcrumb |
| `icon` | registry name | `notebook book bookmark calendar chart checklist clock compass flag flask heart home inbox kanban leaf map money music pen plane rocket sparkles star sun tag target tools user`. **Never an emoji** |
| `tags` | string[] ≤32 | |
| `feel` | `note` `editorial` `board` `deck` | Reproportions every primitive at once: measure, density, title scale, card borders. **The only way to a materially different look** |
| `theme` | `washi` `sumi` `aizome` `matcha` `kobai` `kraft` `yukiwa` `yozora` | Eight designed pairs. 8 tokens × 2 modes each, nothing else |
| `accent` | `accent` `info` `success` `warning` `danger` | Which tone the washi kit (Tape, Stamp, Chip) takes |
| `state` | `{ local?, stored? }` | Declared state keys (§6) |
| `visibility` | `private` `shared` `public` | |
| `wsx` | `"1"` | Format version. Always write it |

The Sheet owns paper, ink, measure, padding and rhythm. It has **no `class`** and can never pin
light/dark — readers own the mode.

---

## 4. The styling surface

Four enums. Every primitive accepts all four; CSS decides what each means per primitive.

| Prop | Values | Effect |
|---|---|---|
| `variant` | `plain` `outline` `filled` `raised` `tape` | Surface and border treatment. Never padding or radius |
| `tone` | `neutral` `accent` `info` `success` `warning` `danger` | Meaning. Each is a pre-checked fg/bg/border triplet — contrast cannot fail |
| `size` | `sm` `md` `lg` | Type and space scale together |
| `emphasis` | `quiet` `normal` `strong` | Hierarchy within the current tone |

Two layout tokens: `span` (1–12, inside `Grid`) and `gap` (`tight` `normal` `loose`, on `Section`
`Row` `Stack` `Grid`).

**Locked — not addressable by a page:** vertical rhythm (the parent's), measure and page frame (the
Sheet's), the type scale (six roles, selected by `Title level` / `Text size`), colour, radius,
shadow, borders (reachable only through `tone` / `variant` / `theme`). **There is no hex in a page,
ever.**

### `class`

Optional, layout-only, ~40 tokens:

| Group | Tokens |
|---|---|
| flow | `row col wrap nowrap grid-2 grid-3 grid-4` |
| spacing | `gap-0 gap-tight gap-normal gap-loose p-0 p-1 p-2 p-3 p-4 p-6 p-8` |
| alignment | `items-start items-center items-end items-stretch items-baseline justify-start justify-center justify-end justify-between text-left text-center text-right` |
| sizing | `grow none full` |
| container | `@sm:row @sm:col @sm:grid-2 @sm:grid-3 @md:row @md:col @md:grid-2 @md:grid-3 @md:grid-4 @lg:row @lg:grid-3 @lg:grid-4` |

Anything else is a validation error that names the prop to use instead: `bg-red-500` → "colour is
not addressable in class — use tone"; `mt-6` → "rhythm belongs to the parent — use Section, Stack or
gap"; `md:flex` → "use @sm: @md: @lg: (the page measures itself)". No arbitrary values.

---

## 5. Primitives — 46 in seven groups

`children` is **none** (self-closing), **text** (text only), or **nodes** (elements and text). Every
primitive accepts the four enums and `class`; the table lists its own props.

### Frame — 6 · owns rhythm

| Primitive | Props | Children | Notes |
|---|---|---|---|
| `Sheet` | §3 | nodes | The page |
| `Section` | `title?` `gap?` | nodes | A band with a label; supplies the rhythm children cannot set |
| `Row` | `gap?` `align?` `start\|center\|end\|baseline\|stretch` | nodes | Horizontal flow, wraps |
| `Stack` | `gap?` `align?` | nodes | Vertical flow |
| `Grid` | `gap?` | nodes | 12-column field; children take `span`. **Always** one column under 400px |
| `Divider` | — | none | `emphasis="strong"` for a rule in ink |

### Text — 10 block + 4 inline

| Primitive | Props | Children | Notes |
|---|---|---|---|
| `Title` | `level?` `1\|2\|3` | nodes | Young Serif at 1–2, Karla bold at 3. Scale owned by `feel` |
| `Text` | `lead?` | nodes | The paragraph. `emphasis="quiet"` is muted; `lead` is the opener |
| `List` | `marker?` `bullet\|number\|check` | nodes | Holds `Item`s |
| `Item` | `done?` | nodes | Only inside `List`. `done` renders the check |
| `Quote` | — | nodes | Serif, tone rule on the left |
| `Code` | `lang?` | text | Wraps and scrolls |
| `Pair` | `term` | nodes | Term / definition — the spec-table workhorse |
| `Note` | — | nodes | Footnote, auto-numbered in document order |
| `Source` | — | nodes | Attribution, auto-numbered |
| `Money` | `value?` `expr?` `currency` (ISO 4217) | none | Symbol, grouping and negative form from the **vault locale at render**. `expr` may compute the number, never build the string |
| `Mark` | — | text | Accent a phrase |
| `Kbd` | — | text | |
| `Ref` | `sheet` | text | Link to a sheet; empty children show its title |
| `Tag` | — | text | |

### Surface — 4

| Primitive | Props | Children | Notes |
|---|---|---|---|
| `Card` | `title?` | nodes | `variant` picks plain / outline / filled / raised / tape |
| `Callout` | `title?` | nodes | An aside that means something. Carries an icon per tone — tone is never the only signal |
| `Hero` | `title` `subtitle?` `align?` `left\|center` | none | Page opener. `size="md"` for a working page, default lg |
| `Figure` | `src` (**https only**) `alt` `caption?` `ratio?` `16:9\|4:3\|3:2\|1:1` | none | Aspect held so text never jumps |

### Data out — 9 · reads

| Primitive | Props | Children | Notes |
|---|---|---|---|
| `Repeat` | `bind` `as?` `empty?` | nodes | Renders children per row with `$row.column` in scope (text, string props, and strings inside `action`/`bind` objects). **Cannot recurse** |
| `Table` | `bind` `columns?` `empty?` | none | |
| `Stat` | `value?` `expr?` `label` `hint?` `trend?` `up\|down\|flat` | none | |
| `Chart` | `bind` `kind` `bar\|line\|area\|donut` `label?` `value?` `empty?` | none | Palette from the chart ramp; series colours not settable |
| `Timeline` | — | nodes | Holds `Step`s |
| `Step` | `marker` (≤8) `title?` | nodes | Only inside `Timeline` |
| `Progress` | `value?` (0–1) `expr?` `label?` | none | |
| `Badge` | `expr?` | text | `expr` replaces the text |
| `Avatar` | `label` | none | Initials |

Empty, loading and error states ship with every bound primitive, designed once. A page may override
the empty *sentence* (`empty="…"`) and nothing else.

### Data in — 6 · writes

| Primitive | Props | Children | Notes |
|---|---|---|---|
| `Field` | `field` `kind` `text\|number\|date\|select\|boolean` `label?` `help?` `table?` `row?` | none | One primitive over all column types. Writes `table.update` on blur (select and boolean on change). `select` offers the column's options from the table spec — a page never enumerates them. Inside `Repeat`, `row` defaults to `$row.id` |
| `Board` | `bind` `groupBy` `groups?` `rank?` `kicker?` `title?` `badge?` `meta?` `avatar?` `onAdd?` `empty?` | none | Grouped, draggable records. A drop writes `table.reorder` with the group column and a fractional `rank`. `groups` fixes column order; a numeric `meta` totals per column; badge values that carry meaning (`highest high bug` → danger, `medium` → warning, `story` → success, `task` → info) take that tone; `onAdd` runs per column with `$group` substituted |
| `Button` | `action` | text | |
| `Task` | `row?` `done?` | text | Checkbox bound to a row's `done` column. Inside `Repeat`, `row` defaults to `$row.id` |
| `Switch` | `state` `label?` | none | Writes a boolean |
| `Slider` | `state` `min?` `max?` `step?` `label?` | none | Writes a number |

### Flow — 4 · no cosmetics

| Primitive | Props | Children | Notes |
|---|---|---|---|
| `Show` | `expr` | nodes | Renders children when the expression is truthy. **No `class`** |
| `Tabs` | `labels` (1–12) `state?` | nodes | One `Tab` per label |
| `Tab` | — | nodes | Only inside `Tabs` |
| `Reveal` | `label` `state?` | nodes | Disclosure |

### Washi kit — 4 + `Missing`

| Primitive | Props | Children | Notes |
|---|---|---|---|
| `Tape` | — | text | Torn washi-tape label |
| `Stamp` | `label` (≤8) | none | Hanko mark |
| `Chip` | — | text | Dotted status pill |
| `Mascot` | `mood?` `happy\|sleep\|curious\|sad\|dizzy\|wink` `size?` | none | Washi-chan. **One per page** |
| `Missing` | `kind` `reason` | none | A capability the registry lacks: renders a labelled placeholder, leaves the page valid, files a registry request |

The kit takes `tone` from the sheet `accent` so a page cannot assemble a rainbow.

### Not in this registry yet

`Matrix` · `Calendar` · `Timer` · `Scene` / `Beat` / `Stepper` · `Filter` / `Facet` / `Search` /
`Sort` / `Segment`. Write them as `<Missing kind="Matrix" reason="…" />` — the validator says so
when it meets an unknown name.

---

## 6. State

```jsx
<Sheet title="Kit" state={{ local: { tab: 'board' }, stored: { mine: false, budget: 40 } }}>
  <Switch state="mine" label="Only mine" />
  <Slider state="budget" min={0} max={100} step={5} label="Budget" />
  <Show expr="mine = true and budget > 20">…</Show>
  <Tabs labels={['board', 'list']} state="tab">…</Tabs>
</Sheet>
```

| Scope | Lifetime | Use |
|---|---|---|
| `local` | The tab | Tab selection, open disclosure. Never syncs |
| `stored` | Persistent per reader | Filters, toggles. *Today behaves as `local` — persistence is a later milestone* |
| records | Persistent, shared | Table rows, through binds and verbs |

Values are scalars: string, number, boolean, `null`. Controls write keys; `expr` reads them.

---

## 7. Expressions — `expr`

A closed grammar, parsed to an AST, validated against declared state and bound columns, evaluated
by the renderer with a depth cap (24) and a step budget (2000). Source ≤ 512 characters.

**In:** numbers, quoted strings, `true false null` · arithmetic `+ - * /` · comparison
`= != < <= > >=` · `and or not` · string `+` string · state keys · `$row.column` inside `Repeat` ·
aggregates `count sum avg min max` over a table or `$scope`, with optional `where` ·
`now()` · `days(a, b)`.

**Out:** functions, lambdas, loops, recursion, regex, template strings, `%`, ternaries, arrays,
objects, method calls, property chains. Joining a number or date into a string is refused: *expr
computes a value, never formats it — use Money / Text.*

```
<Stat label="remaining" expr="budget - sum(tasks.points)" />
<Show expr="count(tasks where status = 'open') = 0">…</Show>
<Progress expr="count(tasks where done = true) / count(tasks)" />
<Money expr="sum(expenses.amount where paid_by = 'me')" currency="EUR" />
```

Division by zero is `null`. `now()` is frozen per render pass — two reads in one page always agree.
Tables an expression aggregates over are fetched once per sheet and again after every verb.

---

## 8. Live data — `bind`

A query descriptor against an agent-defined table. Same grammar everywhere.

```jsx
bind={{
  table: 'tasks',
  where: [{ column: 'status', op: 'eq', value: 'open' }],
  orderBy: { column: 'points', direction: 'desc' },
  limit: 50,
}}
```

| Field | Notes |
|---|---|
| `table` | Required. snake_case |
| `where` | ≤16 filters, ANDed. `op`: `eq ne gt gte lt lte contains in` |
| `orderBy` | `{ column, direction }` |
| `limit` | 1–1000, default 200 |
| `groupBy` | `{ column, aggregates: [{ fn, column? }] }` — `fn`: `count sum avg min max`. Feeds `Chart` directly |

Every column named must exist. Column types: `text number boolean date select`. Bound primitives
refetch after any verb runs on the page.

---

## 9. Actions

The only side-effect channel. Interaction is a prop, not a handler.

| Verb | Shape | Notes |
|---|---|---|
| `sheet.open` | `{ verb, sheet }` | |
| `sheet.create` | `{ verb, title }` | |
| `table.insert` | `{ verb, table, data }` | |
| `table.update` | `{ verb, table, row, set }` | Patch by id. `Field` writes this |
| `table.reorder` | `{ verb, table, row, set }` | Same shape; `Board` writes the group column and a fractional rank so concurrent drags converge |
| `url.open` | `{ verb, url }` | **Denied from a page** until its consent UI ships |

Reversible in-vault verbs run on click. Every action, allowed or refused, is recorded.

---

## 10. Validation

Pages are validated before saving and before rendering. Errors name the **element path, the prop,
and the legal alternatives**:

```
Sheet > Card: prop tone: "purple" is not one of neutral · accent · info · success · warning · danger
Sheet > Text: prop color is not addressable on <Text> — use tone
Sheet > Box: <Box> is not a registry primitive — write <Missing kind="Box" reason="…" />
Sheet > Repeat > Repeat: <Repeat> cannot contain another <Repeat> — a second view is a second sheet
```

**Complexity budget:** ~400 nodes, 8 binds, 24 expressions per sheet. Over budget is a *warning*
(a prompt to split into linked sheets via `Ref`), never an error.

**Panel contract:** the same tree renders at 320, 400, 720 and full width. Under 400px every `Grid`
is one column and padding tightens. Pages never see the window.

---

## 11. Themes

Eight pairs, each exactly 8 tokens × 2 modes (`bg card ink muted border mutedBg accent
accentInk`). Fonts, radii and spacing belong to `feel`. Values live in `@washi/paper/registry`
(`THEMES`) and are checked by test for ink ≥ 7:1 and muted ≥ 4.5:1 on card.

| id | Character |
|---|---|
| `washi` | House pair, warm paper, one stamp of persimmon |
| `sumi` | Ink on stock; the accent is the ink |
| `aizome` | Indigo, cool and technical |
| `matcha` | Tea-green and stone, the quietest |
| `kobai` | Red-plum, warm and slightly formal |
| `kraft` | Parcel paper |
| `yukiwa` | Highest contrast |
| `yozora` | Night-first |

---

## 12. What WSX cannot express

Constraints, not gaps to fill.

- **Custom components, custom colours, custom type.** New capability is a new registry primitive
- **Scripts and handlers.** `expr` computes; it cannot define, loop or format
- **Network.** `Figure` is https-only; there is no fetch and no embed primitive
- **Light/dark.** Readers own the mode
- **Viewport-relative layout.** Container prefixes only
