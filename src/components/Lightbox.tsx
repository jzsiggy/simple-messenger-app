import { useEffect, useState } from 'react'

// Module-level opener so any component can trigger the single mounted lightbox.
let openFn: ((url: string) => void) | null = null

export function openLightbox(url: string) {
  openFn?.(url)
}

export function Lightbox() {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    openFn = setUrl
    return () => {
      openFn = null
    }
  }, [])

  useEffect(() => {
    if (!url) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setUrl(null)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [url])

  if (!url) return null
  return (
    <div className="lightbox" role="dialog" aria-modal="true" onClick={() => setUrl(null)}>
      <img src={url} alt="" />
    </div>
  )
}
