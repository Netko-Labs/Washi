const types = [
  '✨ feat',
  '🐛 fix',
  '📝 docs',
  '💄 style',
  '♻️ refactor',
  '⚡ perf',
  '✅ test',
  '🔧 chore',
  '🏗️ build',
  '👷 ci',
  '🔒 security',
  '🚀 release',
]

export default {
  parserPreset: {
    parserOpts: {
      headerPattern: /^(\p{Extended_Pictographic}️?\s\w+)(?:\(([^)]+)\))?:\s(.+)$/u,
      headerCorrespondence: ['type', 'scope', 'subject'],
    },
  },
  rules: {
    'type-enum': [2, 'always', types],
    'type-empty': [2, 'never'],
    'subject-empty': [2, 'never'],
    'header-max-length': [2, 'always', 100],
  },
}
