import { useCallback, useEffect, useRef, useState } from 'react'

export interface Recording {
  blob: Blob
  ext: 'webm' | 'm4a'
}

function pickFormat(): { mimeType: string; ext: 'webm' | 'm4a' } {
  if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
    return { mimeType: 'audio/webm;codecs=opus', ext: 'webm' }
  }
  return { mimeType: 'audio/mp4', ext: 'm4a' }
}

export function useRecorder() {
  const [recording, setRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const extRef = useRef<'webm' | 'm4a'>('webm')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null
    recorderRef.current?.stream.getTracks().forEach((t) => t.stop())
    recorderRef.current = null
    setRecording(false)
    setElapsed(0)
  }, [])

  useEffect(() => cleanup, [cleanup])

  /** Throws if the mic is unavailable or permission is denied. */
  const start = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const { mimeType, ext } = pickFormat()
    const recorder = new MediaRecorder(stream, { mimeType })
    chunksRef.current = []
    extRef.current = ext
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }
    recorder.start()
    recorderRef.current = recorder
    setElapsed(0)
    setRecording(true)
    timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000)
  }, [])

  const stop = useCallback((): Promise<Recording | null> => {
    const recorder = recorderRef.current
    if (!recorder || recorder.state === 'inactive') {
      cleanup()
      return Promise.resolve(null)
    }
    return new Promise((resolve) => {
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType })
        cleanup()
        resolve(blob.size > 0 ? { blob, ext: extRef.current } : null)
      }
      recorder.stop()
    })
  }, [cleanup])

  const cancel = useCallback(() => {
    const recorder = recorderRef.current
    if (recorder && recorder.state !== 'inactive') {
      recorder.onstop = null
      recorder.stop()
    }
    cleanup()
  }, [cleanup])

  return { recording, elapsed, start, stop, cancel }
}
