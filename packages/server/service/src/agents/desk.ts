import { checkAction, type HankoHandlers, isReversibleVerb, runAction } from '@washi/hanko'
import { recordCapability, setAppMeta, type Workspace } from '@washi/repository'
import { guardedFetch, isPrivateAddress } from '@washi/tsuru'
import { createSheetFromSource } from '../sheets/service'
import { deleteRecord, runMutation, updateRecord } from '../tables/service'
import type { Caller, EventsRef } from './lib'
import { currentFetchPolicy, TSURU_HOSTS_KEY } from './tools'

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

  async execute(input: unknown, caller: Caller = { origin: 'agent' }): Promise<void> {
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
    await runAction(checked.action, this.handlers())
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
      const policy = currentFetchPolicy(this.ws)
      if (!policy.allowedHosts.includes(host)) {
        setAppMeta(this.ws, TSURU_HOSTS_KEY, JSON.stringify([...policy.allowedHosts, host]))
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

  private handlers(): HankoHandlers {
    return {
      'sheet.open': (action) => {
        this.events()?.openSheet(action.sheet)
      },
      'sheet.create': (action) => {
        // A JS string literal in braces: JSX text and attribute strings have no escapes.
        const title = `{${JSON.stringify(action.title)}}`
        const source = `<Sheet title=${title} wsx="1">\n  <Title>${title}</Title>\n</Sheet>\n`
        const sheet = createSheetFromSource(this.ws, { title: action.title, source })
        this.events()?.openSheet(sheet.id)
      },
      'table.insert': (action) => {
        runMutation(this.ws, { kind: 'insert', table: action.table, data: action.data })
      },
      'table.update': (action) => {
        updateRecord(this.ws, action.table, action.row, action.set)
      },
      'table.reorder': (action) => {
        updateRecord(this.ws, action.table, action.row, action.set)
      },
      'table.delete': (action) => {
        deleteRecord(this.ws, action.table, action.row)
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
