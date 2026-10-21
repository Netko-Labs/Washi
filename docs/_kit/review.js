// The review store every design page shares: a verdict (ok · fix) and a note per frame, kept by
// docs/serve.ts in tasks/design-review.jsonl, or in localStorage on any other static server.
// Exposed as `washi.review` for canvas.js (review mode) and tour.js (walk mode).

;(() => {
  const page = location.pathname
    .split('/')
    .pop()
    .replace(/\.html$/, '')
  const Key = `washi:review:${page}`
  const subs = new Set()
  let notes = []

  const emit = () => {
    for (const fn of subs) fn(notes)
  }
  const load = async () => {
    try {
      const r = await fetch('/_review')
      if (r.ok) {
        notes = (await r.json()).filter((n) => n.page === page)
        emit()
        return
      }
    } catch {}
    notes = JSON.parse(localStorage.getItem(Key) || '[]')
    emit()
  }
  const persist = async (note) => {
    const row = { page, ...note }
    notes.push(row)
    try {
      const r = await fetch('/_review', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(row),
      })
      if (!r.ok) throw new Error(r.statusText)
    } catch {
      localStorage.setItem(Key, JSON.stringify(notes))
    }
    emit()
  }
  const latest = (frame) => {
    const own = notes.filter((n) => n.frame === frame)
    const verdict = [...own].reverse().find((n) => n.verdict)?.verdict ?? null
    return { own, verdict }
  }
  const subscribe = (fn) => {
    subs.add(fn)
    return () => subs.delete(fn)
  }

  window.washi = Object.assign(window.washi || {}, {
    review: { page, load, persist, latest, subscribe },
  })
})()
