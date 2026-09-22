import { useState } from 'react'
import { avatarPublicUrl } from '../types'

export function UserAvatar({ name, path }: { name: string; path: string | null }) {
  const [broken, setBroken] = useState(false)
  const url = avatarPublicUrl(path)
  if (!url || broken) {
    return (
      <div className="user-avatar user-avatar-fallback" aria-hidden>
        {name.charAt(0).toUpperCase()}
      </div>
    )
  }
  return <img className="user-avatar" src={url} alt="" onError={() => setBroken(true)} />
}
