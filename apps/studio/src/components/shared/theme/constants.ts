export const THEME_KEY = 'washi.theme'

export const DARK_QUERY = '(prefers-color-scheme: dark)'

/** Runs in the head before the first paint, on every route: a hard load never flashes paper. */
export const THEME_SCRIPT = `try{var t=localStorage.getItem('${THEME_KEY}');if(t==='dark'||(t==='system'&&matchMedia('${DARK_QUERY}').matches))document.documentElement.classList.add('dark')}catch(e){}`
