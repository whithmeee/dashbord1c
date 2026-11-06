import { ChatComposer } from './chat-composer'
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

  return (
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
            onRename={(chat) => void renameChat(controller, chat)}
            onDelete={(chat) => void deleteChat(controller, chat)}
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
              onDraftChange={controller.setDraft}
              onKeyDown={controller.submitMessageFromKeyboard}
              onSubmit={controller.submitMessage}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

async function renameChat(controller: ChatController, chat: Chat): Promise<void> {
  const title = window.prompt('Название диалога', chat.title)?.trim()
  if (title) await controller.renameChat(chat.id, { title })
}

async function deleteChat(controller: ChatController, chat: Chat): Promise<void> {
  if (window.confirm(`Удалить диалог «${chat.title}»?`)) await controller.deleteChat(chat.id)
}
