import { useState } from 'react'
import { ChatComposer } from './chat-composer'
import { DeleteChatDialog, RenameChatDialog } from './chat-action-dialogs'
import { ChatDialogsPanel } from './chat-dialogs-panel'
import { ChatHeader } from './chat-header'
import { ChatMessageList } from './chat-message-list'
import type { ChatController } from '../hooks/use-chat'
import type { Chat } from '../domain/chat'
import '../styles/chat-layout.css'
import '../styles/chat-dialogs.css'
import '../styles/chat-motion.css'
import '../styles/chat-responsive.css'
import '../styles/chat-widget.css'

type ChatProps = {
  controller: ChatController
}

export function Chat({ controller }: ChatProps) {
  const selectedChat = controller.chats.find((chat) => chat.id === controller.selectedChatId)
  const [action, setAction] = useState<{ kind: 'rename' | 'delete'; chat: Chat }>()

  return (
    <>
      <section className="chat-module" aria-label="Чат с ассистентом">
        <div className="chat-workspace">
          <ChatHeader title={selectedChat?.title ?? 'ИИ-чат'} integrationName={selectedChat?.integration?.name} />
          <div className="chat-body">
            <ChatDialogsPanel
              chats={controller.chats}
              chatsStatus={controller.chatState.chats.status}
              chatsError={controller.chatState.chats.status === 'error' ? controller.chatState.chats.error : undefined}
              selectedChatId={controller.selectedChatId}
              integrationsState={controller.integrationsState}
              selectedIntegrationId={controller.selectedIntegrationId}
              onIntegrationChange={controller.setSelectedIntegrationId}
              onCreate={() => void controller.createChat()}
              onSelect={(id) => void controller.selectChat(id)}
              onRename={(chat) => setAction({ kind: 'rename', chat })}
              onDelete={(chat) => setAction({ kind: 'delete', chat })}
              onRefresh={() => void controller.refreshChats()}
            />
            <div className="chat-main">
              <ChatMessageList
                conversationEndRef={controller.conversationEndRef}
                messages={controller.messages}
                status={controller.chatState.messages.status}
                error={controller.chatState.messages.status === 'error' ? controller.chatState.messages.error : undefined}
                onRefresh={() => void controller.refreshMessages()}
              />
              <ChatComposer
                draft={controller.draft}
                isSendDisabled={controller.isSendDisabled}
                isSending={controller.isSending}
                sendError={controller.chatState.sending.status === 'error' ? controller.chatState.sending.error : undefined}
                onRefresh={() => void controller.refreshMessages()}
                onCheckStatus={() => void controller.checkMessageRequest()}
                operationStatus={controller.chatState.sending.status === 'error' ? controller.chatState.sending.operationStatus : undefined}
                onDraftChange={controller.setDraft}
                onKeyDown={controller.submitMessageFromKeyboard}
                onSubmit={controller.submitMessage}
              />
            </div>
          </div>
        </div>
      </section>
      {action?.kind === 'rename' && (
        <RenameChatDialog
          chat={action.chat}
          onClose={() => setAction(undefined)}
          onConfirm={async (title) => {
            if (title) await controller.renameChat(action.chat.id, { title })
            setAction(undefined)
          }}
        />
      )}
      {action?.kind === 'delete' && (
        <DeleteChatDialog
          chat={action.chat}
          onClose={() => setAction(undefined)}
          onConfirm={async () => {
            await controller.deleteChat(action.chat.id)
            setAction(undefined)
          }}
        />
      )}
    </>
  )
}
