import type { ChatMessage } from '../model/chat-message'

export function createInitialMessages(): ChatMessage[] {
  return [
    {
      id: 'welcome',
      author: 'assistant',
      text: 'Здравствуйте! Я помогу разобраться с задачей, документами или данными. С чего начнём?',
    },
  ]
}
