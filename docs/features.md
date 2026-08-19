# Washi — feature scope

A design brief. `docs/spec.html` is the canonical architecture spec; this file is the surface
inventory a designer needs: what exists, what is a lie, what is coming, and the constraints that
cannot be designed around.

Last audited against the running app: **2026-08-19**.

---

## 1. What Washi is

A local-first knowledge base where **the primary author is an agent**. You direct, it writes. Notes
are not markdown — they are **WSX**, JSX-shaped data rendered by a closed component registry, so an
agent can compose a page the way a developer composes a React screen, and nothing it writes can
execute.

The product bet, stated so it can be designed against:

> **Edit by asking.** Human inline editing is cut, not deferred. If a screen's answer to "how do I
> change this?" is a cursor, the design is fighting the product.

Three consequences a designer should hold onto:

- **Pages have no house style.** Each sheet is a blank canvas the agent designs. The app chrome must
  never look like it is framing a document, because two different sheets may be a neon brutalist
  poster and a broadsheet essay.
- **Review is the primary human verb.** Approving, rejecting and auditing what the agent did is the
  main interaction loop — not typing.
- **Everything is local.** No account, no cloud, no network by default. Sync is later and
  self-hosted.

---

## 2. Non-negotiable constraints

These come from the trust model and the architecture. Designs that violate them cannot be built.

| Constraint | Why | Design impact |
|---|---|---|
| Sheets are inert data | A hallucinating or prompt-injected agent must never produce executable content | No custom JS in a page, no handlers, no formulas. Interactivity is declarative state + a closed verb registry |
| Closed component registry | The only vocabulary an agent may use | New page capability = a new component, designed and specified. There is no escape hatch |
| **Container queries only** | A sheet renders in a tab, a 400px agent panel, and eventually a phone — two of those are not the window | Never spec a page layout in viewport breakpoints. Think component, not page |
| No `url()` in styles | Styling must never become a network capability | No remote background images in sheets. Local asset story is still owed |
| Capabilities are gated | Data, network and side effects go through ink / tsuru / hanko | Any "just do it" button that leaves the machine needs a consent design |
| Blank canvas | Components ship zero cosmetics; the sheet styles everything | An unstyled page looks like unstyled HTML. Scaffolds and templates are product surfaces, not filler |

---

## 3. Surface inventory

Status legend: **live** = wired to real data · **faked** = static design copy, looks real, is not ·
**planned** = not built.

### 3.1 Sidebar — live
Vault switcher, nav (Dashboard · Inbox · Daily note), page tree, New page, sync row, user row.

- Page tree is flat. **Folders/grouping are planned** and unspecified.
- Sync row reads "Local · this device only" — honest today, needs states for syncing/offline/error
  once M5 lands.
- Vault switcher is **UI over nothing** — one vault exists; per-vault databases are M3.

### 3.2 Tab strip — live
Browser-style tabs for sheets and views. No overflow design, no reordering, no pinning.

### 3.3 Sheet canvas — live, newly rebuilt
A bare scrolling surface. No tape, no card, no byline, no width. The sheet owns everything.

- **This is the product's core screen and it is the one with the least design.** What does a
  well-made Washi page look like at 5 pages? At 500?
- Needs: how authorship is shown without chrome, how a stale/invalid page surfaces a repair state,
  how a page announces it is bound to live data.

### 3.4 Agent panel — live
Mascot FAB (⌘J) opens a 400px popover: transcript, tool cards, WSX diffs, permission prompts,
conversation switcher, expand-to-centre.

- **No cancel button.** A running turn cannot be interrupted. Highest-value missing control.
- Model picker is decorative — it says "Sonnet 4.5" and does nothing.
- No context/cost meter, though cost is tracked per session.

### 3.5 Dashboard — **faked**
Greeting, four stat tiles, review queue, recent pages, agent activity.

Everything except *Recent pages* is invented. In a vault with 2 pages and 1 agent session it claims
7 edits across 3 pages, 4 awaiting review, 31% written by agents, a 12-day streak, and a review
queue of three pages that do not exist.

Needs a real design once the capability ledger backs it — including **empty and near-empty states**,
which is what a real vault looks like on day one.

### 3.6 Inbox — **faked**
Contradicts itself in one viewport: "Inbox zero — Washi has nothing waiting on you" sits directly
above four items.

This is the **most important unbuilt surface**. Review is the primary human verb, the capability
ledger now records every agent and sheet action, and approvals are already persisted. Needs:
queue grouping, a diff review flow, bulk accept/reject, and an audit view of what was already
stamped.

### 3.7 Daily note — **faked**
Date is real. The streak, the diary prose, and the "pull in yesterday's action items" card are not.
`What else happened today...` looks like a text input but nothing can be typed — a direct collision
with "editing is cut". Needs rethinking as a page the agent maintains and you approve.

### 3.8 Settings — partial
Four tabs. **Agent autonomy is the design-heavy one**: the persisted policy store (per tool, per
verb, per host, scoped to session or vault) is planned and needs a model a human can reason about.
Also owed: tsuru host allowlist management, dark-mode toggle (tokens ship, no control), scheduled
runs.

### 3.9 Onboarding — live
Five steps including identity (name/email/accent). Does not yet explain the two things that
actually matter: that the agent writes your pages, and what it is allowed to touch.

### 3.10 Command palette — live
⌘K over sheets. Search is title+body FTS; **records are not indexed**.

### 3.11 Mascot — live
Shared SVG rig, state faces, app icon. Carries most of the product's warmth. Underused: it appears
in empty states and the FAB but has no role in the review loop, which is where reassurance matters
most.

---

## 4. Feature scope, by milestone

### Shipped
- Sheets core: Loro-backed store, WSX parse/validate/serialize, FTS search, oplog, HLC stamps
- Paper registry: ~35 components, declarative sheet state, opt-in theme presets
- Embedded Claude agent host: in-process tools, approvals flow, resumable sessions
- Capability packages: ink (typed data DSL), tsuru (scoped fetch), hanko (safe verbs)
- Blank canvas: primitives carry no cosmetics, `class` always wins, container-query-only
- Capability ledger: every sheet and agent action recorded
- Develop menu: reset onboarding, clear history, erase vault, reseed showcase

### Next — hardening (M2.5)
- **Live binds.** Data changes emit no events today, so an open page goes stale when the agent
  rewrites it. Design impact: pages need a "just changed" affordance
- Atomic writes + a replayable oplog
- Loro as a real CRDT (stable peer id, update log, delta export)
- Persisted approval policies → the Settings autonomy surface
- Turn cancel, records in FTS, dark-mode toggle, tsuru allowlist UI

### M3 — structured data
- **Tables/records UI, generated as WSX** rather than app chrome — the table view is a sheet the app
  writes, so it inherits the same design system as everything else
- Live `bind` views with aggregations surfaced
- **`$state` binds**: a tab or switch filters a live table with no expression language
- `Fetch` component end-to-end, with a policy prompt design
- Per-vault databases → the vault switcher becomes real

### M4 — external agents
ACP over stdio (Gemini, Codex). The transcript UI already speaks ACP vocabulary. Design impact: an
agent identity/provider concept in the panel.

### M5 — sync
Self-hosted Bun/Elysia relay. Design impact: sync states, device list, conflict surfacing, and an
account concept that does not exist anywhere today.

---

## 5. Deliberately out of scope

Do not design these; they are cut, not backlogged.

- **Inline/block editing and a rich text editor.** The bet is edit-by-asking
- **Expression language / formulas in pages.** Power grows by adding components
- **Graph view.** Backlinks stay a list
- **Mobile.** Parked — but sheets stay fluid and container-query-shaped so the door stays open

Still owed and unresolved: **an asset story**. Cover images and file drop survived the cut, but
`Img` is https-only and there is nowhere for a local file to live.

---

## 6. Open design questions

1. **What does a Washi page look like when nobody designed it?** The scaffold is the most-seen page
   in the product and currently does the least work.
2. **How is agent authorship shown now that pages have no chrome?** The byline was deleted with the
   card it lived in.
3. **What is the review loop?** Inbox, dashboard queue, and in-page diffs are three entry points to
   one job with no shared model.
4. **How does a page say it is alive?** Bound tables, cached fetches and stale content all need a
   vocabulary.
5. **What does agent autonomy look like as a control** a person can set without reading the spec?
6. **What are empty states across the app** for a vault with one page and no history?
