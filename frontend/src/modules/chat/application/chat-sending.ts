import type { ApiError } from '../../../shared/api'
import type { ChatGateway } from '../adapters/http/http-chat-gateway'
import type { SendMessageInput } from '../domain/chat'
import type { ChatState } from './chat-state'

type SendingContext = {
  getState(): ChatState
  publish(state: ChatState): void
  current(revision: number): boolean
  revision(): number
  reset(): void
  session: { expireSession(): void }
  loadMessages(id: number): Promise<boolean>
  messageError(): Error
}

export function createChatSending(gateway: ChatGateway, context: SendingContext) {
  let request: Promise<void> | undefined
  let controller: AbortController | undefined

  function sendMessage(input: SendMessageInput): Promise<void> {
    const chatId = context.getState().selectedChatId
    const content = input.content.trim()
    if (chatId === undefined || !content) return Promise.resolve()
    if (request) return request
    const operationRevision = context.revision()
    controller = new AbortController()
    context.publish({ ...context.getState(), sending: { status: 'sending' } })
    const activeController = controller
    const activeRequest = gateway.sendMessage(chatId, { content }, { signal: activeController.signal })
      .then(async () => {
        if (!context.current(operationRevision) || context.getState().selectedChatId !== chatId) return
        const loaded = await context.loadMessages(chatId)
        if (context.current(operationRevision) && context.getState().selectedChatId === chatId) {
          context.publish({ ...context.getState(), sending: loaded ? { status: 'idle' } : { status: 'error', error: context.messageError() } })
        }
      })
      .catch((error: unknown) => {
        if (!context.current(operationRevision) || activeController.signal.aborted) return
        if ((error as ApiError | undefined)?.status === 401) {
          context.reset()
          context.session.expireSession()
          return
        }
        context.publish({ ...context.getState(), sending: { status: 'error', error: normalizeError(error) } })
      })
      .finally(() => {
        if (request === activeRequest) {
          request = undefined
          controller = undefined
        }
      })
    request = activeRequest
    return activeRequest
  }

  return {
    sendMessage,
    reset: () => controller?.abort(),
  }
}

function normalizeError(error: unknown): Error {
  return error instanceof Error ? error : new Error('Chat request failed')
}
