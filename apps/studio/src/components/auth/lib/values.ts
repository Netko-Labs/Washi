/**
 * The honest pitch. The desktop onboarding promised "No account required" and
 * "Washi never talks to a cloud we run" — true once, false the moment a team
 * server existed. This says what actually happens.
 */
export const PITCH = {
  headline: 'Notes your agent writes.',
  sub: 'You direct, it drafts, you approve. Pages are designed, not typed.',
  points: [
    ['Edit by asking', 'There is no cursor in a page. Tell Washi what to change.'],
    ['Review is the job', 'Every edit an agent proposes waits for a person.'],
    ['Your workspace, your server', 'Self-hosted and open source. No plans, no seats.'],
  ] as const,
}
