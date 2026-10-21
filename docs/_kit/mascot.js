// The washi-chan rig for docs: the same <defs> the app mounts (packages/washi/ui/src/mascot/mascot-defs.tsx).
// Any page that loads this gets `<svg class="mascot"><use href="#wBody"/><use href="#fHappy"/></svg>` for free,
// and every `<i data-mascot="happy bob" data-size="32">` is swapped for one.

const INK = '#6B3A1F'
const EAR = '#AEBB9A'
const BLUSH = (cy = 152, rx = 16, ry = 9, o = 0.85) =>
  `<ellipse cx="62" cy="${cy}" rx="${rx}" ry="${ry}" fill="#F0A487" opacity="${o}"/><ellipse cx="178" cy="${cy}" rx="${rx}" ry="${ry}" fill="#F0A487" opacity="${o}"/>`

const DEFS = `
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <defs>
    <g id="wBody">
      <ellipse cx="120" cy="250" rx="72" ry="10" fill="${INK}" opacity="0.12"/>
      <rect x="12" y="172" width="42" height="34" rx="17" fill="#F7EDD6" stroke="${INK}" stroke-width="8"/>
      <rect x="186" y="172" width="42" height="34" rx="17" fill="#F7EDD6" stroke="${INK}" stroke-width="8"/>
      <path d="M64 34 H150 L206 90 V196 C206 218 190 232 168 232 H72 C50 232 34 218 34 196 V70 C34 48 46 34 64 34 Z" fill="#F7EDD6" stroke="${INK}" stroke-width="8" stroke-linejoin="round"/>
      <path d="M150 34 L206 90 H166 C156 90 150 84 150 74 Z" fill="${EAR}" stroke="${INK}" stroke-width="8" stroke-linejoin="round"/>
    </g>
    <g id="fHappy">${BLUSH()}
      <circle cx="90" cy="130" r="14" fill="#2A1B12"/><circle cx="95" cy="125" r="5" fill="#fff"/>
      <circle cx="150" cy="130" r="14" fill="#2A1B12"/><circle cx="155" cy="125" r="5" fill="#fff"/>
      <path d="M108 156 Q120 150 132 156 Q129 175 120 177 Q111 175 108 156 Z" fill="#7A3A22"/>
      <ellipse cx="120" cy="170" rx="9" ry="5" fill="#E8836B"/>
    </g>
    <g id="fSleep">${BLUSH()}
      <path d="M78 134 Q90 122 102 134" fill="none" stroke="#2A1B12" stroke-width="8" stroke-linecap="round"/>
      <path d="M138 134 Q150 122 162 134" fill="none" stroke="#2A1B12" stroke-width="8" stroke-linecap="round"/>
      <path d="M112 160 Q120 168 128 160" fill="none" stroke="#7A3A22" stroke-width="7" stroke-linecap="round"/>
    </g>
    <g id="fCurious">${BLUSH(154, 15, 8, 0.8)}
      <circle cx="88" cy="128" r="16" fill="#2A1B12"/><circle cx="94" cy="122" r="6" fill="#fff"/>
      <circle cx="152" cy="132" r="11" fill="#2A1B12"/><circle cx="156" cy="128" r="4" fill="#fff"/>
      <ellipse cx="120" cy="164" rx="10" ry="12" fill="#7A3A22"/>
    </g>
    <g id="fSad">${BLUSH(154, 15, 8, 0.7)}
      <circle cx="90" cy="134" r="13" fill="#2A1B12"/><circle cx="86" cy="139" r="5" fill="#fff"/>
      <circle cx="150" cy="134" r="13" fill="#2A1B12"/><circle cx="146" cy="139" r="5" fill="#fff"/>
      <path d="M74 114 Q88 106 100 112" fill="none" stroke="#2A1B12" stroke-width="6" stroke-linecap="round" opacity="0.75"/>
      <path d="M166 114 Q152 106 140 112" fill="none" stroke="#2A1B12" stroke-width="6" stroke-linecap="round" opacity="0.75"/>
      <path d="M108 170 Q120 160 132 170" fill="none" stroke="#7A3A22" stroke-width="7" stroke-linecap="round"/>
    </g>
    <g id="fDizzy">${BLUSH(154, 15, 8, 0.7)}
      <path d="M80 122 L100 142 M100 122 L80 142" stroke="#2A1B12" stroke-width="8" stroke-linecap="round"/>
      <path d="M140 122 L160 142 M160 122 L140 142" stroke="#2A1B12" stroke-width="8" stroke-linecap="round"/>
      <path d="M106 168 Q113 160 120 168 Q127 176 134 168" fill="none" stroke="#7A3A22" stroke-width="7" stroke-linecap="round"/>
    </g>
    <g id="fWink">${BLUSH()}
      <circle cx="90" cy="130" r="14" fill="#2A1B12"/><circle cx="95" cy="125" r="5" fill="#fff"/>
      <path d="M138 132 Q150 120 162 132" fill="none" stroke="#2A1B12" stroke-width="8" stroke-linecap="round"/>
      <path d="M104 154 Q120 148 136 154 Q132 178 120 180 Q108 178 104 154 Z" fill="#7A3A22"/>
      <ellipse cx="120" cy="172" rx="10" ry="5" fill="#E8836B"/>
    </g>
    <g id="fBlank">
      <circle cx="90" cy="132" r="12" fill="#2A1B12"/><circle cx="94" cy="128" r="4" fill="#fff"/>
      <circle cx="150" cy="132" r="12" fill="#2A1B12"/><circle cx="154" cy="128" r="4" fill="#fff"/>
      <path d="M108 162 H132" stroke="#7A3A22" stroke-width="7" stroke-linecap="round"/>
    </g>
  </defs>
</svg>`

const FACES = {
  happy: 'fHappy',
  sleep: 'fSleep',
  curious: 'fCurious',
  sad: 'fSad',
  dizzy: 'fDizzy',
  wink: 'fWink',
  blank: 'fBlank',
}

/** Markup for one mascot. `motion` is a class from app.css: bob · flip · peek · breathe · sway. */
function mascot({ face = 'happy', motion = '', size = 32, className = '' } = {}) {
  const id = FACES[face] ?? FACES.happy
  return `<svg class="mascot ${motion} ${className}" viewBox="0 0 240 266" width="${size}" aria-hidden="true"><g><use href="#wBody"/><use href="#${id}"/></g></svg>`
}

function mount() {
  if (!document.getElementById('wBody')) {
    document.body.insertAdjacentHTML('afterbegin', DEFS)
  }
  for (const el of document.querySelectorAll('i[data-mascot]')) {
    const [face, motion = ''] = (el.dataset.mascot || 'happy').split(/\s+/)
    el.outerHTML = mascot({
      face,
      motion,
      size: Number(el.dataset.size || 32),
      className: el.className,
    })
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount)
else mount()

window.washi = Object.assign(window.washi || {}, { mascot, mount })
