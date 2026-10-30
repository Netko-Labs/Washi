import { CODE_LIMITS, type PagePackageSet } from '@washi/domain'
import { WIDGET_FRAME } from '@washi/paper/registry'
import { pageModule, parse } from '@washi/wsx'
import { bundle, failure } from './compile'
import type { BundleTarget, CompiledPage, PageSource, WidgetReach } from './types'
import { KB } from './values'

/** The widget's component mounted with real React in its frame; `washi` is the frame's own. */
const WIDGET_TARGET: BundleTarget = {
  entry: `import { mount } from 'washi'\nimport { __widget } from 'washi:self'\nmount(__widget)`,
  washi: WIDGET_FRAME,
  react: true,
  minify: true,
}

/**
 * One of a page's own components bundled for a widget's frame (D113): the page's imports, React
 * and the frame's `washi`, from the same vetted list a page runs on. `network` is what its frame may
 * reach — none unless an admin or owner listed hosts (D118).
 */
export async function compileWidget(
  source: string,
  component: string,
  read: PageSource,
  packages: PagePackageSet | null = null,
  reach: WidgetReach = { maxKb: CODE_LIMITS.widgetBundleKb, network: [] },
): Promise<CompiledPage> {
  try {
    if (!parse(source).prelude?.components.includes(component)) {
      return failure(`${component} is not one of this page's components`)
    }
    const module = `${pageModule(source)}\nexport { ${component} as __widget }`
    const key = ['widget', component, source]
    const compiled = await bundle(module, read, WIDGET_TARGET, key, packages, reach.maxKb * KB)
    return compiled.ok ? { ...compiled, network: reach.network } : compiled
  } catch (error) {
    return failure(error)
  }
}
