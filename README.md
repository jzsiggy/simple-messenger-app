# E-ink Walkie-Talkie — Web Messenger

A private, WhatsApp-style single-page web client for the existing Supabase backend.
Text messages, voice recording with server-side transcription (reviewed before send),
and playback of voice messages from the private `voice-messages` bucket.

## Setup

```sh
cp .env.example .env   # fill in your Supabase URL, anon key, user id, language, chat name
npm install
npm run dev
```

## Avatar images

Drop image files (png/jpg/jpeg/gif/webp/avif/svg) into `public/avatars/`.
The header avatar picks one at random on every page load; with no images
present it falls back to the chat name's initial. The dev server picks up
new files automatically; production builds bake in the list at build time.

## Notes

- All backend access goes through plain `fetch` against Supabase REST / Functions /
  Storage endpoints (`src/api.ts`) using the publishable (anon) key — no server code here.
- The thread polls every 20 s and on tab focus; re-renders are skipped when nothing changed.
- Voice flow: mic → record → transcribe (Edge Function) → transcript lands in the input
  for review — never auto-sent. On send, the audio uploads best-effort; if the upload
  fails the text still goes out with `audio_path: null`.
- Recording uses `audio/webm` (Chrome/Firefox) or `audio/mp4` → `.m4a` (Safari).
