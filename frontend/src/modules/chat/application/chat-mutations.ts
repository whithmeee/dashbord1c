import type { ApiError, RequestOptions } from '../../../shared/api'
import type { ChatGateway } from '../adapters/http/http-chat-gateway'
import type { Chat, CreateChatInput, UpdateChatInput } from '../domain/chat'
import type { ChatState } from './chat-state'

type MutationOperation = 'create' | 'update' | 'delete'

type MutationContext = {
  getState(): ChatState
  publish(state: ChatState): void
  current(revision: number): boolean
  revision(): number
  reset(): void
  session: { expireSession(): void }
  chatItems(): readonly Chat[]
  hasChat(id: number): boolean
  loadMessages(id: number): Promise<boolean>
}

export function createChatMutations(gateway: ChatGateway, context: MutationContext) {
  const requests = new Map<string, Promise<void>>()
  const controllers = new Map<string, AbortController>()

  function createChat(input: CreateChatInput): Promise<void> {
    return mutate('create', undefined, (options) => gateway.createChat(input, options), async (chat) => {
      const state = context.getState()
      context.publish({ ...state, chats: { status: 'success', items: [...context.chatItems(), chat] }, selectedChatId: chat.id, messages: { status: 'success', chatId: chat.id, items: [] }, mutation: { status: 'idle' } })
    })
  }

  function updateChat(id: number, input: UpdateChatInput): Promise<void> {
    const state = context.getState()
    if (!context.hasChat(id) || (state.sending.status === 'sending' && state.selectedChatId === id)) return Promise.resolve()
    return mutate('update', id, (options) => gateway.updateChat(id, input, options), async (chat) => {
      const previous = context.chatItems().find((item) => item.id === id)
      context.publish({ ...context.getState(), chats: { status: 'success', items: context.chatItems().map((item) => item.id === id ? chat : item) } })
      if (context.getState().selectedChatId === id && previous?.integrationId !== chat.integrationId) await context.loadMessages(id)
      context.publish({ ...context.getState(), mutation: { status: 'idle' } })
    })
  }

  function deleteChat(id: number): Promise<void> {
    if (!context.hasChat(id)) return Promise.resolve()
    return mutate('delete', id, (options) => gateway.deleteChat(id, options), async () => {
      const state = context.getState()
      const next = { ...state, chats: { status: 'success', items: context.chatItems().filter((item) => item.id !== id) } as ChatState['chats'] }
      if (state.selectedChatId === id) {
        delete next.selectedChatId
        next.messages = { status: 'idle' }
      }
      next.mutation = { status: 'idle' }
      context.publish(next)
    })
  }

  function mutate<T>(operation: MutationOperation, chatId: number | undefined, request: (options: RequestOptions) => Promise<T>, onSuccess: (value: T) => void | Promise<void>): Promise<void> {
    const key = chatId === undefined ? operation : `${operation}:${chatId}`
    const existing = requests.get(key)
    if (existing) return existing
    const operationRevision = context.revision()
    const controller = new AbortController()
    controllers.set(key, controller)
    context.publish({ ...context.getState(), mutation: { status: 'pending', operation, ...(chatId === undefined ? {} : { chatId }) } })
    const promise = request({ signal: controller.signal }).then((value) => {
      if (context.current(operationRevision)) return onSuccess(value)
    }).catch((error: unknown) => {
      if (!context.current(operationRevision) || controller.signal.aborted) return
      if ((error as ApiError | undefined)?.status === 401) {
        context.reset()
        context.session.expireSession()
        return
      }
      const apiError = error as ApiError
      context.publish({ ...context.getState(), mutation: { status: 'error', operation, ...(chatId === undefined ? {} : { chatId }), error: normalizeError(error), ...(apiError.validationErrors ? { validationErrors: apiError.validationErrors } : {}) } })
    }).finally(() => {
      if (requests.get(key) === promise) {
        requests.delete(key)
        controllers.delete(key)
      }
    })
    requests.set(key, promise)
    return promise
  }

  return {
    createChat,
    updateChat,
    deleteChat,
    reset: () => {
      controllers.forEach((controller) => controller.abort())
      controllers.clear()
      requests.clear()
    },
  }
}

function normalizeError(error: unknown): Error {
  return error instanceof Error ? error : new Error('Chat request failed')
}
