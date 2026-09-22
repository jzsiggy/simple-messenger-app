import { config } from './config'

export interface User {
  id: number
  first_name: string
  last_name: string | null
  avatar_path: string | null
  bio: string | null
}

export interface Message {
  id: number
  sender: number
  content: string
  created_at: string
  audio_path: string | null
  users: { first_name: string; avatar_path: string | null } | null
}

export function senderName(message: Message): string {
  return message.users?.first_name ?? `#${message.sender}`
}

export function fullName(user: User): string {
  return [user.first_name, user.last_name].filter(Boolean).join(' ')
}

export function avatarPublicUrl(path: string | null | undefined): string | null {
  if (!path) return null
  return `${config.supabaseUrl}/storage/v1/object/public/avatars/${path}`
}
