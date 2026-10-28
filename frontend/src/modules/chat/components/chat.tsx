import { ChatComposer } from './chat-composer'
import { ChatHeader } from './chat-header'
import { ChatMessageList } from './chat-message-list'
import type { ChatController } from '../hooks/use-chat'
import '../styles/chat-layout.css'
import '../styles/chat-motion.css'
import '../styles/chat-responsive.css'

type ChatProps = {
  controller: ChatController
}

export function Chat({ controller }: ChatProps) {
  return (
    <section className="chat-module" aria-label="Чат с ассистентом">
      <div className="chat-workspace">
        <ChatHeader />
        <ChatMessageList
          conversationEndRef={controller.conversationEndRef}
          messages={controller.messages}
        />
        <ChatComposer
          draft={controller.draft}
          isSendDisabled={controller.isSendDisabled}
          onDraftChange={controller.setDraft}
          onKeyDown={controller.submitMessageFromKeyboard}
          onSubmit={controller.submitMessage}
        />
      </div>
    </section>
  )
}
