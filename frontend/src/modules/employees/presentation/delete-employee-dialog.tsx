import { AlertTriangle } from 'lucide-react'
import type { Employee } from '../domain/employee'

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
    <div className="employees-overlay" role="presentation">
      <div className="employees-modal employees-confirm" role="alertdialog" aria-modal="true" aria-labelledby="delete-employee-title">
        <AlertTriangle size={24} aria-hidden="true" />
        <h3 id="delete-employee-title">Удалить сотрудника?</h3>
        <p>Сотрудник «{employee.name}» больше не сможет войти в кабинет.</p>
        <footer className="employees-modal-actions">
          <button className="cabinet-button" type="button" onClick={onClose}>Отмена</button>
          <button className="cabinet-button employees-danger-button" type="button" disabled={pending} onClick={onConfirm}>
            {pending ? 'Удаляем…' : 'Удалить'}
          </button>
        </footer>
      </div>
    </div>
  )
}
