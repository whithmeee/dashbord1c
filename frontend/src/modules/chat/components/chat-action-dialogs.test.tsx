import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { Chat } from '../domain/chat'
import { DeleteChatDialog, RenameChatDialog } from './chat-action-dialogs'

const chat: Chat = {
  id: 7,
  integrationId: 3,
  title: 'Продажи за октябрь',
  createdAt: '2026-11-11T10:00:00Z',
  updatedAt: '2026-11-11T10:00:00Z',
}

describe('chat action dialogs', () => {
  it('renders a titled rename form in an accessible dialog', () => {
    const markup = renderToStaticMarkup(
      <RenameChatDialog chat={chat} onClose={vi.fn()} onConfirm={vi.fn()} />,
    )

    expect(markup).toContain('Переименовать диалог')
    expect(markup).toContain('value="Продажи за октябрь"')
    expect(markup).toContain('Сохранить')
    expect(markup).toContain('role="dialog"')
  })

  it('renders a destructive confirmation without a browser confirm prompt', () => {
    const markup = renderToStaticMarkup(
      <DeleteChatDialog chat={chat} onClose={vi.fn()} onConfirm={vi.fn()} />,
    )

    expect(markup).toContain('Удалить диалог?')
    expect(markup).toContain('Продажи за октябрь')
    expect(markup).toContain('Удалить')
    expect(markup).toContain('role="alertdialog"')
  })
})
