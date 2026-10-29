import {
  LayoutDashboard,
  Database,
  Bot,
  Users,
  CalendarDays,
  Gem,
} from 'lucide-react'
export const cabinetTabs = [
  { id: 'overview', label: 'Обзор', icon: LayoutDashboard },
  { id: 'integrations', label: 'Интеграции', icon: Database },
  { id: 'telegram', label: 'Telegram-бот', icon: Bot },
  { id: 'team', label: 'Команда и права', icon: Users },
  { id: 'subscription', label: 'Подписка', icon: CalendarDays },
  { id: 'plan', label: 'Тариф', icon: Gem },
] as const
