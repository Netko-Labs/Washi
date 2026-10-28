import { IconUpload } from '@tabler/icons-react'
import { acceptFor } from '@washi/domain'
import { type UploadDropProps, useImageUpload } from './lib'

/** Drop or browse one picture; it lands in the files store and the page wears its key. */
export function UploadDrop({ hint, onPick }: UploadDropProps) {
  const upload = useImageUpload(onPick)

  return (
    <label
      className={`grid cursor-pointer justify-items-center gap-1.5 rounded-lg border border-border border-dashed bg-background px-3 py-5 text-center text-[12.5px] ${
        upload.busy ? 'opacity-60' : 'hover:border-primary'
      }`}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault()
        const file = event.dataTransfer.files[0]
        if (file && !upload.busy) void upload.upload(file)
      }}
    >
      <IconUpload className="size-5 text-muted-foreground" />
      <span className="font-semibold">{upload.busy ? 'Uploading…' : 'Drop a picture here'}</span>
      <span className="text-[11.5px] text-muted-foreground">{hint}</span>
      <span className="mt-1 rounded-lg border border-border bg-card px-2.5 py-1 text-[12px]">
        Browse…
      </span>
      <input
        type="file"
        accept={acceptFor('image')}
        className="sr-only"
        disabled={upload.busy}
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) void upload.upload(file)
        }}
      />
      {upload.error && <span className="text-[12px] text-destructive">{upload.error}</span>}
    </label>
  )
}
