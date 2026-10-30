import { checkAction, type HankoHandlers, isReversibleVerb, runAction } from '@washi/hanko'
import { mutationSchema } from '@washi/ink'
import { recordCapability, setAppMeta, type Workspace } from '@washi/repository'
import { guardedFetch, isPrivateAddress } from '@washi/tsuru'
import { createSheetFromSource } from '../sheets/service'
import { addColumn, deleteRecord, runMutation, updateRecord } from '../tables/service'
import type { Caller, EventsRef } from './lib'
import { currentFetchPolicy, ownFetchHosts, TSURU_HOSTS_KEY } from './tools'

/**
 * The single gate both callers pass through (spec §09 P4). Agent-origin calls
 * were already stamped at the approvals desk; sheet-origin calls are a user
 * click, which is consent for reversible in-workspace verbs and never for
 * anything that leaves the machine (Q13). Every outcome lands in the ledger.
 */
export class CapabilityDesk {
  private readonly ws: Workspace
  private readonly events: EventsRef

  constructor(ws: Workspace, events: EventsRef) {
    this.ws = ws
    this.events = events
  }

  /** Resolves to the page a press opened, for the presser's own client to show. */
  async execute(input: unknown, caller: Caller = { origin: 'agent' }): Promise<string | null> {
    const { origin, actorId = null } = caller
    const checked = checkAction(input)
    if (!checked.ok) {
      const detail = checked.issues.map((issue) => issue.message).join('; ')
      this.ledger(caller, 'action.invalid', input, 'denied', detail)
      throw new Error(detail)
    }

    const { verb } = checked.action
    if (origin === 'sheet' && !isReversibleVerb(verb)) {
      const detail = `"${verb}" leaves this machine — a sheet cannot run it without a stamp`
      this.ledger(caller, verb, input, 'denied', detail)
      throw new Error(detail)
    }

    this.ledger({ origin, actorId }, verb, input, origin === 'sheet' ? 'auto' : 'allowed')
    let opened: string | null = null
    const open = (id: string) => {
      if (origin === 'sheet') opened = id
      else if (caller.sessionId) this.events()?.openSheet(id, caller.sessionId)
    }
    await runAction(checked.action, this.handlers(origin === 'agent' ? 'washi' : actorId, open))
    return opened
  }

  /** A page-side fetch path — same policy, no approval loop. */
  async fetchForSheet(url: string, actorId: string | null = null): Promise<string> {
    const caller: Caller = { origin: 'sheet', actorId }
    try {
      const body = await guardedFetch(url, currentFetchPolicy(this.ws))
      this.ledger(caller, 'fetch_url', { url }, 'auto')
      return body
    } catch (error) {
      this.ledger(caller, 'fetch_url', { url }, 'denied', String(error))
      throw error
    }
  }

  /** "Always" on a fetch is a host on the allowlist, not a blank cheque for the session. */
  allowFetchHost(rawUrl: string): void {
    try {
      const host = new URL(rawUrl).hostname
      if (!currentFetchPolicy(this.ws).allowedHosts.includes(host)) {
        setAppMeta(this.ws, TSURU_HOSTS_KEY, JSON.stringify([...ownFetchHosts(this.ws), host]))
      }
    } catch {
      // unparseable url — the fetch itself will fail loudly
    }
  }

  private ledger(
    caller: Caller,
    subject: string,
    input: unknown,
    decision: 'auto' | 'allowed' | 'denied',
    detail?: string,
  ) {
    recordCapability(this.ws, {
      origin: caller.origin,
      actorId: caller.actorId ?? null,
      subject,
      input,
      decision,
      ...(detail ? { detail } : {}),
    })
  }

  /** `author` signs the rows a verb writes: the person who pressed, or Washi (D78). */
  private handlers(author: string | null, open: (id: string) => void): HankoHandlers {
    return {
      'sheet.open': (action) => {
        open(action.sheet)
      },
      'sheet.create': (action) => {
        // A JS string literal in braces: JSX text and attribute strings have no escapes.
        const title = `{${JSON.stringify(action.title)}}`
        const source = `<Sheet title=${title} wsx="1">\n  <Title>${title}</Title>\n</Sheet>\n`
        const sheet = createSheetFromSource(this.ws, { title: action.title, source })
        open(sheet.id)
      },
      'table.insert': (action) => {
        runMutation(this.ws, { kind: 'insert', table: action.table, data: action.data }, author)
      },
      'table.update': (action) => {
        updateRecord(this.ws, action.table, action.row, action.set, author)
      },
      'table.reorder': (action) => {
        updateRecord(this.ws, action.table, action.row, action.set, author)
      },
      'table.copy': (action) => {
        runMutation(this.ws, mutationSchema.parse({ ...action, kind: 'copy' }), author)
      },
      'table.delete': (action) => {
        deleteRecord(this.ws, action.table, action.row, author)
      },
      'table.column': (action) => {
        addColumn(this.ws, action.table, action.column)
      },
      'url.open': (action) => {
        const url = new URL(action.url)
        if (url.protocol !== 'https:' || isPrivateAddress(url.hostname)) {
          throw new Error('url.open takes public https URLs only')
        }
        Bun.spawn([process.platform === 'darwin' ? 'open' : 'xdg-open', url.toString()])
      },
    }
  }
}
