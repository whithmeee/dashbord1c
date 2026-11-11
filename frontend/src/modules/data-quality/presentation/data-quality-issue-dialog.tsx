import { Dialog, DialogContent, DialogFooter } from '../../../shared/ui/dialog'
import type { DataQualityIssue } from '../domain/data-quality'
import { categoryLabels, severityLabels } from './data-quality-labels'

export function DataQualityIssueDialog({
  issue,
  onClose,
}: {
  issue?: DataQualityIssue
  onClose: () => void
}) {
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
          </div>
          <DialogFooter>
            <button className="cabinet-button cabinet-button-primary" type="button" onClick={onClose}>Закрыть</button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  )
}
