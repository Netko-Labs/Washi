export type StorageField =
  | 'endpoint'
  | 'region'
  | 'bucket'
  | 'prefix'
  | 'accessKeyId'
  | 'secretAccessKey'

export type StorageDraft = Record<StorageField, string>

export interface StorageView {
  endpoint: string
  region: string
  bucket: string
  prefix: string | null
  accessKeyLast4: string
  updatedAt: string
  updatedBy: string | null
}

export interface StorageState {
  isAvailable: boolean
  isServerDefault: boolean
  config: StorageView | null
}

/** idle · testing · passed · saving, or the refusal in words. */
export type StorageFormStatus = 'idle' | 'testing' | 'passed' | 'saving' | { refusal: string }

export interface StorageFieldSpec {
  key: StorageField
  label: string
  placeholder: string
  isSecret?: boolean
}

export interface StorageFormProps {
  isReplacing: boolean
  onSaved: () => Promise<unknown>
}

export interface StorageRemoveProps {
  onRemove: () => Promise<boolean>
}

export interface StorageSummaryProps {
  state: StorageState
  canEdit: boolean
  onRemove: () => Promise<boolean>
}
