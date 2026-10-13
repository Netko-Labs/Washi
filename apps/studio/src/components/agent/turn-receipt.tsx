import { IconCheck } from '@tabler/icons-react'
import { receiptParts, type TurnReceiptProps } from './lib'

/** If Washi did it, it is in mono: every finished turn says where it ran and what it cost. */
export function TurnReceipt({ update }: TurnReceiptProps) {
  return (
    <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 font-mono text-[11px] text-muted-foreground">
      <IconCheck className="size-3 shrink-0" />
      {receiptParts(update).join(' · ')}
    </p>
  )
}
