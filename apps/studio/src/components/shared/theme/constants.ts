export const THEME_KEY = 'washi.theme'

export const DARK_QUERY = '(prefers-color-scheme: dark)'

/** Where a page's read-only link lives: a visitor there who never chose follows their device. */
export const SHARED_PREFIX = '/s/'

/**
 * Runs in the head before the first paint, on every route: a hard load never flashes paper. A
 * shared link's visitor with no stored choice reads as `system`, so a dark device opens it dark.
 */
export const THEME_SCRIPT = `try{var t=localStorage.getItem('${THEME_KEY}');if(t===null&&location.pathname.indexOf('${SHARED_PREFIX}')===0)t='system';if(t==='dark'||(t==='system'&&matchMedia('${DARK_QUERY}').matches))document.documentElement.classList.add('dark')}catch(e){}`
