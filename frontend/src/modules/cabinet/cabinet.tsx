import { getDemoCabinet } from './adapters/demo/demo-cabinet'
import { CabinetPage } from './presentation/shell/cabinet-page'

const demoCabinet = getDemoCabinet()

export function Cabinet({ onOpenChat }: { onOpenChat: () => void }) {
  return <CabinetPage overview={demoCabinet} onOpenChat={onOpenChat} />
}
