import { useEffect, useRef, useState } from 'react'

const BAR_COUNT = 28

export function useVoiceAnalyser(stream: MediaStream | null, active: boolean) {
  const [levels, setLevels] = useState<number[]>(() => Array(BAR_COUNT).fill(0.08))
  const frameRef = useRef(0)

  useEffect(() => {
    if (!stream || !active) {
      setLevels(Array(BAR_COUNT).fill(0.08))
      return
    }

    const audioContext = new AudioContext()
    const source = audioContext.createMediaStreamSource(stream)
    const analyser = audioContext.createAnalyser()
    analyser.fftSize = 128
    analyser.smoothingTimeConstant = 0.82
    analyser.minDecibels = -90
    analyser.maxDecibels = -10
    source.connect(analyser)

    const buffer = new Uint8Array(analyser.frequencyBinCount)

    const tick = () => {
      analyser.getByteFrequencyData(buffer)
      const step = Math.max(1, Math.floor(buffer.length / BAR_COUNT))
      const next = Array.from({ length: BAR_COUNT }, (_, index) => {
        const value = buffer[index * step] ?? 0
        return Math.max(0.08, value / 255)
      })
      setLevels(next)
      frameRef.current = requestAnimationFrame(tick)
    }

    frameRef.current = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(frameRef.current)
      source.disconnect()
      void audioContext.close()
    }
  }, [stream, active])

  return levels
}
