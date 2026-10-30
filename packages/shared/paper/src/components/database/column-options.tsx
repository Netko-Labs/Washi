import {
  type ColumnPageProps,
  type OptionEdit,
  optionGroups,
  optionRemovalWords,
  tableLabel,
  useColumnChange,
  useOptionRemoval,
  walkMenu,
} from './lib'
import { OptionAdd } from './option-add'
import { OptionRow } from './option-row'

/** A choice property's options, each renamed in place or removed, more added; a status by group. */
export function ColumnOptions({ db, column, onBack }: ColumnPageProps) {
  const { status, run } = useColumnChange()
  const removal = useOptionRemoval(db.table, column, run)
  const label = tableLabel(column.name)
  const change = (edit: OptionEdit) =>
    void run({ kind: 'option', table: db.table, column: column.name, ...edit })

  return (
    <div className="wsx-db-panel" role="group" aria-label={`${label} options`} onKeyDown={walkMenu}>
      <div className="wsx-db-menu-back">
        <button type="button" className="wsx-db-ghost" aria-label="Back" onClick={onBack}>
          ‹
        </button>
        <span>{label} options</span>
      </div>
      {removal.asking ? (
        <div role="alertdialog" aria-label={`Remove ${removal.asking.option}`}>
          <p className="wsx-db-confirm">{optionRemovalWords(removal.asking)}</p>
          <div className="wsx-db-panel-foot">
            <span className="wsx-db-panel-hint" />
            {/* biome-ignore lint/a11y/noAutofocus: Cancel is the safe default here */}
            <button type="button" className="wsx-db-ghost" autoFocus onClick={removal.cancel}>
              Cancel
            </button>
            <button
              type="button"
              className="wsx-db-button"
              data-danger
              disabled={status.busy}
              onClick={() => void removal.confirm()}
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        optionGroups(column).map((group) => (
          <fieldset key={group.label ?? 'options'} className="wsx-db-option-group">
            {group.label && <legend className="wsx-db-panel-head">{group.label}</legend>}
            {group.options.map((option) => (
              <OptionRow
                key={option}
                option={option}
                busy={status.busy}
                onRename={(to) => change({ from: option, to })}
                onRemove={() => void removal.ask(option)}
              />
            ))}
            <OptionAdd
              label={group.label ? `Add to ${group.label}` : 'Add an option'}
              busy={status.busy}
              onAdd={(to) => change({ to, group: group.group })}
            />
          </fieldset>
        ))
      )}
      {status.error && (
        <p className="wsx-db-panel-error" role="alert">
          {status.error}
        </p>
      )}
    </div>
  )
}
