import { useCallback, useEffect, useRef, useState } from 'react'
import { loadMessages } from '../api'
import type { Message } from '../types'

const POLL_INTERVAL_MS = 20_000

export function useMessages(onError: (message: string) => void) {
  const [messages, setMessages] = useState<Message[]>([])
  const idKeyRef = useRef('')
  const onErrorRef = useRef(onError)
  useEffect(() => {
    onErrorRef.current = onError
  }, [onError])

  const refresh = useCallback(async () => {
    try {
      const rows = await loadMessages()
      const key = rows.map((m) => m.id).join(',')
      if (key === idKeyRef.current) return
      idKeyRef.current = key
      setMessages(rows)
    } catch {
      onErrorRef.current('Could not load messages')
    }
  }, [])

  useEffect(() => {
    void refresh()
    const timer = setInterval(() => void refresh(), POLL_INTERVAL_MS)
    const onVisibility = () => {
      if (!document.hidden) void refresh()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [refresh])

  return { messages, refresh }
}
