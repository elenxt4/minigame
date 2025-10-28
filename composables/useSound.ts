import { ref } from 'vue'

// Lightweight WebAudio-based sound helper. Client-only.
export function useSound() {
  const ctxRef = ref<AudioContext | null>(null)

  function ctx() {
    if (ctxRef.value) return ctxRef.value
    // create context on first use (user gesture may be required)
    try {
      ctxRef.value = new (window.AudioContext || (window as any).webkitAudioContext)()
      return ctxRef.value
    } catch (e) {
      return null
    }
  }

  function playTone(frequency = 440, duration = 0.12, type: OscillatorType = 'sine', gain = 0.08) {
    const c = ctx()
    if (!c) return
    const o = c.createOscillator()
    const g = c.createGain()
    o.type = type
    o.frequency.value = frequency
    g.gain.value = gain
    o.connect(g)
    g.connect(c.destination)
    const now = c.currentTime
    o.start(now)
    g.gain.setValueAtTime(gain, now)
    g.gain.exponentialRampToValueAtTime(0.001, now + duration)
    o.stop(now + duration + 0.02)
  }

  function playError() {
    // short descending tone + small noise burst
    const c = ctx()
    if (!c) return
    // descending tones
    playTone(520, 0.08, 'sawtooth', 0.06)
    setTimeout(() => playTone(380, 0.1, 'sawtooth', 0.06), 70)
  }

  function playClick() {
    playTone(900, 0.06, 'square', 0.04)
  }

  function playSuccess() {
    // a little arpeggio to sound pleasant
    const freqs = [660, 880, 990]
    freqs.forEach((f, i) => setTimeout(() => playTone(f, 0.12, 'triangle', 0.06), i * 110))
  }

  function playApplause() {
    // approximate applause by short random clicks using noise
    const c = ctx()
    if (!c) return
    const duration = 700
    const now = c.currentTime
    const bufferSize = c.sampleRate * 0.05
    for (let i = 0; i < 8; i++) {
      const b = c.createBuffer(1, bufferSize, c.sampleRate)
      const data = b.getChannelData(0)
      for (let j = 0; j < bufferSize; j++) data[j] = (Math.random() * 2 - 1) * Math.pow(1 - j / bufferSize, 2)
      const src = c.createBufferSource()
      src.buffer = b
      const g = c.createGain()
      g.gain.value = 0.06 * Math.random()
      src.connect(g)
      g.connect(c.destination)
      src.start(now + Math.random() * 0.4)
      src.stop(now + 0.6 + Math.random() * 0.2)
    }
  }

  return { playError, playClick, playSuccess, playApplause }
}
