// Walk mode: the design page as a slideshow. One frame per slide, its pins as beats — the view glides
// to each pin while the card tells what it is (the frame's own note, split at the pin numbers) — and
// the last beat of every frame asks for the verdict review mode keeps (docs/_kit/review.js).
// W or the bar button starts it, → ← walk, click the frame for the next beat, Esc leaves,
// `#walk=<slug>` opens the page walking that frame.
// conventions: >300 lines — one slideshow state machine; split when next touched

const CARD = 420
const EDGE = 64
const DETAIL = { w: 760, h: 480, k: 1.4 }
const SECONDS_PER_BEAT = 7

const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

// A frame's note names its pins inline — "… 1 the ask field … 2 no tab strip …" or "<b>1</b> …" —
// so the text between pin k and pin k+1 is pin k's caption; what comes before 1 is the frame's.
function splitNote(html, pins) {
  const parts = []
  let pos = 0
  for (let k = 1; k <= pins; k++) {
    const re = new RegExp(`(?:<b>)?(?<![\\w/.,-])${k}(?:</b>)?(?=\\s)`, 'g')
    re.lastIndex = pos
    const m = re.exec(html)
    if (!m) break
    parts.push(html.slice(pos, m.index))
    pos = m.index + m[0].length
  }
  parts.push(html.slice(pos))
  while (parts.length < pins + 1) parts.push('')
  return parts.map((p) => p.replace(/^[\s.;:—–-]+/, '').trim())
}

function buildBeats(world, intro, page) {
  const beats = [{ kind: 'cover', title: page, html: intro }]
  for (const group of world.querySelectorAll('.cv-group')) {
    const frames = [...group.querySelectorAll(':scope > .frame')]
    if (!frames.length) continue
    beats.push({
      kind: 'group',
      group,
      frames,
      title: group.dataset.name,
      html: group.dataset.note ?? '',
    })
    for (const frame of frames) {
      const pins = [...frame.querySelectorAll('.pin')].sort(
        (a, b) => Number(a.textContent) - Number(b.textContent),
      )
      const parts = splitNote(frame.querySelector(':scope > .fnote')?.innerHTML ?? '', pins.length)
      const title = frame.dataset.name
      const unnumbered = pins.length > 0 && parts.slice(1).every((p) => !p)
      beats.push({ kind: 'frame', frame, pins, title, html: parts[0] })
      pins.forEach((pin, i) => {
        const html = unnumbered ? parts[0] : parts[i + 1]
        beats.push({ kind: 'pin', frame, pins, pin, n: i + 1, title, html })
      })
      beats.push({ kind: 'verdict', frame, pins, title })
    }
  }
  return beats
}

const CARD_HTML = `
  <div class="tr-top"><span class="tr-eyebrow"></span><span class="tr-pos"></span></div>
  <div class="tr-dots"></div>
  <div class="tr-body"><div class="tr-num"></div><h2 class="tr-title"></h2><div class="tr-text"></div></div>
  <div class="tr-verdict">
    <button data-v="ok" title="Y">✓ Looks right</button><button data-v="fix" title="N">✎ Needs work</button>
    <span class="tr-state"></span>
  </div>
  <textarea class="tr-note" placeholder="What should change — ⌘↩ saves and moves on."></textarea>
  <div class="tr-nav"><button class="tr-prev">← Back</button><span class="tr-hint"><kbd>→</kbd> next · <kbd>Y</kbd> ok · <kbd>N</kbd> note · <kbd>esc</kbd> leave</span><button class="tr-next">Next →</button></div>`

function initTour() {
  const canvas = window.washi?.canvas
  const review = window.washi?.review
  const bar = document.querySelector('.cv-bar')
  if (!canvas || !review || !bar) return
  const { viewport, world, state, apply } = canvas
  const beats = buildBeats(
    world,
    document.querySelector('.cv-layers')?.dataset.intro ?? '',
    review.page,
  )
  const frameBeats = beats.filter((b) => b.kind === 'frame')
  let at = -1
  let glideTimer = 0

  const button = document.createElement('button')
  button.className = 'rv-toggle'
  button.textContent = 'Walk'
  bar.insertBefore(button, bar.querySelector('.rv-toggle'))

  const card = document.createElement('aside')
  card.className = 'tr-card'
  card.innerHTML = CARD_HTML
  const progress = document.createElement('div')
  progress.className = 'tr-progress'
  progress.innerHTML = '<i></i>'
  document.body.append(card, progress)
  const el = (sel) => card.querySelector(sel)
  const note = el('.tr-note')

  const rectOf = (frame) => {
    const group = frame.parentElement
    const inGroup = group.classList.contains('cv-group')
    return {
      x: frame.offsetLeft + (inGroup ? group.offsetLeft : 0),
      y: frame.offsetTop + (inGroup ? group.offsetTop : 0),
      w: frame.offsetWidth,
      h: frame.offsetHeight,
    }
  }
  const pinPoint = (frame, pin) => {
    const f = frame.getBoundingClientRect()
    const p = pin.getBoundingClientRect()
    const r = rectOf(frame)
    return {
      x: r.x + (p.left - f.left + p.width / 2) / state.k,
      y: r.y + (p.top - f.top + p.height / 2) / state.k,
    }
  }
  const glide = (fn) => {
    world.classList.add('glide')
    fn()
    clearTimeout(glideTimer)
    glideTimer = setTimeout(() => world.classList.remove('glide'), 900)
  }
  const fitIn = (r, cap = 4) => {
    const vw = viewport.clientWidth
    const vh = viewport.clientHeight
    const area = { x: EDGE, y: EDGE, w: vw - CARD - EDGE * 2 - 24, h: vh - EDGE * 2 }
    const k = Math.min(cap, area.w / r.w, area.h / r.h)
    state.k = k
    state.x = area.x + (area.w - r.w * k) / 2 - r.x * k
    state.y = area.y + (area.h - r.h * k) / 2 - r.y * k
    apply()
  }
  const detailRect = (frame, pin) => {
    const f = rectOf(frame)
    const c = pinPoint(frame, pin)
    const w = Math.min(DETAIL.w, f.w)
    const h = Math.min(DETAIL.h, f.h)
    return {
      x: Math.min(Math.max(c.x - w / 2, f.x), f.x + f.w - w),
      y: Math.min(Math.max(c.y - h / 2, f.y), f.y + f.h - h),
      w,
      h,
    }
  }
  const union = (frames) => {
    const rs = frames.map(rectOf)
    const x = Math.min(...rs.map((r) => r.x))
    const y = Math.min(...rs.map((r) => r.y))
    return {
      x,
      y,
      w: Math.max(...rs.map((r) => r.x + r.w)) - x,
      h: Math.max(...rs.map((r) => r.y + r.h)) - y,
    }
  }

  const move = (beat) => {
    if (beat.kind === 'cover') fitIn(union([...world.querySelectorAll('.frame')]))
    else if (beat.kind === 'group') fitIn(union(beat.frames))
    else if (beat.kind === 'pin') fitIn(detailRect(beat.frame, beat.pin), DETAIL.k)
    else fitIn(rectOf(beat.frame), 1)
  }

  const paintFrames = (beat) => {
    const lit = new Set(
      beat.kind === 'cover'
        ? world.querySelectorAll('.frame')
        : beat.kind === 'group'
          ? beat.frames
          : [beat.frame],
    )
    for (const f of world.querySelectorAll('.frame')) f.classList.toggle('tr-on', lit.has(f))
    for (const p of world.querySelectorAll('.pin')) p.classList.remove('seen', 'now')
    if (!beat.pins) return
    const upto = beat.kind === 'pin' ? beat.n : beat.kind === 'verdict' ? beat.pins.length : 0
    beat.pins.forEach((p, i) => {
      if (i + 1 < upto || beat.kind === 'verdict') p.classList.add('seen')
      if (beat.kind === 'pin' && i + 1 === upto) p.classList.add('now')
    })
  }

  const paintCard = (beat) => {
    const fi = frameBeats.findIndex((b) => b.frame === beat.frame)
    const own = beat.frame ? beats.filter((b) => b.frame === beat.frame) : []
    const stepIndex = own.indexOf(beat)
    const eyebrow = { cover: 'design walk', group: 'group', verdict: 'your call' }
    el('.tr-eyebrow').textContent = eyebrow[beat.kind] ?? beat.frame.parentElement.dataset.name
    el('.tr-pos').textContent = beat.frame
      ? `frame ${fi + 1} / ${frameBeats.length}${beat.kind === 'pin' ? ` · ${beat.n} / ${beat.pins.length}` : ''}`
      : `${frameBeats.length} frames · ~${Math.ceil((beats.length * SECONDS_PER_BEAT) / 60)} min`
    el('.tr-dots').innerHTML = own
      .map((_, i) => `<i class="${i === stepIndex ? 'on' : i < stepIndex ? 'done' : ''}"></i>`)
      .join('')
    const num = el('.tr-num')
    num.textContent = beat.kind === 'pin' ? String(beat.n) : ''
    num.classList.toggle('show', beat.kind === 'pin')
    el('.tr-title').textContent = beat.kind === 'verdict' ? `${beat.title} — your call` : beat.title
    el('.tr-title').classList.toggle('sm', beat.kind === 'pin')
    const text = el('.tr-text')
    if (beat.kind === 'verdict')
      text.innerHTML =
        'Every pin in this frame walked. <b>✓</b> if it reads right, <b>✎</b> with a note if something should change — <kbd>→</kbd> moves on without a verdict.'
    else if (beat.kind === 'frame' && !beat.html)
      text.innerHTML = beat.pins.length
        ? `${beat.pins.length} detail${beat.pins.length > 1 ? 's' : ''} to walk.`
        : 'One look, then your call.'
    else if (beat.kind === 'cover')
      text.innerHTML = `${beat.html}<p class="tr-how">Each frame walks pin by pin. At the end of a frame, mark it: notes land in <code>tasks/design-review.jsonl</code> and turn into polish PRs.</p>`
    else text.innerHTML = beat.html
    const verdictRow = el('.tr-verdict')
    verdictRow.classList.toggle('show', Boolean(beat.frame))
    verdictRow.classList.toggle('ask', beat.kind === 'verdict')
    paintVerdict(beat)
    note.classList.remove('show')
    note.value = ''
    el('.tr-next').textContent =
      beat.kind === 'cover' ? 'Start →' : at === beats.length - 1 ? 'Done' : 'Next →'
    el('.tr-prev').disabled = at === 0
    const body = el('.tr-body')
    body.classList.remove('in')
    void body.offsetWidth
    body.classList.add('in')
    progress.firstElementChild.style.width = `${((at + 1) / beats.length) * 100}%`
  }

  const paintVerdict = (beat = beats[at]) => {
    if (!beat?.frame) return
    const { own, verdict } = review.latest(beat.frame.dataset.name)
    el('[data-v="ok"]').classList.toggle('on', verdict === 'ok')
    el('[data-v="fix"]').classList.toggle('on', verdict === 'fix')
    const texts = own.filter((n) => n.note).length
    el('.tr-state').textContent = verdict
      ? `${verdict === 'ok' ? 'marked ok' : 'needs work'}${texts ? ` · ${texts} note${texts > 1 ? 's' : ''}` : ''}`
      : ''
  }

  const go = (i, animate = true) => {
    at = Math.max(0, Math.min(beats.length - 1, i))
    const beat = beats[at]
    if (beat.frame) canvas.select(beat.frame)
    paintFrames(beat)
    paintCard(beat)
    if (animate) glide(() => move(beat))
    else move(beat)
    if (beat.frame) history.replaceState(null, '', `#walk=${beat.frame.id.replace(/^frame-/, '')}`)
  }
  const next = () => (at >= beats.length - 1 ? leave() : go(at + 1))
  const prev = () => go(at - 1)

  const start = (frame) => {
    document.body.classList.add('touring')
    document.body.classList.remove('reviewing')
    const i = frame ? beats.findIndex((b) => b.kind === 'frame' && b.frame === frame) : 0
    requestAnimationFrame(() => go(Math.max(0, i), false))
  }
  const leave = () => {
    const beat = beats[at]
    document.body.classList.remove('touring')
    world.classList.remove('glide')
    for (const f of world.querySelectorAll('.frame')) f.classList.remove('tr-on')
    for (const p of world.querySelectorAll('.pin')) p.classList.remove('seen', 'now')
    note.classList.remove('show')
    requestAnimationFrame(() => {
      if (beat?.frame) canvas.focus(beat.frame)
      else canvas.fitAll()
    })
  }
  const touring = () => document.body.classList.contains('touring')

  const mark = async (verdict) => {
    const beat = beats[at]
    if (!beat?.frame) return
    if (verdict === 'fix' && !note.classList.contains('show')) {
      note.classList.add('show')
      note.focus()
      return
    }
    const text = note.value.trim()
    note.classList.remove('show')
    await review.persist({ frame: beat.frame.dataset.name, verdict, note: text })
    paintVerdict()
    setTimeout(next, 260)
  }

  button.addEventListener('click', () => (touring() ? leave() : start()))
  el('.tr-next').addEventListener('click', next)
  el('.tr-prev').addEventListener('click', prev)
  el('.tr-verdict').addEventListener('click', (e) => {
    const v = e.target.closest('button')?.dataset.v
    if (v) mark(v)
  })
  note.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') mark('fix')
    if (e.key === 'Escape') {
      note.classList.remove('show')
      e.stopPropagation()
    }
  })
  for (const type of ['pointerdown', 'wheel'])
    card.addEventListener(type, (e) => e.stopPropagation())

  // A click on the stage is the next beat; a drag is still a pan, so the eye can wander mid-walk.
  let press = null
  viewport.addEventListener('pointerdown', (e) => {
    press = touring() ? { x: e.clientX, y: e.clientY } : null
  })
  viewport.addEventListener('pointerup', (e) => {
    if (!press) return
    const still = Math.abs(e.clientX - press.x) + Math.abs(e.clientY - press.y) < 4
    press = null
    if (still && !e.target.closest('a')) next()
  })
  for (const type of ['wheel', 'pointerdown'])
    viewport.addEventListener(type, () => world.classList.remove('glide'), true)

  document.addEventListener(
    'keydown',
    (e) => {
      const typing = e.target instanceof Element && e.target.matches('input, textarea')
      if (!touring()) {
        if (!typing && e.key === 'w' && !e.metaKey && !e.ctrlKey)
          start(world.querySelector('.frame.on'))
        return
      }
      if (typing) return
      const keys = {
        ArrowRight: next,
        ArrowDown: next,
        ' ': next,
        Enter: next,
        ArrowLeft: prev,
        ArrowUp: prev,
        Escape: leave,
        y: () => mark('ok'),
        n: () => mark('fix'),
        w: leave,
      }
      const fn = keys[e.key]
      if (!fn) return
      e.preventDefault()
      e.stopPropagation()
      fn()
    },
    true,
  )
  window.addEventListener('resize', () => touring() && go(at, false))
  review.subscribe(() => touring() && paintVerdict())

  const wanted = new URLSearchParams(location.hash.slice(1)).get('walk')
  if (wanted !== null) start(document.getElementById(`frame-${slugify(wanted || '')}`) ?? undefined)
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initTour)
else initTour()
