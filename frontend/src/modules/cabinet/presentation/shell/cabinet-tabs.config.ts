import { LayoutDashboard, Database, Users } from 'lucide-react'
export const cabinetTabs = [
  { id: 'overview', label: 'Главная', icon: LayoutDashboard },
  { id: 'integrations', label: 'Синхронизация с 1С', icon: Database },
  { id: 'team', label: 'Пользователи и Права', icon: Users },
] as const
