import { describe, expect, it } from 'vitest'
import { ApiError } from '../../../shared/api'
import type { ChatMessage } from '../domain/chat'
import { getChatErrorMessage, mapChatMessagesToView } from './chat-view-model'

const message: ChatMessage = {
  id: 4,
  chatId: 2,
  integrationId: 7,
  role: 'assistant',
  content: 'Готово',
  widget: {
    title: 'Продажи',
    columns: [{ key: 'amount', label: 'Сумма', type: 'money' }],
    rows: [{ amount: 100 }],
    totals: { amount: 100 },
  },
  createdAt: '2026-11-06T10:00:00Z',
}

describe('chat view model', () => {
  it('maps backend messages without losing widget data', () => {
    expect(mapChatMessagesToView([message])).toEqual([{
      id: '4',
      author: 'assistant',
      text: 'Готово',
      widget: message.widget,
    }])
  })

  it('maps an empty history to an empty view', () => {
    expect(mapChatMessagesToView([])).toEqual([])
  })

  it.each([
    [401, 'Сессия завершена. Войдите снова.'],
    [403, 'У вас нет доступа к этому чату.'],
    [409, 'Выбранная база 1С отключена. Выберите другую базу.'],
    [422, 'Проверьте данные запроса.'],
    [429, 'Слишком много запросов. Попробуйте позже.'],
    [502, 'DeepSeek или 1С временно недоступны. Обновите историю позже.'],
  ])('maps HTTP %s to a safe message', (status, expected) => {
    expect(getChatErrorMessage(new ApiError('technical', { kind: 'http', status }))).toBe(expected)
  })
})
