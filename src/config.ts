interface Config {
  supabaseUrl: string
  supabaseKey: string
  lang: string
  chatName: string
}

function required(name: string): string {
  const value = import.meta.env[name] as string | undefined
  if (!value) {
    throw new Error(`Missing required env var ${name} — copy .env.example to .env and fill it in.`)
  }
  return value
}

export const config: Config = {
  supabaseUrl: required('VITE_SUPABASE_URL').replace(/\/$/, ''),
  supabaseKey: required('VITE_SUPABASE_KEY'),
  lang: (import.meta.env.VITE_LANG as string | undefined) ?? 'en',
  chatName: (import.meta.env.VITE_CHAT_NAME as string | undefined) ?? 'Chat',
}
