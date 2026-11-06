import type { ChatWidget } from '../domain/chat'

type ChatWidgetTableProps = {
  widget: ChatWidget
}

export function ChatWidgetTable({ widget }: ChatWidgetTableProps) {
  return (
    <div className="chat-widget" data-testid="chat-widget">
      <strong>{widget.title}</strong>
      <div className="chat-widget-scroll">
        <table>
          <thead>
            <tr>{widget.columns.map((column) => <th key={column.key} scope="col">{column.label}</th>)}</tr>
          </thead>
          <tbody>
            {widget.rows.map((row, index) => (
              <tr key={index}>{widget.columns.map((column) => <td key={column.key}>{formatCell(row[column.key])}</td>)}</tr>
            ))}
            <tr className="chat-widget-total">
              {widget.columns.map((column) => <td key={column.key}>{formatCell(widget.totals[column.key])}</td>)}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}
