import { AlertTriangle } from 'lucide-react'
import type { Employee } from '../domain/employee'
import { EmployeeDialog } from './employee-dialog'

export function DeleteEmployeeDialog({
  employee,
  pending,
  onConfirm,
  onClose,
}: {
  employee: Employee
  pending: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <EmployeeDialog
      title="Удалить сотрудника?"
      description={`Сотрудник «${employee.name}» больше не сможет войти в кабинет.`}
      role="alertdialog"
      onClose={onClose}
    >
      <div className="employees-modal employees-confirm">
        <AlertTriangle size={24} aria-hidden="true" />
        <footer className="employees-modal-actions">
          <button className="cabinet-button" type="button" onClick={onClose}>Отмена</button>
          <button className="cabinet-button employees-danger-button" type="button" disabled={pending} onClick={onConfirm}>
            {pending ? 'Удаляем…' : 'Удалить'}
          </button>
        </footer>
      </div>
    </EmployeeDialog>
  )
}
