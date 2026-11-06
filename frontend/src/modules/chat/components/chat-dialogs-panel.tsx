import { LoaderCircle, Plus, RefreshCw, Trash2 } from 'lucide-react'
import type { Chat } from '../domain/chat'
import type { IntegrationsState } from '../../integrations/application/integrations-store'
import { getChatErrorMessage } from '../model/chat-view-model'

type ChatDialogsPanelProps = {
  chats: readonly Chat[]
  chatsStatus: 'idle' | 'loading' | 'success' | 'error'
  chatsError?: Error
  selectedChatId?: number
  integrationsState: IntegrationsState
  selectedIntegrationId?: number
  onIntegrationChange: (id: number) => void
  onCreate: () => void
  onSelect: (id: number) => void
  onRename: (chat: Chat) => void
  onDelete: (chat: Chat) => void
  onRefresh: () => void
}

export function ChatDialogsPanel({
  chats,
  chatsStatus,
  chatsError,
  selectedChatId,
  integrationsState,
  selectedIntegrationId,
  onIntegrationChange,
  onCreate,
  onSelect,
  onRename,
  onDelete,
  onRefresh,
}: ChatDialogsPanelProps) {
  const activeIntegrations = integrationsState.status === 'success'
    ? integrationsState.items.filter((item) => item.status === 'active')
    : []
  const isLoading = integrationsState.status === 'loading'

  return (
    <aside className="chat-dialogs-panel" aria-label="Диалоги">
      <div className="chat-dialogs-heading">
        <strong>Диалоги</strong>
        <button type="button" className="chat-panel-icon" onClick={onRefresh} aria-label="Обновить диалоги">
          <RefreshCw size={16} />
        </button>
      </div>
      <div className="chat-new-dialog">
        <select
          aria-label="База 1С для нового диалога"
          value={selectedIntegrationId ?? ''}
          disabled={isLoading || activeIntegrations.length === 0}
          onChange={(event) => onIntegrationChange(Number(event.target.value))}
        >
          <option value="">Выберите базу 1С</option>
          {activeIntegrations.map((integration) => <option key={integration.id} value={integration.id}>{integration.name}</option>)}
        </select>
        <button type="button" className="chat-new-button" disabled={!selectedIntegrationId} onClick={onCreate}>
          <Plus size={16} /> Новый диалог
        </button>
        {integrationsState.status === 'success' && activeIntegrations.length === 0 && <p>Нет активных баз 1С.</p>}
      </div>
      <div className="chat-dialogs-list">
        {chatsStatus === 'loading' ? <p className="chat-dialogs-empty">Загружаем диалоги…</p> : chatsStatus === 'error' ? (
          <div className="chat-dialogs-empty"><p>{getChatErrorMessage(chatsError)}</p><button type="button" className="chat-refresh-button" onClick={onRefresh}>Обновить</button></div>
        ) : chats.length === 0 ? <p className="chat-dialogs-empty">Диалогов пока нет.</p> : chats.map((chat) => (
          <div className={`chat-dialog-item${chat.id === selectedChatId ? ' is-selected' : ''}`} key={chat.id}>
            <button type="button" onClick={() => onSelect(chat.id)}>{chat.title}</button>
            <div>
              <button type="button" className="chat-panel-icon" onClick={() => onRename(chat)} aria-label={`Переименовать ${chat.title}`}>…</button>
              <button type="button" className="chat-panel-icon" onClick={() => onDelete(chat)} aria-label={`Удалить ${chat.title}`}><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>
      {isLoading && <LoaderCircle className="chat-panel-spinner" size={18} />}
    </aside>
  )
}
