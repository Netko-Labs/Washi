import { type SourceEditorProps, useCodeMirror, useSourceLoad, useSourceSave } from './lib'
import { SourceProblems } from './source-problems'

/** The page as WSX text. State, `expr`, `bind` and `action` are its hooks; nothing in it runs. */
export function SourceEditor({ sheet }: SourceEditorProps) {
  useSourceLoad(sheet)
  useSourceSave(sheet)
  const host = useCodeMirror()

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pt-2 pb-24 sm:px-8">
      <div ref={host} className="overflow-hidden rounded-xl border border-border bg-card py-1" />
      <SourceProblems />
    </div>
  )
}
