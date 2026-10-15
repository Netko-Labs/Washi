export interface TeamSpace {
  /** Where to land the person: the backlog. */
  backlog: string
}

export interface TeamSpaceOptions {
  /** The routine's clock: the zone of whoever asked for the space. */
  timeZone: string
  actorId: string | null
}
