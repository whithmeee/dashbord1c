import { describe, expect, it } from 'vitest'
import {
  InvalidChatError,
  mapChat,
  mapChats,
  mapMessage,
} from './chat-mapper'

const chat = {
  id: 4,
  integration_id: 9,
  integration: {
    id: 9,
    name: 'Основная база',
    config_name: 'Бухгалтерия',
    is_active: true,
    status: 'active',
  },
  title: 'Продажи',
  created_at: '2026-11-05T12:00:00Z',
}

const widget = {
  title: 'Топ покупателей',
  columns: [
    { key: 'name', label: 'Покупатель', type: 'string' },
    { key: 'revenue', label: 'Выручка, ₽', type: 'money' },
  ],
  rows: [{ name: 'ООО Ромашка', revenue: 125000.5 }],
  totals: { name: 'Итого', revenue: 125000.5 },
}

describe('chat mappers', () => {
  it('maps an unavailable widget whose empty totals arrive as an empty list', () => {
    const result = mapMessage({
      id: 7,
      chat_id: 4,
      integration_id: 9,
      role: 'assistant',
      content: 'Денежные показатели недоступны.',
      widget: { ...widget, columns: [], rows: [], totals: [] },
      created_at: '2026-11-05T12:01:00Z',
    })

    expect(result.widget?.totals).toEqual({})
  })

  it('keeps a chat whose database has no configuration name', () => {
    const result = mapChat({
      ...chat,
      integration: { ...chat.integration, config_name: null },
    })

    expect(result.integration?.configName).toBeNull()
  })

  it('maps chat collections and preserves safe integration details', () => {
    expect(mapChats([chat])).toEqual([{
      id: 4,
      integrationId: 9,
      integration: {
        id: 9,
        name: 'Основная база',
        configName: 'Бухгалтерия',
        isActive: true,
        status: 'active',
      },
      title: 'Продажи',
      createdAt: '2026-11-05T12:00:00Z',
    }])
    expect(mapChats([])).toEqual([])
  })

  it('maps a plain chat without an embedded integration', () => {
    expect(mapChat({ ...chat, integration: null }).integration).toBeUndefined()
  })

  it('maps a structured widget and a null widget', () => {
    expect(mapMessage({
      id: 10,
      chat_id: 4,
      integration_id: 9,
      role: 'assistant',
      content: '- Готово',
      widget,
      created_at: '2026-11-05T12:02:00Z',
    }).widget).toEqual(widget)
    expect(mapMessage({
      id: 11,
      chat_id: 4,
      integration_id: 9,
      role: 'user',
      content: 'Покажи продажи',
      widget: null,
      created_at: '2026-11-05T12:03:00Z',
    }).widget).toBeNull()
  })

  it('rejects a response without required fields', () => {
    expect(() => mapMessage({ ...chat, role: 'assistant' })).toThrow(InvalidChatError)
  })
})
