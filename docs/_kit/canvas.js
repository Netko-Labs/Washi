// A Figma-like canvas for the design docs. Markup contract (see docs/_kit/README.md):
//   <body class="cv">
//     <header class="cv-bar">…</header> <aside class="cv-layers"></aside>
//     <main class="cv-viewport"><div class="cv-world">
//       <section class="cv-group" data-name="Shell" data-note="…">
//         <article class="frame" data-name="Dashboard" data-w="1280" data-h="800"> <div class="app">…</div> </article>
//       </section>
//     </div></main>
// Groups stack vertically; frames flow left to right inside their group. Wheel pans, ⌘/ctrl+wheel and a
// trackpad pinch zoom, shift+wheel pans sideways, any drag pans, a click selects a frame, a double-click or
// the rail zooms to it, 0 fits all, 1 is 100%, and a hash `#frame=<slug>` opens zoomed on one frame.
// Under 50% the notes hide and under 25% the frame labels go too — far out, the frames are the map.
// Review mode (R, or the bar button): ✓ ok / ✎ fix per frame, N notes the selected frame, ] [ walk frames,
// Copy notes puts the page's verdicts on the clipboard as Markdown; docs/serve.ts keeps them in a file.

const GAP = 96
const GROUP_GAP = 520
const PAD = 160
const MIN = 0.05
const MAX = 4

const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

function layout(world) {
  let y = 0
  const groups = [...world.querySelectorAll('.cv-group')]
  for (const group of groups) {
    group.style.left = '0px'
    group.style.top = `${y}px`
    if (!group.querySelector(':scope > .gname')) {
      group.insertAdjacentHTML('afterbegin', `<div class="gname">${group.dataset.name ?? ''}</div>`)
      if (group.dataset.note)
        group.insertAdjacentHTML('beforeend', `<div class="gnote">${group.dataset.note}</div>`)
    }
    let x = 0
    let rowH = 0
    const maxW = Number(group.dataset.wrap || 5200)
    for (const frame of group.querySelectorAll(':scope > .frame')) {
      const w = Number(frame.dataset.w || 1280)
      const h = Number(frame.dataset.h || 800)
      if (x > 0 && x + w > maxW) {
        x = 0
        y += rowH + GAP + 40
        rowH = 0
      }
      frame.style.width = `${w}px`
      frame.style.height = `${h}px`
      frame.style.left = `${x}px`
      frame.style.top = `${y - Number.parseFloat(group.style.top)}px`
      frame.id ||= `frame-${slug(frame.dataset.name ?? 'frame')}`
      if (!frame.querySelector(':scope > .fname')) {
        frame.insertAdjacentHTML(
          'afterbegin',
          `<div class="fname"><b>${frame.dataset.name ?? ''}</b><span class="k">${w}×${h}</span></div>`,
        )
      }
      x += w + GAP
      rowH = Math.max(rowH, h)
    }
    y += rowH + GROUP_GAP
  }
}

function init() {
  const viewport = document.querySelector('.cv-viewport')
  const world = document.querySelector('.cv-world')
  const layers = document.querySelector('.cv-layers')
  const pct = document.querySelector('.cv-bar .pct')
  if (!viewport || !world) return

  layout(world)

  const state = { x: 0, y: 0, k: 1 }
  const apply = () => {
    world.style.transform = `translate(${state.x}px, ${state.y}px) scale(${state.k})`
    world.style.setProperty('--k', String(state.k))
    world.style.setProperty('--inv', String(1 / state.k))
    world.dataset.zoom = state.k < 0.25 ? 'far' : state.k < 0.5 ? 'mid' : 'near'
    if (pct) pct.textContent = `${Math.round(state.k * 100)}%`
  }

  const bounds = () => {
    let r = 0
    let b = 0
    for (const frame of world.querySelectorAll('.frame, .tile-frame, .sticky')) {
      r = Math.max(
        r,
        frame.offsetLeft +
          frame.offsetWidth +
          (frame.parentElement.classList.contains('cv-group') ? frame.parentElement.offsetLeft : 0),
      )
      b = Math.max(
        b,
        frame.offsetTop +
          frame.offsetHeight +
          (frame.parentElement.classList.contains('cv-group') ? frame.parentElement.offsetTop : 0),
      )
    }
    return { w: r, h: b }
  }

  const fitRect = (x, y, w, h, pad = PAD) => {
    const vw = viewport.clientWidth
    const vh = viewport.clientHeight
    const k = Math.min(MAX, Math.max(MIN, Math.min((vw - pad) / w, (vh - pad) / h)))
    state.k = k
    state.x = (vw - w * k) / 2 - x * k
    state.y = (vh - h * k) / 2 - y * k
    apply()
  }
  const fitAll = () => {
    const { w, h } = bounds()
    fitRect(0, -60, w, h + 60)
  }
  const zoomTo = (k, cx = viewport.clientWidth / 2, cy = viewport.clientHeight / 2) => {
    const next = Math.min(MAX, Math.max(MIN, k))
    state.x = cx - ((cx - state.x) * next) / state.k
    state.y = cy - ((cy - state.y) * next) / state.k
    state.k = next
    apply()
  }
  const select = (frame) => {
    for (const f of world.querySelectorAll('.frame.on')) f.classList.remove('on')
    frame.classList.add('on')
    history.replaceState(null, '', `#frame=${frame.id.replace(/^frame-/, '')}`)
    for (const b of layers?.querySelectorAll('button') ?? []) {
      const on = b.dataset.for === frame.id
      b.classList.toggle('on', on)
      if (on) b.scrollIntoView({ block: 'nearest' })
    }
  }
  const focus = (frame) => {
    select(frame)
    const group = frame.parentElement
    const gx = group.classList.contains('cv-group') ? group.offsetLeft : 0
    const gy = group.classList.contains('cv-group') ? group.offsetTop : 0
    fitRect(
      gx + frame.offsetLeft,
      gy + frame.offsetTop - 30,
      frame.offsetWidth,
      frame.offsetHeight + 30,
      120,
    )
  }

  // layers rail
  if (layers) {
    const intro = layers.dataset.intro
    if (intro) layers.insertAdjacentHTML('beforeend', `<div class="intro">${intro}</div>`)
    for (const group of world.querySelectorAll('.cv-group')) {
      layers.insertAdjacentHTML('beforeend', `<div class="set">${group.dataset.name ?? ''}</div>`)
      for (const frame of group.querySelectorAll(':scope > .frame')) {
        const b = document.createElement('button')
        b.dataset.for = frame.id
        b.innerHTML = `<span class="g">#</span>${frame.dataset.name ?? ''}<span class="sz">${frame.dataset.w ?? 1280}×${frame.dataset.h ?? 800}</span>`
        b.addEventListener('click', () => focus(frame))
        layers.appendChild(b)
      }
    }
  }

  // wheel: pan; with ⌘/ctrl (or a trackpad pinch, which arrives as ctrl+wheel): zoom around the cursor.
  // A mouse wheel reports lines, not pixels, on some platforms; shift turns its one axis sideways.
  viewport.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault()
      const rect = viewport.getBoundingClientRect()
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? viewport.clientHeight : 1
      let dx = e.deltaX * unit
      let dy = e.deltaY * unit
      if (e.ctrlKey || e.metaKey) {
        const factor = Math.exp(-Math.max(-120, Math.min(120, dy)) * 0.0022)
        zoomTo(state.k * factor, e.clientX - rect.left, e.clientY - rect.top)
        return
      }
      if (e.shiftKey && dx === 0) {
        dx = dy
        dy = 0
      }
      state.x -= dx
      state.y -= dy
      apply()
    },
    { passive: false },
  )
  // Safari sends a trackpad pinch as gesture events, not ctrl+wheel.
  let pinchFrom = 1
  viewport.addEventListener('gesturestart', (e) => {
    e.preventDefault()
    pinchFrom = state.k
  })
  viewport.addEventListener('gesturechange', (e) => {
    e.preventDefault()
    const rect = viewport.getBoundingClientRect()
    zoomTo(pinchFrom * e.scale, e.clientX - rect.left, e.clientY - rect.top)
  })
  viewport.addEventListener('gestureend', (e) => e.preventDefault())

  // drag to pan: space held, middle button, or any drag on the background
  let drag = null
  let space = false
  document.addEventListener('keydown', (e) => {
    if (e.target instanceof Element && e.target.matches('input, textarea')) return
    if (e.code === 'Space') {
      space = true
      document.body.classList.add('grabbing')
      e.preventDefault()
    }
    if (e.key === '0') fitAll()
    if (e.key === '1') zoomTo(1)
    if (e.key === '=' || e.key === '+') zoomTo(state.k * 1.2)
    if (e.key === '-') zoomTo(state.k / 1.2)
    if (e.key === 'Escape') {
      for (const f of world.querySelectorAll('.frame.on')) f.classList.remove('on')
      history.replaceState(null, '', location.pathname)
    }
  })
  document.addEventListener('keyup', (e) => {
    if (e.code === 'Space') {
      space = false
      document.body.classList.remove('grabbing')
    }
  })
  viewport.addEventListener('pointerdown', (e) => {
    const onFrame = e.target.closest('.frame, .tile-frame, .sticky')
    if (e.button === 1 || space || !onFrame || e.button === 0) {
      drag = { x: e.clientX, y: e.clientY, sx: state.x, sy: state.y, moved: false, frame: onFrame }
      document.body.classList.add('grabbing')
    }
  })
  viewport.addEventListener('pointermove', (e) => {
    if (!drag) return
    const dx = e.clientX - drag.x
    const dy = e.clientY - drag.y
    if (!drag.moved && Math.abs(dx) + Math.abs(dy) > 3) {
      // Capture only once a drag is real, so a plain click on a link or frame still lands on it.
      drag.moved = true
      viewport.setPointerCapture(e.pointerId)
    }
    state.x = drag.sx + dx
    state.y = drag.sy + dy
    apply()
  })
  viewport.addEventListener('pointerup', (e) => {
    if (drag && !drag.moved && drag.frame?.classList.contains('frame')) {
      if (e.target.closest('a')) {
        drag = null
        return
      }
      select(drag.frame)
    }
    drag = null
    document.body.classList.remove('grabbing')
  })
  viewport.addEventListener('dblclick', (e) => {
    const frame = e.target.closest('.frame')
    if (frame) focus(frame)
    else fitAll()
  })

  for (const b of document.querySelectorAll('[data-zoom]')) {
    b.addEventListener('click', () => {
      const v = b.dataset.zoom
      if (v === 'fit') fitAll()
      else if (v === 'in') zoomTo(state.k * 1.25)
      else if (v === 'out') zoomTo(state.k / 1.25)
      else zoomTo(Number(v))
    })
  }

  const wanted = new URLSearchParams(location.hash.slice(1)).get('frame')
  const target = wanted && document.getElementById(`frame-${wanted}`)
  if (target) focus(target)
  else fitAll()
  window.addEventListener('resize', () => (target ? focus(target) : fitAll()))
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init)
else init()

// ── review mode: a verdict and a note per frame, kept by docs/serve.ts (falls back to localStorage) ──
function initReview() {
  const bar = document.querySelector('.cv-bar')
  const world = document.querySelector('.cv-world')
  const layers = document.querySelector('.cv-layers')
  if (!bar || !world) return
  const page = location.pathname
    .split('/')
    .pop()
    .replace(/\.html$/, '')
  const Key = `washi:review:${page}`
  let notes = []
  let current = null

  const toggle = document.createElement('button')
  toggle.className = 'rv-toggle'
  toggle.textContent = 'Review'
  const copy = document.createElement('button')
  copy.className = 'rv-toggle'
  copy.textContent = 'Copy notes'
  const zoom = bar.querySelector('.zoom')
  bar.insertBefore(copy, zoom)
  bar.insertBefore(toggle, copy)

  const panel = document.createElement('div')
  panel.className = 'cv-note'
  panel.innerHTML = `<div class="h"><span class="t"></span><small class="s"></small></div><textarea placeholder="What should change, or what works — one note per frame is plenty."></textarea><div class="prev"></div><div class="row"><span class="k" style="font:500 10.5px/1 var(--cv-mono);color:var(--cv-muted)">⌘↩ saves</span><span class="sp"></span><button class="x">Close</button><button class="primary save">Save note</button></div>`
  document.body.appendChild(panel)
  const ta = panel.querySelector('textarea')

  const load = async () => {
    try {
      const r = await fetch('/_review')
      if (r.ok) {
        notes = (await r.json()).filter((n) => n.page === page)
        return
      }
    } catch {}
    notes = JSON.parse(localStorage.getItem(Key) || '[]')
  }
  const persist = async (note) => {
    notes.push(note)
    try {
      const r = await fetch('/_review', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(note),
      })
      if (r.ok) return
    } catch {}
    localStorage.setItem(Key, JSON.stringify(notes))
  }
  const latest = (frame) => {
    const own = notes.filter((n) => n.frame === frame.dataset.name)
    const verdict = [...own].reverse().find((n) => n.verdict)?.verdict ?? null
    return { own, verdict }
  }
  const paint = () => {
    for (const frame of world.querySelectorAll('.frame')) {
      const { own, verdict } = latest(frame)
      frame.classList.toggle('rv-ok', verdict === 'ok')
      frame.classList.toggle('rv-fix', verdict === 'fix')
      let strip = frame.querySelector(':scope > .rv')
      if (!strip) {
        strip = document.createElement('div')
        strip.className = 'rv'
        strip.innerHTML = `<button data-v="ok" title="Looks right">✓ ok</button><button data-v="fix" title="Needs work — add a note">✎ fix</button><span class="n"></span>`
        strip.addEventListener('pointerdown', (e) => e.stopPropagation())
        strip.addEventListener('click', (e) => {
          const v = e.target.closest('button')?.dataset.v
          if (!v) return
          e.stopPropagation()
          if (v === 'ok') {
            persist({ page, frame: frame.dataset.name, verdict: 'ok', note: '' }).then(paint)
          } else open(frame, 'fix')
        })
        frame.appendChild(strip)
      }
      strip.querySelector('[data-v="ok"]').classList.toggle('on-ok', verdict === 'ok')
      strip.querySelector('[data-v="fix"]').classList.toggle('on-fix', verdict === 'fix')
      const texts = own.filter((n) => n.note).length
      strip.querySelector('.n').textContent = texts ? `${texts} note${texts > 1 ? 's' : ''}` : ''
      const b = layers?.querySelector(`button[data-for="${frame.id}"]`)
      if (b) {
        let dot = b.querySelector('.dot')
        if (!dot) {
          dot = document.createElement('span')
          dot.className = 'dot'
          b.appendChild(dot)
        }
        dot.className = `dot${verdict ? ` ${verdict}` : ''}`
      }
    }
  }
  const open = (frame, verdict) => {
    current = { frame, verdict }
    panel.querySelector('.t').textContent = frame.dataset.name
    panel.querySelector('.s').textContent = `${page} · ${verdict === 'fix' ? 'needs work' : 'note'}`
    const own = latest(frame).own.filter((n) => n.note)
    panel.querySelector('.prev').innerHTML =
      own
        .map(
          (n) =>
            `<div><b>${n.verdict === 'fix' ? '✎' : '✓'}</b> ${n.note.replace(/</g, '&lt;')}</div>`,
        )
        .join('') || '<div>No notes yet.</div>'
    panel.classList.add('open')
    ta.value = ''
    ta.focus()
  }
  const save = async () => {
    if (!current) return
    const text = ta.value.trim()
    await persist({ page, frame: current.frame.dataset.name, verdict: current.verdict, note: text })
    panel.classList.remove('open')
    current = null
    paint()
  }
  panel.querySelector('.save').addEventListener('click', save)
  panel.querySelector('.x').addEventListener('click', () => panel.classList.remove('open'))
  ta.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') save()
    e.stopPropagation()
  })
  panel.addEventListener('pointerdown', (e) => e.stopPropagation())
  panel.addEventListener('wheel', (e) => e.stopPropagation())

  toggle.addEventListener('click', () => document.body.classList.toggle('reviewing'))
  copy.addEventListener('click', () => {
    const lines = [`# design review · ${page}`, '']
    for (const frame of world.querySelectorAll('.frame')) {
      const { own, verdict } = latest(frame)
      if (!verdict) continue
      lines.push(
        `- ${verdict === 'ok' ? '✓' : '✎'} **${frame.dataset.name}**${own
          .filter((n) => n.note)
          .map((n) => `\n  - ${n.note}`)
          .join('')}`,
      )
    }
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      copy.textContent = 'Copied'
      setTimeout(() => (copy.textContent = 'Copy notes'), 1200)
    })
  })
  document.addEventListener('keydown', (e) => {
    if (e.target instanceof Element && e.target.matches('input, textarea')) return
    if (e.key === 'r' && !e.metaKey && !e.ctrlKey) document.body.classList.toggle('reviewing')
    if (e.key === ']' || e.key === '[') {
      const frames = [...world.querySelectorAll('.frame')]
      const on = frames.findIndex((f) => f.classList.contains('on'))
      const next = frames[(on + (e.key === ']' ? 1 : -1) + frames.length) % frames.length]
      layers?.querySelector(`button[data-for="${next.id}"]`)?.click()
    }
    if (e.key === 'n' && document.body.classList.contains('reviewing')) {
      const on = world.querySelector('.frame.on')
      if (on) open(on, 'fix')
    }
  })
  load().then(paint)
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initReview)
else initReview()
