import { useViewStore } from '@washi/ui'
import { useShallow } from 'zustand/react/shallow'

export function useAccount() {
  return useViewStore(useShallow((state) => ({ openTab: state.openTab, identity: state.identity })))
}
