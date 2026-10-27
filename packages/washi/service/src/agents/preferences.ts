import { type EnabledModel, enabledModelSchema } from '@washi/domain'
import { getAppMeta, setAppMeta, type Workspace } from '@washi/repository'
import type { Effort, ResumeBy } from './lib'
import { DEFAULT_EFFORT_KEY, EFFORTS, ENABLED_MODELS_KEY, RESUME_BY, RESUME_BY_KEY } from './lib'

/** The workspace's standing choices that are not the stop: who resumes, how hard Washi thinks. */
export class AgentPreferences {
  private readonly ws: Workspace

  constructor(ws: Workspace) {
    this.ws = ws
  }

  resumeBy(): ResumeBy {
    const stored = getAppMeta(this.ws, RESUME_BY_KEY)
    return RESUME_BY.find((each) => each === stored) ?? 'anyone'
  }

  setResumeBy(resumeBy: ResumeBy): ResumeBy {
    setAppMeta(this.ws, RESUME_BY_KEY, resumeBy)
    return resumeBy
  }

  effort(): Effort {
    const stored = getAppMeta(this.ws, DEFAULT_EFFORT_KEY)
    return EFFORTS.find((each) => each === stored) ?? 'balanced'
  }

  setEffort(effort: Effort): Effort {
    setAppMeta(this.ws, DEFAULT_EFFORT_KEY, effort)
    return effort
  }

  /** Null until someone picks: the composer then offers the recommended three. */
  enabledModels(): EnabledModel[] | null {
    const stored = getAppMeta(this.ws, ENABLED_MODELS_KEY)
    if (!stored) return null
    const parsed = enabledModelSchema.array().safeParse(JSON.parse(stored))
    return parsed.success ? parsed.data : null
  }

  setEnabledModels(models: EnabledModel[] | null): EnabledModel[] | null {
    setAppMeta(this.ws, ENABLED_MODELS_KEY, models ? JSON.stringify(models) : '')
    return models
  }
}
