/**
 * Writes the picker's Unicode set from `emoji-test.txt` (unicode.org/Public/emoji/latest/):
 * `bun scripts/emoji-values.ts path/to/emoji-test.txt`. Fully-qualified only, no skin tones,
 * nothing newer than MAX_VERSION so every system the studio runs on can draw it.
 */
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'

const MAX_VERSION = 15.1
const LINE_BUDGET = 84
const OUT = join(import.meta.dir, '../src/components/shared/emoji/values')
const SKIN_TONE = /[\u{1F3FB}-\u{1F3FF}]/u

const GROUPS: Record<string, { file: string; constant: string }> = {
  'Smileys & Emotion': { file: 'smileys', constant: 'SMILEYS' },
  'People & Body': { file: 'people', constant: 'PEOPLE' },
  'Animals & Nature': { file: 'nature', constant: 'NATURE' },
  'Food & Drink': { file: 'food', constant: 'FOOD' },
  'Travel & Places': { file: 'travel', constant: 'TRAVEL' },
  Activities: { file: 'activities', constant: 'ACTIVITIES' },
  Objects: { file: 'objects', constant: 'OBJECTS' },
  Symbols: { file: 'symbols', constant: 'SYMBOLS' },
  Flags: { file: 'flags', constant: 'FLAGS' },
}

const path = process.argv[2]
if (!path) throw new Error('usage: bun scripts/emoji-values.ts path/to/emoji-test.txt')
const text = await Bun.file(path).text()

const lines = new Map<string, string[]>()
let group: string | null = null
let pending: string[] = []
let current = ''

const flush = () => {
  if (group && current) lines.get(group)?.push(current)
  current = ''
}

for (const raw of text.split('\n')) {
  const groupMatch = raw.match(/^# group: (.+)$/)
  if (groupMatch) {
    flush()
    group = GROUPS[groupMatch[1] ?? ''] ? (groupMatch[1] ?? null) : null
    if (group) lines.set(group, [])
    continue
  }
  const subgroup = raw.match(/^# subgroup: (.+)$/)
  if (subgroup && group) {
    flush()
    pending = [`#${(subgroup[1] ?? '').replaceAll('-', ' ')}`]
    continue
  }
  const entry = raw.match(/; fully-qualified\s+# (\S+) E(\d+\.\d+) (.+)$/)
  if (!entry || !group) continue
  const [, emoji = '', version = '0', name = ''] = entry
  if (Number(version) > MAX_VERSION || SKIN_TONE.test(emoji)) continue
  if (pending.length > 0) {
    lines.get(group)?.push(...pending)
    pending = []
  }
  const item = `${emoji} ${name}`
  if (current && current.length + item.length + 1 > LINE_BUDGET) flush()
  current = current ? `${current}|${item}` : item
}
flush()

for (const [name, packed] of lines) {
  const target = GROUPS[name]
  if (!target) continue
  const body = packed.map((line) => `  '${line.replaceAll("'", "\\'")}',`).join('\n')
  writeFileSync(
    join(OUT, `${target.file}.ts`),
    `export const ${target.constant}: readonly string[] = [\n${body}\n]\n`,
  )
  console.log(target.file, packed.length + 3, 'lines')
}
