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
  screenLabel?: string
  icon: LucideIcon
  ai?: boolean
}

export const sidebarSections = [
  { id: 'cabinet', label: 'Мой кабинет', screenLabel: undefined, icon: House, ai: false },
  { id: 'chat', label: 'Ассистент', screenLabel: undefined, icon: MessagesSquare, ai: true },
  { id: 'dashboards', label: 'Аналитика', screenLabel: undefined, icon: ChartNoAxesCombined, ai: true },
  { id: 'automation', label: 'Автоматизация', screenLabel: undefined, icon: Workflow, ai: true },
  { id: 'agents', label: 'Агенты', screenLabel: 'Агенты ИИ', icon: Bot, ai: true },
  { id: 'security', label: 'Безопасность', screenLabel: undefined, icon: ShieldCheck, ai: false },
] as const satisfies readonly SidebarSection[]

export type SidebarSectionId = (typeof sidebarSections)[number]['id']

export const demoSidebarConnection = {
  name: '1С:Бухгалтерия',
  connected: true,
}
