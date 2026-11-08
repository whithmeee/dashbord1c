import {
  Bot,
  ChartNoAxesCombined,
  House,
  MessagesSquare,
  ShieldCheck,
  Workflow,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type SidebarSection = {
  id: string
  label: string
  icon: LucideIcon
  ai?: boolean
}

export const sidebarSections = [
  { id: 'cabinet', label: 'Мой кабинет', icon: House, ai: false },
  { id: 'chat', label: 'Ассистент', icon: MessagesSquare, ai: true },
  { id: 'dashboards', label: 'Дашборды', icon: ChartNoAxesCombined, ai: false },
  { id: 'analytics', label: 'Аналитика', icon: ChartNoAxesCombined, ai: true },
  { id: 'automation', label: 'Автоматизация', icon: Workflow, ai: true },
  { id: 'agents', label: 'Агенты ИИ', icon: Bot, ai: true },
  { id: 'security', label: 'Безопасность', icon: ShieldCheck, ai: false },
] as const satisfies readonly SidebarSection[]

export type SidebarSectionId = (typeof sidebarSections)[number]['id']

export const demoSidebarConnection = {
  name: '1С:Бухгалтерия',
  connected: true,
}
