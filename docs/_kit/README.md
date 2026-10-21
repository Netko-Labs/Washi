# docs/_kit

Shared pieces every doc under `docs/` loads. Nothing here is app code.

| File | What |
| --- | --- |
| `doc.css` | Document design: rail + column, TL;DR, `.point`, chips, plates, tables, dark mode. Wears the studio's tokens. |
| `app.css` | Static mockups of the app (`.app` scope): shell, sidebar, tabs, header, sheet, board, grid, roadmap, canvas, agent panel, palette, settings, auth, mascot rig. |
| `mascot.js` | Injects the washi-chan `<defs>` and swaps `<i data-mascot="happy bob" data-size="32">` for the SVG. |
| `canvas.css` + `canvas.js` | The Figma-like canvas used by `design/*.html`. |
| `review.js` | The review store (`washi.review`): a verdict and a note per frame, kept by `docs/serve.ts` or localStorage. Load it before `canvas.js`. |
| `tour.css` + `tour.js` | Walk mode: the page as a slideshow — frame by frame, pin by pin, a verdict at the end of each. Load after `canvas.js`. |

## A document

```html
<link rel="stylesheet" href="_kit/doc.css" />
<body><div class="doc">
  <aside class="rail"> <a class="home" href="index.html"><i></i><em>WASHI</em></a> <nav>…</nav> </aside>
  <main class="column">
    <header class="head"> <div class="eyebrow">…</div> <h1>…</h1> <p class="lead">…</p> <div class="facts">…</div>
      <div class="tldr"><h2>30-second version</h2><ol><li>…</li></ol></div> </header>
    <section class="s" id="…"> <div class="num">01</div> <h2>…</h2> <p class="point">…</p> … </section>
    <footer class="foot">…</footer>
  </main>
</div></body>
```

Chips: `decided` `open` `later` `have` `new` `cut`. A figure is `<figure class="plate"><div class="inner">…</div><figcaption>…</figcaption></figure>`; add `wide` to break the measure. A mockup inside a doc is `<div class="app">…</div>` with `app.css` loaded.

## A design page

```html
<link rel="stylesheet" href="../_kit/app.css" /><link rel="stylesheet" href="../_kit/canvas.css" /><link rel="stylesheet" href="../_kit/tour.css" />
<body class="cv">
  <header class="cv-bar">…zoom controls with data-zoom="out|in|fit|1"…</header>
  <aside class="cv-layers" data-intro="…"></aside>
  <main class="cv-viewport"><div class="cv-world">
    <section class="cv-group" data-name="Shell" data-note="one line about this group">
      <article class="frame" data-name="Dashboard" data-w="1280" data-h="800">
        <div class="app">…</div>
        <div class="fnote">What this frame shows and why.</div>
      </article>
    </section>
  </div></main>
  <script src="../_kit/mascot.js"></script><script src="../_kit/review.js"></script><script src="../_kit/canvas.js"></script><script src="../_kit/tour.js"></script>
```

Groups stack; frames flow left to right (wrap width `data-wrap`, default 5200). The layers rail and frame labels are generated. Input: wheel pans, ⌘/ctrl+wheel or a pinch zooms at the cursor, shift+wheel pans sideways, any drag pans, a click selects a frame, a double-click or the rail zooms to it, `0` fits all, `1` is 100%. Under 50% the frame notes hide; under 25% the frame labels go too. Review mode (`R` or the bar button): ✓ ok / ✎ fix on every frame, `N` writes a note for the selected one, `]` `[` walk frames, Copy notes exports the page as Markdown. Serve with `bun run docs` and the notes land in `tasks/design-review.jsonl`; on any other static server they stay in localStorage. **Walk mode** (`W`, the bar button, or `#walk=<slug>`) is the same review as a slideshow: the view glides frame → pin → pin → verdict, the card on the right reads the frame's `.fnote` split at the pin numbers (write notes as `… 1 what pin 1 is. 2 what pin 2 is …`), `→` `←` or a click on the stage walk, `Y` marks ok, `N` opens a note, `Esc` leaves. A frame whose note has no numbers shows the whole note on every pin. Pins (`.pin`) and sticky notes (`.sticky`) sit anywhere in the world with inline `left/top`. Never edit `_kit/*` from a design page; page-specific CSS goes in that page's own `<style>`.
