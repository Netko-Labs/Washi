/**
 * Generate icon.iconset from the design handoff (design/icon/README.md):
 * full-bleed 1024 master → 824×824 squircle with continuous corners → drop
 * shadow (y≈10, blur≈20, ~30% black) → centered on a transparent 1024 canvas
 * → downscaled to every iconset size. Run: bun run scripts/make-icons.ts
 */

import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'

const ROOT = join(import.meta.dir, '..')
const MASTER = join(ROOT, 'design/icon/AppIcon.appiconset/icon-light-1024.png')
const OUT = join(ROOT, 'icon.iconset')

const CANVAS = 1024
const SHAPE = 824
const MARGIN = (CANVAS - SHAPE) / 2

/** Apple-style continuous corner: superellipse |x|^n + |y|^n = r^n, n≈5. */
function squirclePath(size: number, exponent = 5, steps = 256): string {
  const radius = size / 2
  const points: string[] = []
  for (let index = 0; index < steps; index++) {
    const angle = (index / steps) * 2 * Math.PI
    const cosine = Math.cos(angle)
    const sine = Math.sin(angle)
    const x = radius + Math.sign(cosine) * radius * Math.abs(cosine) ** (2 / exponent)
    const y = radius + Math.sign(sine) * radius * Math.abs(sine) ** (2 / exponent)
    points.push(`${x.toFixed(2)},${y.toFixed(2)}`)
  }
  return `M${points.join('L')}Z`
}

async function buildMaster1024(): Promise<Buffer> {
  const path = squirclePath(SHAPE)
  const maskSvg = Buffer.from(
    `<svg width="${SHAPE}" height="${SHAPE}" xmlns="http://www.w3.org/2000/svg"><path d="${path}" fill="#fff"/></svg>`,
  )
  const shadowSvg = Buffer.from(
    `<svg width="${CANVAS}" height="${CANVAS}" xmlns="http://www.w3.org/2000/svg">
      <filter id="b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="20"/></filter>
      <g transform="translate(${MARGIN}, ${MARGIN + 10})" filter="url(#b)">
        <path d="${path}" fill="rgb(0 0 0 / 0.3)"/>
      </g>
    </svg>`,
  )

  const shape = await sharp(MASTER)
    .resize(SHAPE, SHAPE)
    .composite([{ input: maskSvg, blend: 'dest-in' }])
    .png()
    .toBuffer()

  return sharp({
    create: {
      width: CANVAS,
      height: CANVAS,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      { input: shadowSvg, top: 0, left: 0 },
      { input: shape, top: MARGIN, left: MARGIN },
    ])
    .png()
    .toBuffer()
}

const master = await buildMaster1024()
mkdirSync(OUT, { recursive: true })

const SIZES = [16, 32, 128, 256, 512]
for (const size of SIZES) {
  await sharp(master)
    .resize(size, size)
    .png()
    .toFile(join(OUT, `icon_${size}x${size}.png`))
  await sharp(master)
    .resize(size * 2, size * 2)
    .png()
    .toFile(join(OUT, `icon_${size}x${size}@2x.png`))
}

console.log(`wrote ${SIZES.length * 2} sizes to ${OUT}`)
