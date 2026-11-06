import type {
  Chat,
  ChatIntegration,
  ChatIntegrationStatus,
  ChatMessage,
  ChatMessageRole,
  ChatMessageRequestStatus,
  ChatMessageRequestStatusName,
  ChatWidget,
  ChatWidgetColumn,
} from './chat'

export class InvalidChatError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidChatError'
  }
}

export function mapChats(value: unknown): readonly Chat[] {
  if (!Array.isArray(value)) {
    throw invalid('chats must be an array')
  }

  return value.map((item) => mapChat(item))
}

export function mapChat(value: unknown): Chat {
  const chat = readRecord(value, 'chat')
  const integration = chat.integration === undefined || chat.integration === null
    ? undefined
    : mapIntegration(chat.integration)

  return {
    id: readInteger(chat.id, 'chat.id'),
    integrationId: readInteger(chat.integration_id, 'chat.integration_id'),
    ...(integration ? { integration } : {}),
    title: readString(chat.title, 'chat.title'),
    createdAt: readString(chat.created_at, 'chat.created_at'),
  }
}

export function mapMessages(value: unknown): readonly ChatMessage[] {
  if (!Array.isArray(value)) {
    throw invalid('messages must be an array')
  }

  return value.map((item) => mapMessage(item))
}

export function mapMessage(value: unknown): ChatMessage {
  const message = readRecord(value, 'message')
  const role = readString(message.role, 'message.role')

  if (!isMessageRole(role)) {
    throw invalid('message.role must be user or assistant')
  }

  return {
    id: readInteger(message.id, 'message.id'),
    chatId: readInteger(message.chat_id, 'message.chat_id'),
    integrationId: readInteger(message.integration_id, 'message.integration_id'),
    role,
    content: readNullableString(message.content, 'message.content'),
    widget: message.widget === null ? null : mapWidget(message.widget),
    createdAt: readString(message.created_at, 'message.created_at'),
  }
}

export function mapMessageRequestStatus(value: unknown): ChatMessageRequestStatus {
  const request = readRecord(value, 'message request')
  const status = readString(request.status, 'message request.status')
  if (!isMessageRequestStatus(status)) {
    throw invalid('message request.status is invalid')
  }

  return {
    requestId: readString(request.request_id, 'message request.request_id'),
    status,
    ...(request.message === undefined ? {} : { message: mapMessage(request.message) }),
  }
}

function mapIntegration(value: unknown): ChatIntegration {
  const integration = readRecord(value, 'chat.integration')
  const status = readString(integration.status, 'chat.integration.status')

  if (!isIntegrationStatus(status)) {
    throw invalid('chat.integration.status must be active or inactive')
  }

  return {
    id: readInteger(integration.id, 'chat.integration.id'),
    name: readString(integration.name, 'chat.integration.name'),
    configName: readString(integration.config_name, 'chat.integration.config_name'),
    isActive: readBoolean(integration.is_active, 'chat.integration.is_active'),
    status,
  }
}

function mapWidget(value: unknown): ChatWidget {
  const widget = readRecord(value, 'message.widget')
  const columns = readArray(widget.columns, 'message.widget.columns').map(mapColumn)
  const rows = readArray(widget.rows, 'message.widget.rows').map((row) => readRecord(row, 'message.widget.rows[]'))

  return {
    title: readString(widget.title, 'message.widget.title'),
    columns,
    rows,
    totals: readRecord(widget.totals, 'message.widget.totals'),
  }
}

function mapColumn(value: unknown): ChatWidgetColumn {
  const column = readRecord(value, 'message.widget.columns[]')

  return {
    key: readString(column.key, 'message.widget.columns[].key'),
    label: readString(column.label, 'message.widget.columns[].label'),
    type: readString(column.type, 'message.widget.columns[].type'),
  }
}

function readRecord(value: unknown, path: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw invalid(`${path} must be an object`)
  }

  return value as Record<string, unknown>
}

function readArray(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) {
    throw invalid(`${path} must be an array`)
  }

  return value
}

function readString(value: unknown, path: string): string {
  if (typeof value !== 'string') {
    throw invalid(`${path} must be a string`)
  }

  return value
}

function readNullableString(value: unknown, path: string): string | null {
  return value === null ? null : readString(value, path)
}

function readInteger(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw invalid(`${path} must be an integer`)
  }

  return value
}

function readBoolean(value: unknown, path: string): boolean {
  if (typeof value !== 'boolean') {
    throw invalid(`${path} must be a boolean`)
  }

  return value
}

function isIntegrationStatus(value: string): value is ChatIntegrationStatus {
  return value === 'active' || value === 'inactive'
}

function isMessageRole(value: string): value is ChatMessageRole {
  return value === 'user' || value === 'assistant'
}

function isMessageRequestStatus(value: string): value is ChatMessageRequestStatusName {
  return value === 'processing' || value === 'completed' || value === 'unknown'
}

function invalid(message: string): InvalidChatError {
  return new InvalidChatError(message)
}
