export const THEME_KEY = 'washi.theme'

/** Runs in the head before the first paint, on every route: a hard load never flashes paper. */
export const THEME_SCRIPT = `try{if(localStorage.getItem('${THEME_KEY}')==='dark')document.documentElement.classList.add('dark')}catch(e){}`
