import { Fragment } from 'react'
import {
  anchorOf,
  type LearnNavListProps,
  NAV_LINK,
  recipeAnchorOf,
  SEARCH_SUGGESTIONS,
  SECTIONS,
} from '../../lib'

export function LearnNavList({
  groups,
  recipes,
  query,
  onQuery,
  active,
  onPick,
}: LearnNavListProps) {
  const current = (id: string) => (active === id ? 'location' : undefined)

  return (
    <div className="space-y-4">
      {groups.length === 0 && recipes.length === 0 && (
        <p role="status" className="px-2 text-[13px] text-muted-foreground leading-relaxed">
          Nothing matches “{query.trim()}” — try{' '}
          {SEARCH_SUGGESTIONS.map((name, index) => (
            <Fragment key={name}>
              {index > 0 && ', '}
              <button
                type="button"
                onClick={() => onQuery(name)}
                className="text-foreground underline underline-offset-2"
              >
                {name}
              </button>
            </Fragment>
          ))}
          .
        </p>
      )}
      <ul>
        {SECTIONS.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              aria-current={current(section.id)}
              onClick={onPick}
              className={NAV_LINK}
            >
              {section.label}
            </a>
            {section.id === 'recipes' && recipes.length > 0 && (
              <ul className="ml-2 border-border border-l pl-1">
                {recipes.map((recipe) => (
                  <li key={recipe.id}>
                    <a
                      href={`#${recipeAnchorOf(recipe.id)}`}
                      aria-current={current(recipeAnchorOf(recipe.id))}
                      onClick={onPick}
                      className={NAV_LINK}
                    >
                      {recipe.title}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
      {groups.map((group) => (
        <div key={group.id}>
          <p className="px-2 pb-1 font-semibold text-[11px] text-muted-foreground uppercase tracking-wider">
            {group.label}
          </p>
          <ul>
            {group.names.map((name) => (
              <li key={name}>
                <a
                  href={`#${anchorOf(name)}`}
                  aria-current={current(anchorOf(name))}
                  onClick={onPick}
                  className={NAV_LINK}
                >
                  {name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
