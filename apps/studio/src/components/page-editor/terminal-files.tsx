import { IconFile, IconPaperclip, IconX } from '@tabler/icons-react'
import { sizeLabel, type TerminalFilesProps, useTerminalFiles } from './lib'

const ITEM =
  'flex h-8 w-full items-center gap-2 rounded-lg px-2 text-left text-[13px] hover:bg-black/5 dark:hover:bg-white/10'

/** What a Terminal's program may open: each file by the path it reads, and a way to add one. */
export function TerminalFiles({ block }: TerminalFilesProps) {
  const terminal = useTerminalFiles(block)

  return (
    <div
      ref={terminal.root}
      className="relative mr-auto flex flex-wrap items-center gap-1 font-sans text-[12px] text-muted-foreground"
    >
      {Object.keys(terminal.files).map((path) => (
        <span
          key={path}
          className="flex h-7 items-center gap-1 rounded-lg bg-black/5 pr-1 pl-2 dark:bg-white/10"
        >
          <IconFile className="size-3.5" />
          {path}
          <button
            type="button"
            aria-label={`Take ${path} off this terminal`}
            onClick={() => terminal.detach(path)}
            className="grid size-5 place-items-center rounded hover:bg-black/10 dark:hover:bg-white/15"
          >
            <IconX className="size-3" />
          </button>
        </span>
      ))}
      <button
        type="button"
        aria-expanded={terminal.isOpen}
        onClick={terminal.toggle}
        className="flex h-7 items-center gap-1.5 rounded-lg px-2 hover:bg-black/5 dark:hover:bg-white/10"
      >
        <IconPaperclip className="size-3.5" />
        Attach a file
      </button>
      {terminal.error && <span className="text-destructive">{terminal.error}</span>}
      {terminal.isOpen && (
        <div
          role="menu"
          className="absolute top-full left-0 z-30 mt-1 w-[280px] rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-[0_16px_48px_rgb(0_0_0/0.18)]"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => void terminal.upload()}
            className={ITEM}
          >
            Upload a file…
          </button>
          <div className="my-1 h-px bg-border" />
          <div className="px-2 pt-1 pb-1 font-semibold text-[11px] text-muted-foreground uppercase tracking-[0.06em]">
            Already stored
          </div>
          {terminal.recent === null && <p className="px-2 py-1.5 text-[12px]">Loading…</p>}
          {terminal.recent?.length === 0 && (
            <p className="px-2 py-1.5 text-[12px]">Nothing uploaded yet.</p>
          )}
          {terminal.recent?.map((upload) => (
            <button
              key={upload.id}
              type="button"
              role="menuitem"
              onClick={() => terminal.attach(upload)}
              className={ITEM}
            >
              <span className="min-w-0 flex-1 truncate">{upload.name}</span>
              <span className="text-[11px] text-muted-foreground">{sizeLabel(upload.size)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
