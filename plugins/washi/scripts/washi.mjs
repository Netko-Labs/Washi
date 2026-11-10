#!/usr/bin/env -S bun
// Calls one Washi MCP tool with arguments read from local files, so a large page or a picture
// never has to pass through the agent's own tool call. Runs under bun or node (18+), no packages.
//
//   washi.mjs <tool> key=value key:=<json> key=@<file> key:=@<json file> key=@base64:<file>
//   washi.mjs upload <file> [contentType]          (file_upload_url, then a PUT of the bytes)
//   --workspace <id or name> anywhere: act in that workspace (an OAuth sign-in that reaches several)
//
// It speaks to WASHI_MCP_URL with WASHI_TOKEN (a personal access token, `washi_pat_…`), the same
// address and token the plugin's MCP server uses, and prints the tool's answer.

import { readFileSync } from 'node:fs'
import { basename } from 'node:path'

const USAGE = `usage: washi.mjs <tool> [key=value | key:=json | key=@file | key:=@file.json | key=@base64:file]… [--workspace <name>]
       washi.mjs upload <file> [contentType] [--workspace <name>]
  e.g. washi.mjs sheet_create title=Spec source=@spec.wsx parentId=<page id>
       washi.mjs sheet_replace id=<page id> title=Spec source=@spec.wsx baseVersion=<version>
       washi.mjs db_mutate mutation:=@rows.json
       washi.mjs upload brand/og-card.png --workspace DashiOS`

function fail(message) {
  process.stderr.write(`${message}\n`)
  process.exit(2)
}

/** One `key=…` argument as the value the tool takes. */
function argument(pair) {
  const json = pair.indexOf(':=')
  const plain = pair.indexOf('=')
  if (plain <= 0) fail(`not key=value: ${pair}\n${USAGE}`)
  if (json > 0 && json < plain) {
    const [key, raw] = [pair.slice(0, json), pair.slice(json + 2)]
    const text = raw.startsWith('@') ? readFileSync(raw.slice(1), 'utf8') : raw
    try {
      return [key, JSON.parse(text)]
    } catch (error) {
      fail(`${key}: not JSON (${error.message})`)
    }
  }
  const [key, raw] = [pair.slice(0, plain), pair.slice(plain + 1)]
  if (raw.startsWith('@base64:')) return [key, readFileSync(raw.slice(8)).toString('base64')]
  if (raw.startsWith('@')) return [key, readFileSync(raw.slice(1), 'utf8')]
  return [key, raw]
}

/** `--workspace <name>` taken out of the arguments, wherever it stands. */
function workspaceOf(argv) {
  const at = argv.indexOf('--workspace')
  if (at === -1) return { workspace: undefined, rest: argv }
  const workspace = argv[at + 1]
  if (!workspace) fail(`--workspace needs a name or an id\n${USAGE}`)
  return { workspace, rest: [...argv.slice(0, at), ...argv.slice(at + 2)] }
}

function call(argv, workspace) {
  const [tool, ...rest] = argv
  if (!tool || tool === '-h' || tool === '--help') fail(USAGE)
  const args = Object.fromEntries(rest.map(argument))
  return { name: tool, arguments: workspace ? { ...args, workspace } : args }
}

/** A JSON answer, or the one `data:` event a server that streams sends. */
async function answerOf(response) {
  const text = await response.text()
  if (!(response.headers.get('content-type') ?? '').includes('text/event-stream')) {
    return JSON.parse(text)
  }
  const data = text
    .split('\n')
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trim())
    .pop()
  return JSON.parse(data ?? 'null')
}

// The plugin's own settings, read here as its MCP server reads them — not a build input.
const { WASHI_MCP_URL: url, WASHI_TOKEN: token } = process.env
if (!url) fail('set WASHI_MCP_URL to your Washi MCP address (…/mcp/<workspace id>)')
if (!token) fail('set WASHI_TOKEN to a Washi access token (Settings → Account → Agents)')

/** One tool call over MCP: its result, or null when the server has no such tool. */
async function callTool(params) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
      accept: 'application/json, text/event-stream',
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params }),
  })
  if (!response.ok) fail(`Washi answered ${response.status}: ${await response.text()}`)
  const answer = await answerOf(response)
  const result = answer?.result ?? {}
  const said = (result.content ?? []).map((part) => part.text ?? '').join('\n')
  // An older server: the SDK says so as an error or as an errored result, in these words.
  if (/tool \S+ not found/i.test(`${answer?.error?.message ?? ''} ${said}`)) return null
  if (answer?.error) fail(answer.error.message ?? JSON.stringify(answer.error))
  return { said, isError: Boolean(result.isError) }
}

function done({ said, isError }) {
  process.stdout.write(`${said}\n`)
  process.exit(isError ? 1 : 0)
}

/**
 * A file uploaded without its bytes passing through any tool call: file_upload_url answers a
 * one-time URL, and the bytes go there in one PUT. A server without that tool takes base64.
 */
async function upload(argv, workspace) {
  const [file, contentType] = argv
  if (!file) fail(USAGE)
  const bytes = readFileSync(file)
  const at = workspace ? { workspace } : {}
  const typed = contentType ? { contentType } : {}
  const ticket = await callTool({
    name: 'file_upload_url',
    arguments: { filename: basename(file), bytes: bytes.byteLength, ...typed, ...at },
  })
  if (!ticket) {
    return done(
      (await callTool({
        name: 'file_upload',
        arguments: { base64: bytes.toString('base64'), filename: basename(file), ...typed, ...at },
      })) ?? fail('this server takes no uploads'),
    )
  }
  if (ticket.isError) return done(ticket)
  const { url: target } = JSON.parse(ticket.said)
  const put = await fetch(target, { method: 'PUT', body: bytes })
  done({ said: await put.text(), isError: !put.ok })
}

const { workspace, rest } = workspaceOf(process.argv.slice(2))
if (rest[0] === 'upload') await upload(rest.slice(1), workspace)
else done((await callTool(call(rest, workspace))) ?? fail(`Washi has no tool "${rest[0]}"`))
