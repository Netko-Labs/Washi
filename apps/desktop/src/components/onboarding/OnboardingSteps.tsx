import { IconCloudOff, IconDatabase, IconFolder, IconServer, IconUsers } from '@tabler/icons-react'
import { AgentMascot, VAULT_TOPIC_ORDER, VaultIcon } from '@washi/ui'
import { HeroDone, HeroSync, HeroVaults, HeroWelcome, Toggle } from './OnboardingArt'
import { ChoiceCard, ConsentCard } from './OnboardingCards'
import type { StepProps } from './types'

const VAULT_CHOICES = VAULT_TOPIC_ORDER

const PITCH_ROWS = [
  {
    icon: IconDatabase,
    title: 'Offline first',
    desc: 'One workspace, one database on this machine. No account required.',
  },
  {
    icon: IconServer,
    title: 'Self-hosted sync',
    desc: 'Point Washi at a server you run to sync devices and invite people.',
  },
  {
    icon: IconUsers,
    title: 'Share on your terms',
    desc: 'Invite people per workspace, or publish a read-only link.',
  },
]

export function StepLocalFirst() {
  return (
    <div className="flex animate-in flex-col gap-[22px] fade-in duration-200">
      <HeroWelcome />
      <div>
        <h1 className="mb-2 font-semibold text-[30px] leading-[1.15] tracking-[-0.025em]">
          Everything stays on your machine
        </h1>
        <p className="text-[15px] text-muted-foreground leading-[1.65]">
          Washi keeps your pages in a database on this machine. Sync, sharing and agents are
          optional — nothing leaves this device until you say so.
        </p>
      </div>
      <div className="flex flex-col gap-0.5">
        {PITCH_ROWS.map(({ icon: Icon, title, desc }, i) => (
          <div
            key={title}
            className={`flex items-start gap-3 border-border border-t py-3 ${i === PITCH_ROWS.length - 1 ? 'border-b' : ''}`}
          >
            <Icon className="mt-px size-[18px] shrink-0 text-muted-foreground" />
            <span>
              <span className="block font-medium text-[13.5px]">{title}</span>
              <span className="block text-[12.5px] text-muted-foreground">{desc}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function StepVault({ draft, patch }: StepProps) {
  const slug = (draft.name || 'vault').toLowerCase().replace(/[^a-z0-9]+/g, '-')
  return (
    <div className="flex animate-in flex-col gap-[22px] fade-in duration-200">
      <HeroVaults />
      <div>
        <h1 className="mb-2 font-semibold text-[26px] leading-[1.2] tracking-[-0.02em]">
          Make your first workspace
        </h1>
        <p className="text-[14.5px] text-muted-foreground leading-[1.6]">
          One workspace is one database. You can add more later — each keeps its own settings.
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="font-medium text-xs">Vault name</span>
        <input
          value={draft.name}
          onChange={(e) => patch({ name: e.target.value })}
          placeholder="Personal vault"
          className="h-[38px] rounded-[10px] border border-input bg-card px-3 text-[14px] text-foreground outline-none focus:border-muted-foreground"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="font-medium text-xs">Folder on disk</span>
        <div className="flex h-[38px] items-center gap-2 rounded-[10px] border border-input bg-muted px-3 font-mono text-[13px] text-muted-foreground">
          <IconFolder className="size-[15px] shrink-0" />
          <span className="min-w-0 flex-1 truncate">~/Washi/{slug}</span>
          <span className="cursor-pointer font-medium font-sans text-foreground">Choose…</span>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <span className="font-medium text-xs">Vault icon</span>
        <div className="flex flex-wrap gap-2.5">
          {VAULT_CHOICES.map((topic) => (
            <button
              key={topic}
              type="button"
              onClick={() => patch({ vault: topic })}
              className={`rounded-[14px] border-2 p-[3px] leading-none ${draft.vault === topic ? 'border-foreground' : 'border-transparent'}`}
            >
              <VaultIcon topic={topic} size={46} />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export function StepSync({ draft, patch }: StepProps) {
  const server = draft.sync === 'server'
  return (
    <div className="flex animate-in flex-col gap-5 fade-in duration-200">
      <HeroSync server={server} />
      <div>
        <h1 className="mb-2 font-semibold text-[26px] leading-[1.2] tracking-[-0.02em]">
          Sync, if you want it
        </h1>
        <p className="text-[14.5px] text-muted-foreground leading-[1.6]">
          Washi never talks to a cloud we run. Sync goes to a server you host.
        </p>
      </div>
      <div className="flex flex-col gap-2.5">
        <ChoiceCard
          selected={!server}
          onClick={() => patch({ sync: 'offline' })}
          icon={IconCloudOff}
          title="Stay offline"
          desc="This device only. Agents still run locally against your files."
        />
        <ChoiceCard
          selected={server}
          onClick={() => patch({ sync: 'server' })}
          icon={IconServer}
          title="Connect a self-hosted server"
          desc="Sync devices and collaborate with people you invite."
        />
      </div>
      {server && (
        <div className="flex animate-in flex-col gap-2.5 rounded-xl border border-border bg-card px-4 py-3.5 fade-in duration-150">
          <div className="flex flex-col gap-1.5">
            <span className="font-medium text-xs">Server address</span>
            <input
              value={draft.server}
              onChange={(e) => patch({ server: e.target.value })}
              placeholder="https://sync.example.com"
              className="h-9 rounded-[10px] border border-input bg-background px-[11px] font-mono text-[13px] text-foreground outline-none focus:border-muted-foreground"
            />
          </div>
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <span className="size-1.5 rounded-full bg-[#16a34a]" />
            Reachable · Washi Sync v1.4 · 2 devices already paired
          </div>
          <div className="flex items-center gap-2.5 border-border border-t pt-2">
            <span className="flex-1 text-[12.5px]">
              End-to-end encrypt vault contents
              <span className="block text-[11.5px] text-muted-foreground">
                The server stores ciphertext it can't read
              </span>
            </span>
            <Toggle on={draft.e2e} onClick={() => patch({ e2e: !draft.e2e })} />
          </div>
        </div>
      )}
    </div>
  )
}

export function StepWrapUp({ draft, patch }: StepProps) {
  return (
    <div className="flex animate-in flex-col gap-5 fade-in duration-200">
      <HeroDone />
      <div>
        <h1 className="mb-2 font-semibold text-[26px] leading-[1.2] tracking-[-0.02em]">
          You're set up
        </h1>
        <p className="text-[14.5px] text-muted-foreground leading-[1.6]">
          One last choice before your vault opens.
        </p>
      </div>
      {draft.sync === 'offline' && (
        <div className="flex gap-3 rounded-xl border border-border border-dashed bg-muted p-4">
          <IconUsers className="mt-px size-[18px] shrink-0 text-muted-foreground" />
          <span className="text-[13px] text-muted-foreground leading-[1.6]">
            Sharing and multiplayer editing need a sync server. Your vault works fully without one —
            turn sync on any time in Settings, and everything you've written comes with you.
          </span>
        </div>
      )}
      <ConsentCard
        art={<AgentMascot state="writing" size={44} />}
        title="Let Washi read this vault"
        desc="Runs locally, suggests edits, never writes without your accept"
        on={draft.agent}
        onToggle={() => patch({ agent: !draft.agent })}
      />
      <ConsentCard
        art={<AgentMascot state="suggesting" size={44} />}
        title="Gentle nudges"
        desc="A tap on the shoulder when notes go stale — weekly at most"
        on={draft.nudge}
        onToggle={() => patch({ nudge: !draft.nudge })}
      />
    </div>
  )
}
