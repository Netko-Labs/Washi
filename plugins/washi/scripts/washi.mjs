#!/usr/bin/env -S bun
// Calls one Washi MCP tool with arguments read from local files, so a large page or a picture
// never has to pass through the agent's own tool call. Runs under bun or node (18+), no packages.
//
//   washi.mjs <tool> key=value key:=<json> key=@<file> key:=@<json file> key=@base64:<file>
//   washi.mjs upload <file> [contentType]          (file_upload with the file's bytes)
//
// It speaks to WASHI_MCP_URL with WASHI_TOKEN (a personal access token, `washi_pat_…`), the same
// address and token the plugin's MCP server uses, and prints the tool's answer.

import { readFileSync } from 'node:fs'
import { basename } from 'node:path'

const USAGE = `usage: washi.mjs <tool> [key=value | key:=json | key=@file | key:=@file.json | key=@base64:file]…
       washi.mjs upload <file> [contentType]
  e.g. washi.mjs sheet_create title=Spec source=@spec.wsx parentId=<page id>
       washi.mjs sheet_replace id=<page id> title=Spec source=@spec.wsx baseVersion=<version>
       washi.mjs db_mutate mutation:=@rows.json
       washi.mjs upload brand/og-card.png`

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

function call(argv) {
  const [tool, ...rest] = argv
  if (!tool || tool === '-h' || tool === '--help') fail(USAGE)
  if (tool === 'upload') {
    const [file, contentType] = rest
    if (!file) fail(USAGE)
    const args = { base64: readFileSync(file).toString('base64'), filename: basename(file) }
    return { name: 'file_upload', arguments: contentType ? { ...args, contentType } : args }
  }
  return { name: tool, arguments: Object.fromEntries(rest.map(argument)) }
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

const response = await fetch(url, {
  method: 'POST',
  headers: {
    authorization: `Bearer ${token}`,
    'content-type': 'application/json',
    accept: 'application/json, text/event-stream',
  },
  body: JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: call(process.argv.slice(2)),
  }),
})
if (!response.ok) fail(`Washi answered ${response.status}: ${await response.text()}`)
const answer = await answerOf(response)
if (answer?.error) fail(answer.error.message ?? JSON.stringify(answer.error))
const result = answer?.result ?? {}
const said = (result.content ?? []).map((part) => part.text ?? '').join('\n')
process.stdout.write(`${said}\n`)
process.exit(result.isError ? 1 : 0)
