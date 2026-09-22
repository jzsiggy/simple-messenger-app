import { useEffect, useRef } from 'react'
import type { Message } from '../types'
import { Bubble } from './Bubble'

function dateLabel(iso: string): string {
  const date = new Date(iso)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return date.toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' })
}

export function MessageList({
  messages,
  myUserId,
  onError,
}: {
  messages: Message[]
  myUserId: number
  onError: (m: string) => void
}) {
  const listRef = useRef<HTMLDivElement | null>(null)
  const lastIdRef = useRef<number | null>(null)

  useEffect(() => {
    const lastId = messages.length ? messages[messages.length - 1].id : null
    if (lastId !== lastIdRef.current) {
      lastIdRef.current = lastId
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
    }
  }, [messages])

  const GROUP_WINDOW_MS = 60 * 60 * 1000
  const items: React.ReactNode[] = []
  let previousDay = ''
  let prev: Message | null = null
  for (const message of messages) {
    const day = new Date(message.created_at).toDateString()
    let pillInserted = false
    if (day !== previousDay) {
      previousDay = day
      pillInserted = true
      items.push(
        <div className="date-pill-row" key={`pill-${message.id}`}>
          <span className="date-pill">{dateLabel(message.created_at)}</span>
        </div>,
      )
    }
    const grouped =
      !pillInserted &&
      prev !== null &&
      prev.sender === message.sender &&
      new Date(message.created_at).getTime() - new Date(prev.created_at).getTime() <
        GROUP_WINDOW_MS
    const groupStart = !grouped && !pillInserted && prev !== null
    items.push(
      <Bubble
        key={message.id}
        message={message}
        myUserId={myUserId}
        grouped={grouped}
        groupStart={groupStart}
        onError={onError}
      />,
    )
    prev = message
  }

  return (
    <div className="message-list" ref={listRef}>
      {items}
    </div>
  )
}
