import type { Workspace } from '@washi/repository'
import { z } from 'zod'
import { MAX_MAX_CHARS, MIN_MAX_CHARS, setAgentGuide, workspaceContext } from '../context'
import { capability } from './define'
import type { Capability, CapabilityContext } from './types'
import { CONTEXT_GET_DESCRIPTION, GUIDE_SET_DESCRIPTION } from './values'

/**
 * A workspace read in one call, and the page agents read first (D135) — MCP's: an outside agent
 * starts cold, Washi's own turns already know where they are.
 */
export function contextCapabilities(
  ws: Workspace,
  context: CapabilityContext,
  workspaceName?: string,
  isSteward = false,
): Capability[] {
  return [
    {
      ...capability(
        'context_get',
        CONTEXT_GET_DESCRIPTION,
        {
          root: z.string().min(1).optional().describe('A page id: only it and the pages under it'),
          depth: z
            .number()
            .int()
            .min(0)
            .max(32)
            .optional()
            .describe('Levels under the root (or the top) to read; 0 is that page alone'),
          tables: z
            .array(z.string().min(1))
            .max(32)
            .optional()
            .describe('Tables whose open rows to list; default every table with a status column'),
          maxChars: z
            .number()
            .int()
            .min(MIN_MAX_CHARS)
            .max(MAX_MAX_CHARS)
            .optional()
            .describe('The most characters to answer; default 15000'),
        },
        true,
        (input) => workspaceContext(ws, context.viewer, { ...input, workspaceName }),
      ),
      answersText: true,
    },
    capability(
      'guide_set',
      GUIDE_SET_DESCRIPTION,
      {
        id: z
          .string()
          .min(1)
          .nullable()
          .describe('The page to make the agent guide, or null to have none'),
      },
      false,
      ({ id }) => ({ guide: setAgentGuide(ws, id, context.viewer, isSteward) }),
    ),
  ]
}
