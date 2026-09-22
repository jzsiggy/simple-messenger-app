import { useLayoutEffect, useRef, useState } from 'react'
import { transcribe } from '../api'
import { useRecorder, type Recording } from '../hooks/useRecorder'

const MAX_LENGTH = 500
const COUNTER_THRESHOLD = 400

const MicIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden>
    <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z" />
  </svg>
)

const SendIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden>
    <path d="M3.4 20.4l17.45-7.48a1 1 0 0 0 0-1.84L3.4 3.6a.993.993 0 0 0-1.39.91L2 9.12c0 .5.37.93.87.99L17 12 2.87 13.88c-.5.07-.87.5-.87 1l.01 4.61c0 .71.73 1.2 1.39.91z" />
  </svg>
)

const StopIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden>
    <rect x="6" y="6" width="12" height="12" rx="2" />
  </svg>
)

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function Composer({
  onSend,
  onError,
}: {
  /** Returns true when the message was sent (composer then clears). */
  onSend: (text: string, audio: Recording | null) => Promise<boolean>
  onError: (message: string) => void
}) {
  const [text, setText] = useState('')
  const [pendingAudio, setPendingAudio] = useState<Recording | null>(null)
  const [transcribing, setTranscribing] = useState(false)
  const [sending, setSending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const { recording, elapsed, start, stop } = useRecorder()

  // Auto-grow: measure after the DOM has the new value (covers typing,
  // transcript insertion, and remount after the transcribing state).
  useLayoutEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }, [text])

  function updateText(value: string) {
    setText(value)
    if (value.trim() === '') setPendingAudio(null)
  }

  async function handleSend() {
    const trimmed = text.trim()
    if (!trimmed || sending || transcribing) return
    setSending(true)
    try {
      const sent = await onSend(trimmed, pendingAudio)
      if (sent) {
        setText('')
        setPendingAudio(null)
      }
    } finally {
      setSending(false)
    }
  }

  async function handleMic() {
    try {
      await start()
    } catch {
      onError('Microphone unavailable — check permissions')
    }
  }

  async function handleStop() {
    const result = await stop()
    if (!result) return
    setTranscribing(true)
    try {
      const transcript = await transcribe(result.blob, result.ext)
      setPendingAudio(result)
      updateText(text ? `${text} ${transcript}`.slice(0, MAX_LENGTH) : transcript.slice(0, MAX_LENGTH))
      textareaRef.current?.focus()
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Transcription failed')
    } finally {
      setTranscribing(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSend()
    }
  }

  if (recording) {
    return (
      <div className="composer recording">
        <span className="rec-dot" />
        <span className="rec-timer">{formatElapsed(elapsed)}</span>
        <div className="composer-spacer" />
        <button className="action-button stop" onClick={() => void handleStop()} aria-label="Stop recording">
          <StopIcon />
        </button>
      </div>
    )
  }

  if (transcribing) {
    return (
      <div className="composer recording">
        <span className="rec-transcribing">Transcribing…</span>
      </div>
    )
  }

  const hasText = text.trim().length > 0
  return (
    <div className="composer">
      <div className="composer-input">
        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          maxLength={MAX_LENGTH}
          placeholder="Type a message"
          onChange={(e) => updateText(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        {text.length >= COUNTER_THRESHOLD && (
          <span className="char-counter">
            {text.length}/{MAX_LENGTH}
          </span>
        )}
      </div>
      {hasText ? (
        <button
          className="action-button send"
          onClick={() => void handleSend()}
          disabled={sending}
          aria-label="Send message"
        >
          <SendIcon />
        </button>
      ) : (
        <button className="action-button mic" onClick={() => void handleMic()} aria-label="Record voice message">
          <MicIcon />
        </button>
      )}
    </div>
  )
}
