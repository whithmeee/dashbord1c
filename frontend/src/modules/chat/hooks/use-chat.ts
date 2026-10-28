import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
import { createInitialMessages } from '../config/initial-messages'
import { scriptedResponses } from '../config/scripted-responses'
import {
  appendChatMessages,
  createAssistantMessage,
  createUserMessage,
  isChatDraftEmpty,
  prepareChatDraft,
} from '../model/chat-message'

export function useChat() {
  const [messages, setMessages] = useState(createInitialMessages)
  const [draft, setDraft] = useState('')
  const conversationEndRef = useRef<HTMLDivElement>(null)
  const responseIndexRef = useRef(0)

  const createScriptedResponse = useCallback(() => {
    const responseIndex = responseIndexRef.current % scriptedResponses.length
    responseIndexRef.current += 1

    return createAssistantMessage(
      scriptedResponses[responseIndex],
      crypto.randomUUID(),
    )
  }, [])

  const sendMessage = useCallback(() => {
    const decision = prepareChatDraft(draft)

    if (decision.kind === 'empty') {
      return
    }

    const userMessage = createUserMessage(decision.text, crypto.randomUUID())
    const assistantMessage = createScriptedResponse()
    setMessages((currentMessages) =>
      appendChatMessages(currentMessages, [userMessage, assistantMessage]),
    )
    setDraft('')
  }, [createScriptedResponse, draft])

  const submitMessage = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      sendMessage()
    },
    [sendMessage],
  )

  const submitMessageFromKeyboard = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key !== 'Enter' || event.shiftKey) {
        return
      }

      event.preventDefault()
      sendMessage()
    },
    [sendMessage],
  )

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return {
    conversationEndRef,
    draft,
    isSendDisabled: isChatDraftEmpty(draft),
    messages,
    setDraft,
    submitMessage,
    submitMessageFromKeyboard,
  }
}

export type ChatController = ReturnType<typeof useChat>
