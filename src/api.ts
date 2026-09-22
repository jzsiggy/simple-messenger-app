import { config } from './config'
import type { Message, User } from './types'

const authHeaders = {
  apikey: config.supabaseKey,
  Authorization: `Bearer ${config.supabaseKey}`,
}

export async function loadMessages(): Promise<Message[]> {
  const query =
    'select=id,sender,content,created_at,audio_path,users(first_name,avatar_path)&order=id.desc&limit=200'
  const res = await fetch(`${config.supabaseUrl}/rest/v1/messages?${query}`, {
    headers: authHeaders,
  })
  if (!res.ok) {
    throw new Error(`Failed to load messages (HTTP ${res.status})`)
  }
  const rows = (await res.json()) as Message[]
  return rows.reverse()
}

export async function loadUsers(): Promise<User[]> {
  const res = await fetch(
    `${config.supabaseUrl}/rest/v1/users?select=id,first_name,last_name,avatar_path,bio&order=id`,
    { headers: authHeaders },
  )
  if (!res.ok) {
    throw new Error(`Failed to load users (HTTP ${res.status})`)
  }
  return res.json()
}

export async function sendMessage(
  content: string,
  audioPath: string | null,
  senderId: number,
): Promise<void> {
  const res = await fetch(`${config.supabaseUrl}/rest/v1/messages`, {
    method: 'POST',
    headers: {
      ...authHeaders,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      sender: senderId,
      content,
      audio_path: audioPath,
    }),
  })
  if (res.status !== 201) {
    throw new Error(`Failed to send message (HTTP ${res.status})`)
  }
}

export async function transcribe(blob: Blob, ext: string): Promise<string> {
  const form = new FormData()
  form.append('file', blob, `recording.${ext}`)
  form.append('language', config.lang)
  const res = await fetch(`${config.supabaseUrl}/functions/v1/transcribe`, {
    method: 'POST',
    headers: authHeaders,
    body: form,
  })
  const body = (await res.json().catch(() => null)) as { text?: string; error?: string } | null
  if (!res.ok || !body || typeof body.text !== 'string') {
    throw new Error(body?.error ?? `Transcription failed (HTTP ${res.status})`)
  }
  return body.text
}

/** Uploads the blob; returns the stored path for audio_path, or null on failure. */
export async function uploadAudio(blob: Blob, ext: string, userId: number): Promise<string | null> {
  const path = `${userId}/${Date.now()}.${ext}`
  try {
    const res = await fetch(
      `${config.supabaseUrl}/storage/v1/object/voice-messages/${path}`,
      {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': blob.type || 'application/octet-stream' },
        body: blob,
      },
    )
    return res.ok ? path : null
  } catch {
    return null
  }
}

export async function fetchAudio(audioPath: string): Promise<Blob> {
  const res = await fetch(
    `${config.supabaseUrl}/storage/v1/object/voice-messages/${audioPath}`,
    { headers: authHeaders },
  )
  if (!res.ok) {
    throw new Error(`Failed to fetch audio (HTTP ${res.status})`)
  }
  return res.blob()
}
