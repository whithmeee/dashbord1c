export type ChatMessageAuthor = 'assistant' | 'user'

export type ChatMessage = {
  id: string
  author: ChatMessageAuthor
  text: string
}

export type ChatDraftDecision =
  | { kind: 'empty' }
  | { kind: 'ready'; text: string }

export function prepareChatDraft(draft: string): ChatDraftDecision {
  const text = draft.trim()

  return text ? { kind: 'ready', text } : { kind: 'empty' }
}

export function isChatDraftEmpty(draft: string): boolean {
  return prepareChatDraft(draft).kind === 'empty'
}

export function createUserMessage(text: string, id: string): ChatMessage {
  return { id, author: 'user', text }
}

export function createAssistantMessage(text: string, id: string): ChatMessage {
  return { id, author: 'assistant', text }
}

export function appendChatMessages(
  messages: ChatMessage[],
  newMessages: ChatMessage[],
): ChatMessage[] {
  return [...messages, ...newMessages]
}
