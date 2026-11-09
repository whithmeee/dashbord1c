import { UserRound } from 'lucide-react'
import { getCabinetInitials, type CabinetViewer } from '../../domain/cabinet'
import './cabinet-viewer.css'

export function CabinetViewerIdentity({ viewer }: { viewer: CabinetViewer }) {
  return (
    <div className="cabinet-viewer" data-testid="cabinet-viewer">
      <span className="cabinet-viewer-avatar"><UserRound size={17} aria-hidden="true" /></span>
      <span>
        <small>Вы вошли как</small>
        <strong>{viewer.name}</strong>
        <em>{viewer.type === 'employee' ? viewer.position : 'Владелец компании'}</em>
      </span>
      <span className="cabinet-viewer-initials" aria-hidden="true">{getCabinetInitials(viewer.name)}</span>
    </div>
  )
}
