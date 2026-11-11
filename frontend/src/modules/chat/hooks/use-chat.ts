import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
import { authSessionStore } from '../../auth/react/auth-runtime'
import { integrationsStore, resetIntegrations } from '../../integrations/integrations-runtime'
import type { IntegrationsState } from '../../integrations/application/integrations-store'
import { chatStore } from '../chat-runtime'
import type { ChatState } from '../application/chat-store'
import { mapChatMessagesToView, prepareChatDraft } from '../model/chat-view-model'
import type { ChatMessage } from '../model/chat-message'

export function useChat(enabled = true) {
  const chatState = useSyncExternalStore(chatStore.subscribe, chatStore.getSnapshot, chatStore.getSnapshot)
  const integrationsState = useSyncExternalStore(integrationsStore.subscribe, integrationsStore.getSnapshot, integrationsStore.getSnapshot)
  const authState = useSyncExternalStore(authSessionStore.subscribe, authSessionStore.getSnapshot, authSessionStore.getSnapshot)
  const [draft, setDraft] = useState('')
  const [selectedIntegrationId, setSelectedIntegrationId] = useState<number>()
  const conversationEndRef = useRef<HTMLDivElement>(null)
  const previousSessionKey = useRef<string>()
  const sessionKey = getSessionKey(authState)

  useEffect(() => {
    if (!sessionKey) {
      previousSessionKey.current = undefined
      chatStore.reset()
      resetIntegrations()
      setDraft('')
      return
    }

    if (previousSessionKey.current !== sessionKey) {
      previousSessionKey.current = sessionKey
      chatStore.reset()
      resetIntegrations()
      setDraft('')
    }

    if (enabled) {
      void chatStore.loadChats()
      void integrationsStore.load()
    }
  }, [enabled, sessionKey])

  useEffect(() => {
    if (integrationsState.status !== 'success') return
    const active = integrationsState.items.find((item) => item.status === 'active')
    if (selectedIntegrationId === undefined || !integrationsState.items.some((item) => item.id === selectedIntegrationId && item.status === 'active')) {
      setSelectedIntegrationId(active?.id)
    }
  }, [integrationsState, selectedIntegrationId])

  const sendMessage = useCallback(async () => {
    const decision = prepareChatDraft(draft)
    if (decision.kind === 'empty') return
    if (chatStore.getSnapshot().selectedChatId === undefined) {
      if (selectedIntegrationId === undefined) return
      await chatStore.createChat({ integrationId: selectedIntegrationId })
      if (chatStore.getSnapshot().selectedChatId === undefined) return
    }
    await chatStore.sendMessage({ content: decision.text })
    if (chatStore.getSnapshot().sending.status === 'idle') setDraft('')
  }, [draft, selectedIntegrationId])

  const submitMessage = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void sendMessage()
  }, [sendMessage])

  const submitMessageFromKeyboard = useCallback((event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey) return
    event.preventDefault()
    void sendMessage()
  }, [sendMessage])

  const createChat = useCallback(async () => {
    if (selectedIntegrationId === undefined) return
    await chatStore.createChat({ integrationId: selectedIntegrationId })
  }, [selectedIntegrationId])

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatState.messages])

  return {
    chatState,
    integrationsState,
    chats: chatItems(chatState),
    messages: viewMessages(chatState),
    selectedChatId: chatState.selectedChatId,
    selectedIntegrationId,
    setSelectedIntegrationId,
    createChat,
    refreshChats: chatStore.loadChats,
    selectChat: chatStore.selectChat,
    renameChat: chatStore.updateChat,
    deleteChat: chatStore.deleteChat,
    refreshMessages: chatStore.refreshMessages,
    checkMessageRequest: chatStore.checkMessageRequest,
    conversationEndRef,
    draft,
    setDraft,
    isSendDisabled: (!chatState.selectedChatId && selectedIntegrationId === undefined) || chatState.sending.status === 'sending' || prepareChatDraft(draft).kind === 'empty',
    isSending: chatState.sending.status === 'sending',
    submitMessage,
    submitMessageFromKeyboard,
  }
}

function chatItems(state: ChatState) {
  return state.chats.status === 'success' ? state.chats.items : []
}

function viewMessages(state: ChatState): readonly ChatMessage[] {
  return state.messages.status === 'success' ? mapChatMessagesToView(state.messages.items) : []
}

function getSessionKey(state: ReturnType<typeof authSessionStore.getSnapshot>): string | undefined {
  if (state.status !== 'authenticated-client') return undefined
  return `${state.session.type}:${state.session.account.id}`
}

export type ChatController = ReturnType<typeof useChat>
export type ChatUiIntegrationsState = IntegrationsState
