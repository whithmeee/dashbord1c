import { CircleHelp } from 'lucide-react'
import { Dialog, DialogContent, DialogFooter } from '../../../shared/ui/dialog'
import type { DataQualityIssue } from '../domain/data-quality'
import { resolutionOf, type CounterpartyChange } from '../domain/data-quality-resolution'
import { DataQualityFixForm } from './data-quality-fix-form'
import { categoryLabels, severityLabels } from './data-quality-labels'
import './data-quality-resolution.css'

export function DataQualityIssueDialog({
  issue,
  onClose,
  onFix,
}: {
  issue?: DataQualityIssue
  onClose: () => void
  onFix: (objectId: string, change: CounterpartyChange) => Promise<void>
}) {
  const resolution = issue ? resolutionOf(issue) : undefined

  return (
    <Dialog open={issue !== undefined} onOpenChange={(open) => { if (!open) onClose() }}>
      {issue && (
        <DialogContent
          title={issue.title}
          description="Подробности проблемы в данных 1С"
          testId="data-quality-issue-dialog"
        >
          <div className="data-quality-dialog-body">
            <span className={`data-quality-severity data-quality-severity-${issue.severity}`}>
              {severityLabels[issue.severity]}
            </span>
            <p>{issue.message}</p>
            <dl>
              <div><dt>Категория</dt><dd>{categoryLabels[issue.category]}</dd></div>
              <div><dt>Объект 1С</dt><dd>{issue.entity}</dd></div>
              <div><dt>Идентификатор</dt><dd>{issue.objectId}</dd></div>
              <div><dt>Правило</dt><dd>{issue.rule}</dd></div>
            </dl>
            {resolution?.kind === 'advice' && (
              <div className="data-quality-advice" data-testid="data-quality-advice">
                <CircleHelp size={18} />
                <p>{resolution.advice}</p>
              </div>
            )}
            {resolution?.kind === 'edit' && (
              <DataQualityFixForm
                issue={issue}
                resolution={resolution}
                onFix={async (change) => {
                  await onFix(issue.objectId, change)
                  onClose()
                }}
              />
            )}
          </div>
          <DialogFooter>
            <button className="cabinet-button cabinet-button-primary" type="button" onClick={onClose}>Закрыть</button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  )
}
