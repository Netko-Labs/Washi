# Washi — feature scope

> **Superseded in part by `docs/washi.html` (2026-10-14).** §1, §2 and §5 no longer hold: people and
> the agent both write, pages share a house style, co-editing is live. The surface lists still stand.

A design brief: every feature Washi should and will have, described as capability rather than
construction. Architecture lives in `docs/spec.html`; nothing here should require reading it.

---

## 1. What Washi is

A local-first knowledge base where **the primary author is an agent**. You direct, it writes. Pages
are composed the way a designer composes a screen — layout, type, colour, live data — not typed as
markdown.

The product bet, stated so it can be designed against:

> **Edit by asking.** There is no cursor in a page. If a screen's answer to "how do I change this?"
> is "type here", it is fighting the product.

---

## 2. Design rules

Non-negotiable. A design that breaks one of these cannot ship.

- **Pages have no house style.** Every page is a blank canvas the agent designs. Two pages in the
  same vault may be a neon poster and a broadsheet essay. App chrome must never look like it is
  framing a document, and must never impose margin, width or background on a page.
- **Review is the primary human verb.** Approving, rejecting, and auditing what the agent did is the
  main loop. Design for reviewing, not for authoring.
- **Pages are inert.** A page can hold declared state — switches, sliders, tabs, conditional
  sections — and can trigger a fixed set of safe actions. It cannot hold custom logic, formulas, or
  anything that runs.
- **The page vocabulary is closed.** Agents compose from a fixed component set. A new page capability
  means a new component, designed and specified — there is no escape hatch.
- **Pages size to their container, not the window.** The same page renders in a full tab, in a 400px
  agent panel, and eventually on a phone. Never spec a page layout against screen size.
- **Local by default.** No account, no cloud, no network unless explicitly allowed per site.
- **Nothing on screen may be invented.** In a product whose promise is "see what the agent did",
  placeholder history is a broken promise. Empty states are the honest default and need real design.

---

## 3. Surfaces

### Sidebar
Navigation and vault identity.

- Vault switcher with create / rename / switch
- Nav: Dashboard · Inbox (with pending count) · Daily note
- Page tree with folders, nesting, drag to reorder
- New page
- Sync status: local-only, syncing, offline, conflict, error
- Account row

### Tab strip
Browser-style tabs for pages and views.

- Close, reorder, pin
- Overflow behaviour at many tabs
- Restore tabs across restarts

### Page canvas
The core screen: one agent-composed page, edge to edge, no chrome.

- **Authorship**: show whether a page — or a section — was written by you or by the agent, without
  framing the page
- **Live data**: a page bound to a table must be able to say it is live, and show when it updates
- **Fetched content**: show freshness, cached-last-good, and failure
- **Repair state** for a page that can no longer render
- Per-page history and restore
- Backlinks

### Agent panel
A popover from the mascot (⌘J), expandable to centre.

- Transcript: messages, tool activity, page diffs
- **Cancel a running turn**
- Permission prompts inline
- Conversation switcher and history
- Model picker
- Cost and context usage
- Attachments
- Suggested starting prompts

### Dashboard
The "what happened while I was away" screen.

- Greeting and real activity summary
- Vault stats
- What needs review, with a route into reviewing it
- Recent pages
- Agent activity timeline
- **Empty and near-empty states** — a one-page vault is the common first experience

### Inbox
Everything the agent wants a decision on, in one queue. The most important unbuilt surface.

- Queue grouped by kind: suggested edits, drafts, flagged issues, scheduled run results
- Diff review — accept, reject, ask for changes
- Bulk actions
- Audit view of what was already approved or denied, and by whom
- Empty state that is a reward, not a placeholder

### Daily note
A page for today that the agent maintains.

- Today's page, with navigation to previous days
- Agent-proposed additions you approve rather than type
- Continuity across days
- Resolve the current contradiction: it must not offer a typing affordance

### Settings
- **Agent autonomy**: what the agent may do unattended, per capability, scoped to a session or the
  whole vault — a model a person can reason about without reading a spec
- Allowed sites for fetching
- Appearance: light / dark / system
- Scheduled agent runs
- Account and identity
- Vault management, export, erase

### Onboarding
First run. Must explain the two things that matter: **the agent writes your pages**, and **what it
is allowed to touch**.

- Local-first promise
- Vault creation
- Agent consent and initial autonomy level
- Identity: name, accent
- A first page that demonstrates what a designed page looks like

### Command palette
⌘K over everything.

- Pages, views, actions, and agent commands in one surface
- Full-text search across pages and structured records
- Recent and suggested entries

### Mascot
The product's warmth and its status indicator.

- States: idle, thinking, writing, waiting on you, error
- Presence in empty states, the panel header, and the review loop
- Should reassure during approval, which is where it matters most

---

## 4. Coming later

### Structured data
Agent-defined tables that pages read from and write to.

- Table and record views, presented as pages rather than app chrome
- Filters, sorting, grouping, aggregate summaries
- A page control — a tab or switch — that filters a live table on the page
- Adding and editing records from inside a page

### External agents
Support for agents other than the built-in one.

- Choose a provider per conversation
- Show which agent is speaking

### Sync and multi-device
Self-hosted, opt-in.

- Device list and pairing
- Sync state and conflict surfacing
- Account creation and recovery
- Sharing a vault or a page

---

## 5. Out of scope

Do not design these. They are cut, not backlogged.

- **Inline and block editing, rich-text toolbars, slash menus.** The bet is edit-by-asking
- **Formulas or scripting inside pages.** Capability grows by adding components
- **Graph view.** Backlinks stay a list
- **Mobile.** Parked, though pages stay fluid so the door stays open

**Unresolved:** page cover images and file attachments are wanted, but there is no story yet for
where a local file lives. Needs a design and a decision before either can be specified.

---

## 6. Open design questions

1. **What does a page look like when nobody designed it?** The new-page state is the most-seen page
   in the product and currently does the least work.
2. **How is agent authorship shown on a page that has no chrome?**
3. **What is the single review model?** Inbox, dashboard queue, and in-page diffs are three doors
   into one job.
4. **How does a page say it is alive** — bound, updating, cached, or stale?
5. **What does agent autonomy look like as a control** a person can set confidently?
6. **What are the empty states** for a vault with one page and no history?
