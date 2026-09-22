// Drop image files into public/avatars/ — one is picked at random on each page load.
// The list is discovered at dev/build time via import.meta.glob; the dev server
// reloads automatically when files are added or removed.
const images = import.meta.glob('/public/avatars/*.{png,jpg,jpeg,gif,webp,avif,svg}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

const urls = Object.values(images)

export const randomAvatarUrl: string | null =
  urls.length > 0 ? urls[Math.floor(Math.random() * urls.length)] : null
