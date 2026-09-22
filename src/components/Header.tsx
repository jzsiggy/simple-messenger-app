import { useEffect, useRef, useState } from 'react'
import { randomAvatarUrl } from '../avatars'
import { config } from '../config'
import { type User } from '../types'
import { openLightbox } from './Lightbox'
import { UserAvatar } from './UserAvatar'

export function Header({ me, onLogout }: { me: User | null; onLogout: () => void }) {
  const initial = config.chatName.trim().charAt(0).toUpperCase() || '?'
  const [menuOpen, setMenuOpen] = useState(false)
  const rightRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!menuOpen) return
    const onPointerDown = (e: MouseEvent) => {
      if (rightRef.current && !rightRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])

  return (
    <header className="header">
      <div className="header-left">
        {randomAvatarUrl ? (
          <button
            className="avatar-button header-avatar"
            onClick={() => randomAvatarUrl && openLightbox(randomAvatarUrl)}
            aria-label="View chat photo"
          >
            <img src={randomAvatarUrl} alt="" />
          </button>
        ) : (
          <div className="header-avatar">{initial}</div>
        )}
        <div className="header-name">{config.chatName}</div>
      </div>
      <div className="header-right" ref={rightRef}>
        {me && <span className="header-user">{me.first_name}</span>}
        <button
          className="header-me"
          onClick={() => setMenuOpen((open) => !open)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-label="Account menu"
        >
          <UserAvatar name={me?.first_name ?? '?'} path={me?.avatar_path ?? null} />
        </button>
        {menuOpen && (
          <div className="header-menu" role="menu">
            <button
              className="header-menu-item"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false)
                onLogout()
              }}
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
