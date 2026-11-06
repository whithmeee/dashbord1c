export type ChatIntegrationStatus = 'active' | 'inactive'

export type ChatIntegration = {
  readonly id: number
  readonly name: string
  readonly configName: string
  readonly isActive: boolean
  readonly status: ChatIntegrationStatus
}

export type Chat = {
  readonly id: number
  readonly integrationId: number
  readonly integration?: ChatIntegration
  readonly title: string
  readonly createdAt: string
}

export type ChatMessageRole = 'user' | 'assistant'

export type ChatWidgetColumnType = 'string' | 'integer' | 'money' | 'percent' | (string & {})

export type ChatWidgetColumn = {
  readonly key: string
  readonly label: string
  readonly type: ChatWidgetColumnType
}

export type ChatWidget = {
  readonly title: string
  readonly columns: readonly ChatWidgetColumn[]
  readonly rows: readonly Record<string, unknown>[]
  readonly totals: Record<string, unknown>
}

export type ChatMessage = {
  readonly id: number
  readonly chatId: number
  readonly integrationId: number
  readonly role: ChatMessageRole
  readonly content: string | null
  readonly widget: ChatWidget | null
  readonly createdAt: string
}

export type CreateChatInput = {
  readonly integrationId: number
  readonly title?: string
}

export type UpdateChatInput = {
  readonly integrationId?: number
  readonly title?: string
}

export type SendMessageInput = {
  readonly content: string
}

export type ChatMessageRequestStatusName = 'processing' | 'completed' | 'unknown'

export type ChatMessageRequestStatus = {
  readonly requestId: string
  readonly status: ChatMessageRequestStatusName
  readonly message?: ChatMessage
}
