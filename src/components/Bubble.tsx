import { useEffect, useRef, useState } from 'react'
import { fetchAudio } from '../api'
import { avatarPublicUrl, senderName, type Message } from '../types'
import { openLightbox } from './Lightbox'
import { UserAvatar } from './UserAvatar'

// Only one voice message plays at a time across all bubbles.
let stopCurrent: (() => void) | null = null

type AudioState = 'idle' | 'loading' | 'playing'

function AudioControl({ audioPath, onError }: { audioPath: string; onError: (m: string) => void }) {
  const [state, setState] = useState<AudioState>('idle')
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const urlRef = useRef<string | null>(null)

  useEffect(() => {
    return () => {
      audioRef.current?.pause()
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
      if (stopCurrent === stopMine) stopCurrent = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function stopMine() {
    audioRef.current?.pause()
    if (audioRef.current) audioRef.current.currentTime = 0
    setState('idle')
    if (stopCurrent === stopMine) stopCurrent = null
  }

  async function toggle() {
    if (state === 'playing') {
      stopMine()
      return
    }
    if (state === 'loading') return
    stopCurrent?.()
    try {
      if (!audioRef.current) {
        setState('loading')
        const blob = await fetchAudio(audioPath)
        urlRef.current = URL.createObjectURL(blob)
        audioRef.current = new Audio(urlRef.current)
        audioRef.current.onended = () => stopMine()
      }
      await audioRef.current.play()
      stopCurrent = stopMine
      setState('playing')
    } catch {
      setState('idle')
      onError('Could not play voice message')
    }
  }

  const icon = state === 'playing' ? '◼' : state === 'loading' ? '…' : '▶'
  return (
    <button className="audio-control" onClick={() => void toggle()} aria-label="Play voice message">
      <span className="audio-icon">{icon}</span> Voice message
    </button>
  )
}

export function Bubble({
  message,
  myUserId,
  grouped,
  groupStart,
  onError,
}: {
  message: Message
  myUserId: number
  /** Continuation of the previous message's group — hide sender name and avatar. */
  grouped: boolean
  /** Starts a new group directly below another bubble — gets extra top spacing. */
  groupStart: boolean
  onError: (m: string) => void
}) {
  const mine = message.sender === myUserId
  const time = new Date(message.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  return (
    <div
      className={`bubble-row ${mine ? 'mine' : 'theirs'}${groupStart ? ' group-start' : ''}`}
    >
      {!mine &&
        (grouped ? (
          <div className="user-avatar-spacer" />
        ) : avatarPublicUrl(message.users?.avatar_path) ? (
          <button
            className="avatar-button"
            onClick={() => openLightbox(avatarPublicUrl(message.users?.avatar_path)!)}
            aria-label={`View ${senderName(message)}'s photo`}
          >
            <UserAvatar name={senderName(message)} path={message.users?.avatar_path ?? null} />
          </button>
        ) : (
          <UserAvatar name={senderName(message)} path={message.users?.avatar_path ?? null} />
        ))}
      <div className="bubble">
        {!mine && !grouped && <div className="bubble-sender">{senderName(message)}</div>}
        {message.audio_path && <AudioControl audioPath={message.audio_path} onError={onError} />}
        <span className="bubble-text">{message.content}</span>
        <span className="bubble-time">{time}</span>
      </div>
    </div>
  )
}
