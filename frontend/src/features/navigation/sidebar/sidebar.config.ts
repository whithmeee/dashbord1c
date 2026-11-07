import {
  ChartNoAxesCombined,
  House,
  MessagesSquare,
} from 'lucide-react'

export const sidebarSections = [
  { id: 'cabinet', label: 'Мой кабинет', icon: House },
  { id: 'chat', label: 'Чат', icon: MessagesSquare },
  { id: 'dashboards', label: 'Дашборды', icon: ChartNoAxesCombined },
] as const

export type SidebarSectionId = (typeof sidebarSections)[number]['id']

export const demoSidebarConnection = {
  name: '1С:Бухгалтерия',
  connected: true,
}
