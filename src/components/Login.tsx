import { useEffect, useState } from 'react'
import { loadUsers } from '../api'
import { config } from '../config'
import { fullName, type User } from '../types'
import { UserAvatar } from './UserAvatar'

export function Login({ onLogin }: { onLogin: (user: User) => void }) {
  const [users, setUsers] = useState<User[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    loadUsers()
      .then((list) => {
        if (!cancelled) setUsers(list)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [attempt])

  const load = () => {
    setFailed(false)
    setAttempt((n) => n + 1)
  }

  return (
    <div className="login">
      <div className="login-eyebrow">{config.chatName}</div>
      <h1 className="login-title">Who are you?</h1>
      {failed ? (
        <div className="login-error">
          <p>Could not load users.</p>
          <button className="login-retry" onClick={load}>
            Try again
          </button>
        </div>
      ) : users === null ? (
        <div className="login-loading">Loading…</div>
      ) : (
        <div className="login-cards">
          {users.map((user) => (
            <button key={user.id} className="login-card" onClick={() => onLogin(user)}>
              <UserAvatar name={user.first_name} path={user.avatar_path} />
              <span className="login-card-text">
                <span className="login-card-name">{fullName(user)}</span>
                {user.bio && <span className="login-card-bio">{user.bio}</span>}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
