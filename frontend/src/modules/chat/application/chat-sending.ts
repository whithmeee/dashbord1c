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
  let statusRequest: Promise<void> | undefined
  let statusController: AbortController | undefined

  function sendMessage(input: SendMessageInput): Promise<void> {
    const chatId = context.getState().selectedChatId
    const content = input.content.trim()
    if (chatId === undefined || !content) return Promise.resolve()
    if (request) return request
    const operationRevision = context.revision()
    controller = new AbortController()
    const requestId = createRequestId()
    context.publish({ ...context.getState(), sending: { status: 'sending', requestId } })
    const activeController = controller
    const activeRequest = gateway.sendMessage(chatId, { content }, {
      signal: activeController.signal,
      headers: { 'Idempotency-Key': requestId },
    })
      .then(async () => {
        if (!context.current(operationRevision) || context.getState().selectedChatId !== chatId) return
        const loaded = await context.loadMessages(chatId)
        if (context.current(operationRevision) && context.getState().selectedChatId === chatId) {
          context.publish({
            ...context.getState(),
            sending: loaded ? { status: 'idle' } : { status: 'error', error: context.messageError(), requestId },
          })
        }
      })
      .catch((error: unknown) => {
        if (!context.current(operationRevision) || activeController.signal.aborted) return
        if ((error as ApiError | undefined)?.status === 401) {
          context.reset()
          context.session.expireSession()
          return
        }
        context.publish({ ...context.getState(), sending: {
          status: 'error',
          error: normalizeError(error),
          requestId,
          operationStatus: operationStatus(error),
        } })
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

  function checkMessageRequest(): Promise<void> {
    const currentState = context.getState()
    if (currentState.sending.status !== 'error' || !currentState.sending.requestId) return Promise.resolve()
    const chatId = currentState.selectedChatId
    if (chatId === undefined || statusRequest) return statusRequest ?? Promise.resolve()

    const requestId = currentState.sending.requestId
    const operationRevision = context.revision()
    const activeController = new AbortController()
    statusController = activeController
    const activeRequest = gateway.getMessageRequestStatus(chatId, requestId, { signal: activeController.signal })
      .then(async (result) => {
        if (!context.current(operationRevision) || context.getState().selectedChatId !== chatId) return
        if (result.status === 'completed') {
          const loaded = await context.loadMessages(chatId)
          if (loaded && context.getState().selectedChatId === chatId) {
            context.publish({ ...context.getState(), sending: { status: 'idle' } })
          }
          return
        }

        const message = result.status === 'processing' ? 'Запрос ещё выполняется.' : 'Результат запроса неизвестен.'
        context.publish({
          ...context.getState(),
          sending: { status: 'error', error: new Error(message), requestId, operationStatus: result.status },
        })
      })
      .catch((error: unknown) => {
        if (activeController.signal.aborted || !context.current(operationRevision) || context.getState().selectedChatId !== chatId) return
        if (isUnauthorized(error)) {
          context.reset()
          context.session.expireSession()
          return
        }
        context.publish({ ...context.getState(), sending: { status: 'error', error: normalizeError(error), requestId } })
      })
      .finally(() => {
        if (statusRequest === activeRequest) {
          statusRequest = undefined
          statusController = undefined
        }
      })
    statusRequest = activeRequest
    return activeRequest
  }

  return {
    sendMessage,
    checkMessageRequest,
    reset: () => {
      controller?.abort()
      statusController?.abort()
    },
  }
}

function normalizeError(error: unknown): Error {
  return error instanceof Error ? error : new Error('Chat request failed')
}

function operationStatus(error: unknown): 'processing' | 'unknown' | undefined {
  const apiError = error as ApiError | undefined
  if (apiError?.code === 'message_request_processing') return 'processing'
  if (apiError?.code === 'message_request_unknown' || apiError?.kind === 'network' || apiError?.status === 502) return 'unknown'
  return undefined
}

function isUnauthorized(error: unknown): boolean {
  return (error as ApiError | undefined)?.status === 401
}

function createRequestId(): string {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const random = Math.random() * 16 | 0
    const value = character === 'x' ? random : random & 3 | 8
    return value.toString(16)
  })
}
