export function startOrbitLoop(
  setCameraOrbit: (s: string) => void,
  orbitA: string,
  orbitB: string,
  duration = 3000
) {
  let rafId: number | undefined
  let stopped = false

  function parseOrbit(orbitStr: string) {
    const parts = orbitStr.split(/\s+/)
    const az = parseFloat(parts[0].replace('deg', ''))
    const el = parseFloat(parts[1].replace('deg', ''))
    const r = parseFloat(parts[2].replace('m', ''))
    return { az, el, r }
  }

  function formatOrbit({ az, el, r }: { az: number; el: number; r: number }) {
    return `${az.toFixed(2)}deg ${el.toFixed(2)}deg ${r.toFixed(2)}m`
  }

  // smoother easing: sine-based easeInOut
  function easeInOutSine(t: number) {
    return 0.5 * (1 - Math.cos(Math.PI * t))
  }

  // continuous RAF loop that ping-pongs progress between 0..1 smoothly using sine easing
  const from = parseOrbit(orbitA)
  const to = parseOrbit(orbitB)
  const fullPeriod = duration * 2 // A->B (duration) then B->A (duration)
  const startTime = performance.now()

  function step(now: number) {
    if (stopped) return
    const elapsed = now - startTime
    // progress along the full period [0, fullPeriod)
    const phase = (elapsed % fullPeriod) / duration // ranges [0,2)
    // ping-pong to [0,1]
    const p = phase <= 1 ? phase : 2 - phase

    const eased = easeInOutSine(p)

    const current = {
      az: from.az + (to.az - from.az) * eased,
      el: from.el + (to.el - from.el) * eased,
      r: from.r + (to.r - from.r) * eased,
    }

    setCameraOrbit(formatOrbit(current))
    rafId = requestAnimationFrame(step)
  }

  rafId = requestAnimationFrame(step)

  return {
    stop() {
      stopped = true
      if (rafId) {
        cancelAnimationFrame(rafId)
        rafId = undefined
      }
    },
  }
}

export type OrbitController = ReturnType<typeof startOrbitLoop>

export function attachOrbitToScroll(
  setCameraOrbit: (s: string) => void,
  orbitA: string,
  orbitB: string
) {
  let rafId: number | undefined
  let lastKnownScroll = 0
  let ticking = false
  let attached = true

  function parseOrbit(orbitStr: string) {
    const parts = orbitStr.split(/\s+/)
    const az = parseFloat(parts[0].replace('deg', ''))
    const el = parseFloat(parts[1].replace('deg', ''))
    const r = parseFloat(parts[2].replace('m', ''))
    return { az, el, r }
  }

  function formatOrbit({ az, el, r }: { az: number; el: number; r: number }) {
    return `${az.toFixed(2)}deg ${el.toFixed(2)}deg ${r.toFixed(2)}m`
  }

  function easeInOutSine(t: number) {
    return 0.5 * (1 - Math.cos(Math.PI * t))
  }

  const from = parseOrbit(orbitA)
  const to = parseOrbit(orbitB)

  function update() {
    ticking = false
    const doc = document.documentElement
    const maxScroll = Math.max(1, doc.scrollHeight - window.innerHeight)
    const progress = Math.min(1, Math.max(0, lastKnownScroll / maxScroll))
    const eased = easeInOutSine(progress)

    const current = {
      az: from.az + (to.az - from.az) * eased,
      el: from.el + (to.el - from.el) * eased,
      r: from.r + (to.r - from.r) * eased,
    }

    setCameraOrbit(formatOrbit(current))
  }

  function onScroll() {
    if (!attached) return
    lastKnownScroll = window.scrollY || window.pageYOffset
    if (!ticking) {
      ticking = true
      rafId = requestAnimationFrame(update)
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true })

  // initialize to current scroll position
  lastKnownScroll = window.scrollY || window.pageYOffset
  rafId = requestAnimationFrame(update)

  return {
    detach() {
      attached = false
      window.removeEventListener('scroll', onScroll)
      if (rafId) {
        cancelAnimationFrame(rafId)
        rafId = undefined
      }
    },
  }
}

export type ScrollController = ReturnType<typeof attachOrbitToScroll>
