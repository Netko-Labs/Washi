import { IconChevronDown } from '@tabler/icons-react'
import { CONTENTS_ID, type LearnNavProps, spiedAnchors, useActiveAnchor, useContents } from '../lib'
import { LearnNavList } from './learn-nav-list'

/** Search and contents; under `md` the contents fold behind a button so the page leads. */
export function LearnNav(props: LearnNavProps) {
  const contents = useContents()
  const active = useActiveAnchor(spiedAnchors(props.groups, props.recipes))

  return (
    <nav ref={contents.root} aria-label="Contents" className="relative">
      <div className="flex gap-2">
        <input
          type="search"
          value={props.query}
          onChange={(event) => {
            props.onQuery(event.currentTarget.value)
            contents.open()
          }}
          placeholder="Find a primitive or recipe"
          aria-label="Find a primitive or recipe"
          className="h-9 min-w-0 flex-1 rounded-lg border border-border bg-card px-3 text-[13px] outline-none focus:border-ring"
        />
        <button
          type="button"
          aria-expanded={contents.isOpen}
          aria-controls={CONTENTS_ID}
          onClick={contents.toggle}
          className="flex h-9 shrink-0 items-center gap-1 rounded-lg border border-border bg-card px-3 text-[13px] hover:bg-accent md:hidden"
        >
          Contents
          <IconChevronDown
            className={`size-3.5 transition-transform ${contents.isOpen ? 'rotate-180' : ''}`}
          />
        </button>
      </div>
      <div
        id={CONTENTS_ID}
        className={`${contents.isOpen ? 'block' : 'hidden'} absolute inset-x-0 top-full mt-2 max-h-[70dvh] overflow-y-auto rounded-xl border border-border bg-popover p-2 shadow-[0_16px_48px_rgb(0_0_0/0.22)] md:static md:mt-4 md:block md:max-h-none md:overflow-visible md:rounded-none md:border-0 md:bg-transparent md:p-0 md:shadow-none`}
      >
        <LearnNavList {...props} active={active} onPick={contents.close} />
      </div>
    </nav>
  )
}
