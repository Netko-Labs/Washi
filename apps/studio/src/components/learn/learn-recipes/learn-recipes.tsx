import { LearnSheet } from '../learn-sheet'
import { ANCHOR_OFFSET, anchorOf, type LearnRecipesProps, recipeAnchorOf } from '../lib'

/** Primitives that only make sense together, each a whole page you can copy. */
export function LearnRecipes({ recipes, query }: LearnRecipesProps) {
  if (recipes.length === 0) {
    return <p className="text-[14px] text-muted-foreground">No recipe matches “{query.trim()}”.</p>
  }

  return (
    <div className="space-y-10">
      {recipes.map((recipe) => (
        <article
          key={recipe.id}
          id={recipeAnchorOf(recipe.id)}
          className={`learn-recipe ${ANCHOR_OFFSET} space-y-3`}
        >
          <header>
            <h3 className="font-semibold text-[16px]">{recipe.title}</h3>
            <p className="text-[14px] text-muted-foreground">{recipe.why}</p>
            <p className="mt-1.5 flex flex-wrap gap-1.5 text-[12px]">
              {recipe.uses.map((name) => (
                <a
                  key={name}
                  href={`#${anchorOf(name)}`}
                  className="rounded-full bg-accent px-2 py-0.5 font-mono text-muted-foreground hover:text-foreground"
                >
                  {name}
                </a>
              ))}
            </p>
          </header>
          <LearnSheet source={recipe.source} open />
        </article>
      ))}
    </div>
  )
}
