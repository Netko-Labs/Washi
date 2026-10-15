/**
 * The honest pitch. The desktop onboarding promised "No account required" and
 * "Washi never talks to a cloud we run" — true once, false the moment a team
 * server existed. This says what actually happens.
 */
export const PITCH = {
  headline: "Your team's living pages.",
  sub: 'Docs, backlogs, roadmaps and graphs, written by your team and Washi together.',
  points: [
    ['Type it or ask for it', 'Write in the page, or ask Washi to. The same page either way.'],
    ['Live data', 'Boards, timelines and charts read your tables and stay current.'],
    ['Washi keeps it true', 'Its writes are marked and undoable; nothing leaves without a person.'],
  ] as const,
}
