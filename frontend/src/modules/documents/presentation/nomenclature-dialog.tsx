import { useEffect, useState } from 'react'
import { AlertCircle, LoaderCircle } from 'lucide-react'
import { describeError } from '../../../shared/api'
import { Dialog, DialogContent } from '../../../shared/ui/dialog'
import type { NomenclatureOptions, NomenclatureSpec } from '../domain/nomenclature'
import { NomenclatureForm } from './nomenclature-form'
import './nomenclature-dialog.css'

type LoadState =
  | { readonly status: 'loading' }
  | { readonly status: 'error'; readonly message: string }
  | { readonly status: 'ready'; readonly options: NomenclatureOptions }

export function NomenclatureDialog({ documentId, open, missing, busy, load, onCreate, onClose }: {
  documentId: number
  open: boolean
  missing: readonly number[]
  busy: boolean
  load: (id: number, signal: AbortSignal) => Promise<NomenclatureOptions>
  onCreate: (specs: readonly NomenclatureSpec[]) => void
  onClose: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose() }}>
      {open && (
        <DialogContent
          size="wide"
          title="Создать номенклатуру в 1С"
          description="Проверьте вид, единицу измерения и ставку НДС. Эти значения попадут в справочник вашей базы."
          testId="nomenclature-dialog"
        >
          <NomenclatureLoader documentId={documentId} missing={missing} busy={busy} load={load} onCreate={onCreate} onClose={onClose} />
        </DialogContent>
      )}
    </Dialog>
  )
}

function NomenclatureLoader({ documentId, missing, busy, load, onCreate, onClose }: {
  documentId: number
  missing: readonly number[]
  busy: boolean
  load: (id: number, signal: AbortSignal) => Promise<NomenclatureOptions>
  onCreate: (specs: readonly NomenclatureSpec[]) => void
  onClose: () => void
}) {
  const [state, setState] = useState<LoadState>({ status: 'loading' })

  useEffect(() => {
    const controller = new AbortController()
    load(documentId, controller.signal)
      .then((options) => setState({ status: 'ready', options }))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setState({ status: 'error', message: describeError(error) })
      })
    return () => controller.abort()
  }, [documentId, load])

  if (state.status === 'loading') {
    return <p className="nomenclature-state"><LoaderCircle className="documents-spinner" size={18} />Загружаем справочники 1С…</p>
  }
  if (state.status === 'error') {
    return <p className="nomenclature-state nomenclature-state-error" role="alert"><AlertCircle size={18} />{state.message}</p>
  }
  return <NomenclatureForm options={state.options} missing={missing} busy={busy} onCreate={onCreate} onClose={onClose} />
}
