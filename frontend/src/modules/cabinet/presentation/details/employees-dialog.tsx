import { UsersPage } from '../../../employees/presentation/users-page'
import { CabinetDialog } from './cabinet-dialog'

export function EmployeesDialog({ onClose }: { onClose: () => void }) {
  return (
    <CabinetDialog title="Активные пользователи" testId="employees-dialog" size="large" onClose={onClose}>
      <UsersPage canManage />
    </CabinetDialog>
  )
}
