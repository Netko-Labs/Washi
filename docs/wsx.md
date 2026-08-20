# WSX — the page format

The format an agent writes and Washi renders. This is the complete vocabulary: if a design needs
something that is not here, it needs a **new component**, specified and built — there is no escape
hatch.

Generated against the live registry (`@washi/paper`) on 2026-08-20.

---

## 1. What a page is

A page is a single JSX-shaped element tree stored as text. It looks like React and is **not React**:
it is data. It is parsed, schema-validated, and rendered. Nothing in it executes.

```jsx
<Sheet title="Q3 Roadmap" icon="🗺️" class="min-h-full bg-[#0f1115] px-8 py-12 text-zinc-100 @md:px-16">
  <Box class="mx-auto max-w-2xl">
    <Span class="font-mono text-[11px] uppercase tracking-[0.3em] text-emerald-400">planning</Span>
    <H1 class="mt-3 text-5xl font-bold tracking-tight">Q3 Roadmap<Span class="text-emerald-400">.</Span></H1>
    <P class="mt-4 text-zinc-400 leading-relaxed">Dates aspirational.</P>

    <Table
      bind={{ table: 'tasks', where: [{ column: 'quarter', op: 'eq', value: 'q3' }] }}
      columns={['title', 'status', 'owner']}
      class="mt-8 rounded-xl border border-white/10 [&_th]:px-4 [&_th]:py-2 [&_th]:text-left [&_td]:px-4 [&_td]:py-2"
    />

    <Button action={{ verb: 'table.insert', table: 'tasks' }} class="mt-6 rounded-lg bg-emerald-500 px-4 py-2 font-medium text-black">
      Add task
    </Button>
  </Box>
</Sheet>
```

---

## 2. Grammar

Hard rules. Violating any of them is a validation error, not a warning.

| Rule | Detail |
|---|---|
| One root | Exactly one `<Sheet>`. No fragments |
| Registry components only | Capitalised names from §5. No `<div>`, `<span>`, or any HTML tag |
| Props are JSON literals | Strings, numbers, booleans, `null`, arrays, objects. `{-1}` is allowed |
| No expressions | No arithmetic, no template strings, no identifiers, no function calls, no spreads |
| No handlers | There is no `onClick`. Side effects are `action` props (§8) |
| Children | Elements, text, or a `{literal}` that renders as text |

For layout, `<Box>` is the div and `<Span>` is the span. Everything else carries meaning.

---

## 3. The Sheet element

| Prop | Type | Notes |
|---|---|---|
| `title` | string, 1–200 | Required. Shown in the sidebar, tabs, breadcrumb |
| `icon` | string, ≤16 | Optional emoji |
| `tags` | string[], ≤32 | Optional |
| `class` | string | The page's entire appearance (§4) |
| `theme` | object | Optional palette seed (§9) |
| `state` | object | Declared state keys (§6) |

**The Sheet owns the page.** App chrome draws nothing around it — no card, no margin, no background,
no width. A page that sets no `class` renders as unstyled HTML on the app's background. Give it at
minimum a background, text colour, min-height and padding:

```jsx
<Sheet title="…" class="min-h-full bg-background px-8 py-12 text-foreground @md:px-16">
```

Centre a reading column with an inner `<Box class="mx-auto max-w-2xl">`.

---

## 4. Styling contract

**Every component takes `class`** (the one exception is `<Show>`, which is logic). The full Tailwind
vocabulary is available — arbitrary values, gradients, shadows, transforms, `hover:`/`group-hover:`
variants, and arbitrary child selectors.

**The class always wins.** Component defaults and the page's class are merged so exactly one utility
survives per property, and it is the page's. `<H1 class="mt-0">` beats any built-in margin.

### Components ship no cosmetics

`<H1>` is a bare `h1`. `<Card>` is an empty `div`. `<Stat>` is three stacked `div`s with no type,
colour, spacing or border. Components carry **structure and behaviour only** — the parts a page
cannot express on its own. Anything visual is the page's job.

### Styling a component's internals

Because components are bare, style their parts with child selectors:

```jsx
<Stat value="21" label="story points" hint="sum(points)"
  class="rounded-2xl border border-white/10 p-5
         [&>div:first-child]:text-4xl [&>div:first-child]:font-bold
         [&>div:nth-child(2)]:text-xs [&>div:nth-child(2)]:uppercase
         [&>div:last-child]:font-mono [&>div:last-child]:text-[10px]" />
```

§5 lists what each component renders so these selectors are predictable.

### Two bans

| Banned | Why |
|---|---|
| `url()`, `image-set()`, `@import` | Styling must never become a network capability |
| `sm:` `md:` `lg:` `xl:` `2xl:` | A page renders in a tab, in a 400px agent panel, and on small screens — two of those are not the window |

**Use container queries instead.** `<Sheet>` is a container, so `@sm:` `@md:` `@lg:` measure the
page itself. Prefer layouts that reflow (`flex-wrap`, `grid` with `auto-fit`, `min-w-*` + `basis-*`)
over fixed widths.

---

## 5. Component reference

`children` is **none** (self-closing), **text** (text only), or **nodes** (elements and text).
All components accept `class`.

### Layout

| Component | Props | Children | Renders |
|---|---|---|---|
| `Box` | — | nodes | `div` |
| `Span` | — | nodes | `span` |
| `Columns` | — | nodes | `div` — flex, wraps |
| `Column` | — | nodes | `div` — flex-1, `basis-64`, wraps under narrow containers |
| `Divider` | — | none | `hr` |

### Typography

| Component | Props | Children | Renders |
|---|---|---|---|
| `H1` `H2` `H3` | — | nodes | `h1`/`h2`/`h3` — inline `Span` allowed for accenting a word |
| `P` | — | nodes | `p` |
| `Quote` | — | nodes | `blockquote` |
| `Code` | `lang?` | text | `pre > code`, wraps, scrolls |
| `Tag` | — | text | `span` |
| `Kbd` | — | text | `kbd` |

### Display

| Component | Props | Children | Renders |
|---|---|---|---|
| `Hero` | `title`, `subtitle?`, `align?` `left\|center`, `size?` `md\|lg` | none | `header > h1 + p` |
| `Stat` | `value`, `label`, `hint?` | none | `div > div(value) + div(label) + div(hint)` |
| `Card` | `title?`, `accent?` | nodes | `div > [accent bar] + div(title) + children` |
| `Timeline` | — | nodes | `ol` |
| `Step` | `marker`, `title?`, `color?` | nodes | `li` — grid `[3rem 1fr]`, `span(marker)` + `div > div(title) + div(body)` |
| `Callout` | `tone?` `info\|warning\|success\|danger` | nodes | `div` with a bordered tone default |
| `Badge` | `tone?` `default\|outline\|muted\|destructive` | text | `span` |
| `Avatar` | `label` | none | `span` with derived initials |
| `Progress` | `value`, `max?` | none | `div > div(fill)` |
| `Skeleton` | — | none | `div`, pulsing |
| `Img` | `src` (https only), `alt?` | none | `img` |

### Washi kit

Signature pieces. Opt-in, not the house style.

| Component | Props | Children | Renders |
|---|---|---|---|
| `Tape` | `color?` | text | `span` — torn-tape clip-path, striped |
| `Stamp` | `label` (≤8), `tone?` `accent\|ink` | none | `span` — round, bordered, rotated |
| `Chip` | `color?` | text | `span > span(dot) + children` |

`color` is one of `pink teal blue mustard violet moss slate`; omitted, they use the sheet accent.

### Interactive

| Component | Props | Children | Renders |
|---|---|---|---|
| `Button` | `action` (§8) | text | `button` |
| `Ref` | `sheet` (id) | text | `button` that opens another page |
| `Toggle` | `label` | nodes | `details > summary + div` |
| `Accordion` | — | nodes | `div` |
| `AccordionItem` | `title` | nodes | `details.group > summary + div` |
| `Dialog` | `trigger`, `title?` | nodes | `button` + native `dialog` |
| `Tooltip` | `label` | nodes | `span.group` + `span[role=tooltip]`, shown on hover |
| `Fetch` | `url` (https only), `as?` `text\|json` | none | `div > div(url) + body`; async, caches last good |

### Data-bound

| Component | Props | Children | Renders |
|---|---|---|---|
| `Table` | `bind` (§7), `columns?` | none | `div > table > thead/tbody` |
| `Board` | `bind`, `groupBy` | none | `div` flex row; per group `div > div(header) + div(card)…` |
| `TaskList` | `bind?` | nodes | `div` + a `Task` per row |
| `Task` | `done?`, `record?` | text | `label > input[checkbox] + span`; writes back when `record` is set |

### Logic

| Component | Props | Children | Notes |
|---|---|---|---|
| `Show` | `when`, `equals?`, `not?` | nodes | **No `class`** — renders children or nothing |
| `Switch` | `state`, `label?` | none | Writes a boolean |
| `Slider` | `state`, `min?`, `max?`, `step?`, `label?` | none | Writes a number |
| `Tabs` | `labels` (1–12), `state?` | nodes | Buttons carry `data-active`; one `Tab` child per label |
| `Tab` | — | nodes | One panel |

---

## 6. Interactivity is state, not code

Declare keys on `<Sheet state={…}>`, write them with controls, read them with `<Show>`.

```jsx
<Sheet title="Kit" state={{ view: 'controls', details: false, budget: 40 }} class="…">
  <Switch state="details" label="Show the fine print" />
  <Show when="details">
    <Callout class="…">Appears because a switch flipped a key.</Callout>
  </Show>

  <Tabs labels={['controls', 'preview']} state="view" class="…">
    <Tab>…</Tab>
    <Tab>…</Tab>
  </Tabs>

  <Show when="view" equals="preview">…</Show>
</Sheet>
```

Values are scalars only — string, number, boolean, `null`. `<Show>` compares with `equals` (default
`true`) and can invert with `not`. There is **no** arithmetic, no derived values, no formulas.

State is per-render and resets when the page is reopened.

---

## 7. Live data — `bind`

`bind` is a query descriptor against an agent-defined table. Same grammar everywhere.

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
| `table` | Required. snake_case table name |
| `where` | ≤16 filters, ANDed. `op`: `eq ne gt gte lt lte contains in` |
| `orderBy` | `{ column, direction: 'asc' \| 'desc' }` |
| `limit` | 1–1000, default 200 |
| `groupBy` | `{ column, aggregates: [{ fn, column? }] }` — `fn`: `count sum avg min max` |

Every column named must exist on the table. Column types are `text number boolean date select`.

**Today a bind reads once per render.** Live updating is planned; design for a page that can
announce it is bound and that it refreshed.

---

## 8. Actions

The only side-effect channel. A closed verb registry, validated server-side.

| Verb | Shape | Consent |
|---|---|---|
| `sheet.open` | `{ verb, sheet }` | Click is consent |
| `sheet.create` | `{ verb, title }` | Click is consent |
| `table.insert` | `{ verb, table, data }` | Click is consent |
| `url.open` | `{ verb, url }` (https) | **Leaves the machine — needs an explicit stamp** |

```jsx
<Button action={{ verb: 'table.insert', table: 'tasks', data: { title: 'New task', status: 'todo' } }}>
  Add task
</Button>
```

Reversible, in-vault verbs run on click. Anything that leaves the machine is refused from a page
until it is confirmed — that confirmation UI is unbuilt, so today `url.open` from a page is denied.
Every action, allowed or refused, is recorded.

---

## 9. Themes

`theme` seeds a token palette. It **never lays anything out**.

```jsx
<Sheet theme={{ preset: 'midnight', accent: 'violet' }} class="…">
```

| Field | Values |
|---|---|
| `preset` | `washi midnight broadsheet sticker terminal blueprint` |
| `accent` | a tape colour — drives `Tape`/`Stamp`/`Chip`/`Card` accents |
| `face` | `gothic serif rounded mono` |
| `paper` | `plain dots lines` |

With a preset set, `bg-card`, `text-muted-foreground` and `border-border` resolve to that palette.
Omit `theme` entirely and nothing is applied — the page is bare.

---

## 10. Validation

Pages are validated before saving and before rendering. Errors name the element path and the prop:

```
prop class: class contains forbidden tokens: md:flex — sheets size to their
container (@sm:, @md:), never the viewport
Sheet > Box > Table
```

Common failures: an unknown component, an unknown prop (schemas are strict), an expression in a
prop, a `bind` naming a column that does not exist, `sm:`/`md:` in a class, `url()` in a class,
a non-https `Img`/`Fetch` URL, or the wrong children kind (text inside a `none`, elements inside a
`text`).

---

## 11. What WSX cannot express

Do not design around these; they are constraints, not gaps to fill.

- **Custom components.** New capability is a new registry component, designed and built
- **Scripts, handlers, formulas, computed values.** State is stored and compared, never derived
- **Local images or file attachments.** `Img` is https-only and there is no asset story yet
- **Free-form text editing inside a page.** Pages are authored by asking, not typing
- **Viewport-relative layout.** Container queries only
