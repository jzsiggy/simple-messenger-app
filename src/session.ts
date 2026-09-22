const KEY = 'chat.userId'

export function loadUserId(): number | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw === null) return null
    const id = Number(raw)
    return Number.isFinite(id) ? id : null
  } catch {
    return null
  }
}

export function saveUserId(id: number): void {
  try {
    localStorage.setItem(KEY, String(id))
  } catch {
    // storage unavailable (private window etc.) — login just won't persist
  }
}

export function clearUserId(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}
