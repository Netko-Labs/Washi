import type { StorageDraft, StorageFieldSpec } from './types'

export const STORAGE_FIELDS: readonly StorageFieldSpec[] = [
  { key: 'endpoint', label: 'Endpoint', placeholder: 'https://<account>.r2.cloudflarestorage.com' },
  { key: 'region', label: 'Region', placeholder: 'auto, or us-east-1' },
  { key: 'bucket', label: 'Bucket', placeholder: 'team-uploads' },
  { key: 'prefix', label: 'Folder in the bucket (optional)', placeholder: 'washi' },
  { key: 'accessKeyId', label: 'Access key ID', placeholder: 'AKIA…' },
  { key: 'secretAccessKey', label: 'Secret access key', placeholder: '••••••••', isSecret: true },
]

export const EMPTY_DRAFT: StorageDraft = {
  endpoint: '',
  region: '',
  bucket: '',
  prefix: '',
  accessKeyId: '',
  secretAccessKey: '',
}

export const STORAGE_COPY = {
  serverHint: 'Uploads live wherever this server keeps its files. Nothing to set up.',
  ownHint: 'New covers, icons and pictures go to this bucket.',
  stays: 'Switching never moves a file: each one stays where it landed, and still opens.',
  membersOnly: 'Only an owner or admin changes where uploads go.',
  formDesc:
    'Any S3-compatible storage: AWS S3, Cloudflare R2, Backblaze B2, MinIO. Save waits for a test that passes.',
  passed: 'It works: Washi wrote a test file, read it back and deleted it.',
  removeWarn:
    'New uploads go back to the server. What is in your bucket stays there, but Washi can no longer open it.',
} as const
