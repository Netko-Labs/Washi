import type { QuickJSWASMModule } from 'quickjs-emscripten-core'

let engine: Promise<QuickJSWASMModule> | null = null
let ready: QuickJSWASMModule | null = null

/** QuickJS for the server's scripts; a load that failed is not remembered. */
export function loadEngine(): Promise<QuickJSWASMModule> {
  if (!engine) {
    const loading = Promise.all([
      import('quickjs-emscripten-core'),
      import('@jitl/quickjs-singlefile-mjs-release-sync'),
    ]).then(([core, variant]) => core.newQuickJSWASMModuleFromVariant(variant.default))
    engine = loading
    // One handler pair: a failed load is forgotten, and no derived promise is left to reject unheard.
    loading.then(
      (module) => {
        ready = module
      },
      () => {
        if (engine === loading) engine = null
      },
    )
  }
  return engine
}

/** The engine if it has loaded — what a synchronous caller (a formula) may use; null until then. */
export function engineNow(): QuickJSWASMModule | null {
  if (!ready) void loadEngine()
  return ready
}
