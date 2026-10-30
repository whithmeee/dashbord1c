import {
  ChartNoAxesCombined,
  FileChartColumn,
  House,
  Inbox,
  MessagesSquare,
  ShieldCheck,
} from 'lucide-react'

export const sidebarSections = [
  { id: 'cabinet', label: 'Мой кабинет', icon: House },
  { id: 'chat', label: 'Чат', icon: MessagesSquare },
  { id: 'dashboards', label: 'Дашборды', icon: ChartNoAxesCombined },
  { id: 'reports', label: 'Свои отчёты', icon: FileChartColumn },
  { id: 'requests', label: 'Обращения', icon: Inbox },
  { id: 'security', label: 'Безопасность', icon: ShieldCheck },
] as const

export type SidebarSectionId = (typeof sidebarSections)[number]['id']

export const demoSidebarConnection = {
  name: '1С:Бухгалтерия',
  connected: true,
}
