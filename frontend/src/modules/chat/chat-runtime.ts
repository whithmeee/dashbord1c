import { authSessionStore } from '../auth/react/auth-runtime'
import { chatGateway } from './adapters/http/http-chat-gateway'
import { createChatStore } from './application/chat-store'

export const chatStore = createChatStore(chatGateway, authSessionStore)

export function resetChat(): void {
  chatStore.reset()
}
