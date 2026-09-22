import { useCallback, useEffect, useRef, useState } from 'react'
import { loadUsers, sendMessage, uploadAudio } from './api'
import { config } from './config'
import { Composer } from './components/Composer'
import { Header } from './components/Header'
import { Lightbox } from './components/Lightbox'
import { Login } from './components/Login'
import { MessageList } from './components/MessageList'
import { useMessages } from './hooks/useMessages'
import type { Recording } from './hooks/useRecorder'
import { clearUserId, loadUserId, saveUserId } from './session'
import type { User } from './types'

const BANNER_TIMEOUT_MS = 6000

function Chat({
  userId,
  me: initialMe,
  onLogout,
}: {
  userId: number
  me: User | null
  onLogout: () => void
}) {
  const [error, setError] = useState<string | null>(null)
  const [me, setMe] = useState<User | null>(initialMe)
  const bannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showError = useCallback((message: string) => {
    setError(message)
    if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current)
    bannerTimerRef.current = setTimeout(() => setError(null), BANNER_TIMEOUT_MS)
  }, [])

  const { messages, refresh } = useMessages(showError)

  useEffect(() => {
    if (me) return
    loadUsers()
      .then((users) => setMe(users.find((u) => u.id === userId) ?? null))
      .catch(() => {
        // header just won't show the name; not worth a banner
      })
  }, [me, userId])

  const handleSend = useCallback(
    async (text: string, audio: Recording | null): Promise<boolean> => {
      let audioPath: string | null = null
      if (audio) {
        audioPath = await uploadAudio(audio.blob, audio.ext, userId)
        if (!audioPath) showError('Audio upload failed — sent text only')
      }
      try {
        await sendMessage(text, audioPath, userId)
      } catch {
        showError('Message not sent — check your connection')
        return false
      }
      void refresh()
      return true
    },
    [refresh, showError, userId],
  )

  return (
    <div className="app">
      <Header me={me} onLogout={onLogout} />
      {error && (
        <div className="error-banner" role="alert">
          <span>{error}</span>
          <button onClick={() => setError(null)} aria-label="Dismiss">
            ×
          </button>
        </div>
      )}
      <MessageList messages={messages} myUserId={userId} onError={showError} />
      <Composer onSend={handleSend} onError={showError} />
      <Lightbox />
    </div>
  )
}

export default function App() {
  const [userId, setUserId] = useState<number | null>(() => loadUserId())
  const [me, setMe] = useState<User | null>(null)

  useEffect(() => {
    document.title = config.chatName
  }, [])

  if (userId === null) {
    return (
      <Login
        onLogin={(user) => {
          saveUserId(user.id)
          setMe(user)
          setUserId(user.id)
        }}
      />
    )
  }

  return (
    <Chat
      key={userId}
      userId={userId}
      me={me}
      onLogout={() => {
        clearUserId()
        setMe(null)
        setUserId(null)
      }}
    />
  )
}
