import Phaser from 'phaser'

/**
 * The Starry Night    faithful painterly reproduction
 *
 * Composition is mapped to Van Gogh's original layout:
 *  - Tall cypress         left ~0-18% x, bottom to ~28% from top
 *  - Village + steeple    bottom 22%, centre-right
 *  - Rolling hills        behind village, gentle sine curves
 *  - Sky                  upper ~78%, deep blues
 *  - ONE large swirl      centre of sky (~50%x, 38%y)
 *  - Horizontal wave bands flowing across the sky
 *  - 11 bright stars with concentric yellow halos
 *  - (moon removed)
 *
 * All drawn with Canvas 2D; base is rendered once to a texture,
 * only star twinkle animates each frame via Phaser Graphics overlay.
 */

/*  Deterministic noise  */
function hash(x: number, y: number, s: number): number {
  let h = ((x * 374761 + y * 668265 + s * 982451) | 0) & 0x7fffffff
  h = (((h >> 13) ^ h) * 1274126177) | 0
  return (((h >> 16) ^ h) & 0xffff) / 0xffff
}
function noise(px: number, py: number, s = 0): number {
  const ix = Math.floor(px), iy = Math.floor(py)
  const fx = px - ix, fy = py - iy
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy)
  const a = hash(ix, iy, s), b = hash(ix + 1, iy, s)
  const c = hash(ix, iy + 1, s), d = hash(ix + 1, iy + 1, s)
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy
}
/* ── Colour helpers ── */
function hsl(h: number, s: number, l: number, a = 1): string {
  return `hsla(${h},${s}%,${l}%,${a})`
}

/* 
   Star positions (normalised)  mapped from the
   actual painting's star locations
    */
const STARS: [number, number, number][] = [
  // [nx, ny, relativeSize]   sizes 0.6-1.0
  [0.28, 0.08, 1.0],   // top star left of centre
  [0.42, 0.06, 0.85],  // upper-centre
  [0.56, 0.10, 0.90],  // right of centre
  [0.68, 0.06, 0.80],  // upper-right
  [0.80, 0.09, 0.75],  // far right
  [0.18, 0.15, 0.70],  // left mid
  [0.35, 0.22, 0.80],  // centre-left
  [0.50, 0.20, 0.75],  // centre
  [0.64, 0.18, 0.70],  // right
  [0.78, 0.22, 0.65],  // far right mid
  [0.44, 0.35, 0.65],  // lower sky
]

export class StarryNightScene extends Phaser.Scene {
  private baseSprite?: Phaser.GameObjects.Image
  private starGfx!: Phaser.GameObjects.Graphics
  private frame = 0
  private lastW = 0
  private lastH = 0
  private texId = 0

  constructor() { super({ key: 'StarryNightScene' }) }
  create() { this.starGfx = this.add.graphics() }

  update() {
    this.frame++
    const w = this.scale.width, h = this.scale.height
    if (w < 4 || h < 4) return
    if (w !== this.lastW || h !== this.lastH) {
      this.lastW = w; this.lastH = h
      this.rebuild(w, h)
    }
    if (this.frame % 4 === 0) this.animateStars(w, h)
  }

  /*  REBUILD FULL PAINTING  */
  private rebuild(w: number, h: number) {
    if (this.baseSprite) this.baseSprite.destroy()
    const prev = 'snb-' + this.texId
    if (this.textures.exists(prev)) this.textures.remove(prev)
    this.texId++
    const key = 'snb-' + this.texId

    const cvs = document.createElement('canvas')
    cvs.width = w; cvs.height = h
    const ctx = cvs.getContext('2d')!

    this.drawSky(ctx, w, h)
    this.drawSkyBands(ctx, w, h)
    this.drawLargeSwirl(ctx, w, h)
    this.drawSmallSwirls(ctx, w, h)
    this.drawStars(ctx, w, h)
    this.drawMountains(ctx, w, h)
    this.drawHills(ctx, w, h)
    this.drawVillage(ctx, w, h)
    this.drawCypress(ctx, w, h)

    this.textures.addCanvas(key, cvs)
    this.baseSprite = this.add.image(w / 2, h / 2, key).setDepth(0)
    this.starGfx.setDepth(1)
  }

  /*  1. Sky base gradient  */
  private drawSky(c: CanvasRenderingContext2D, w: number, h: number) {
    const g = c.createLinearGradient(0, 0, 0, h * 0.78)
    g.addColorStop(0.0, '#0a0e28')
    g.addColorStop(0.2, '#0c1848')
    g.addColorStop(0.4, '#102868')
    g.addColorStop(0.6, '#183888')
    g.addColorStop(0.8, '#1840a0')
    g.addColorStop(1.0, '#1438a0')
    c.fillStyle = g
    c.fillRect(0, 0, w, h)
  }

  /*  2. Flowing horizontal wave-bands (the characteristic wavy sky)  */
  private drawSkyBands(c: CanvasRenderingContext2D, w: number, h: number) {
    const skyH = h * 0.78
    // Multiple horizontal flowing bands at different heights
    const bands: [number, number, number, number, number][] = [
      // [normY, amplitude, wavelength, hue, lightness]
      [0.06, 0.012, 3.2, 215, 18],
      [0.14, 0.018, 2.8, 220, 22],
      [0.22, 0.020, 2.5, 212, 28],
      [0.30, 0.015, 3.0, 210, 32],
      [0.44, 0.022, 2.2, 205, 26],
      [0.52, 0.018, 2.6, 218, 22],
      [0.58, 0.025, 2.0, 200, 35],
      [0.65, 0.020, 2.4, 215, 24],
      [0.72, 0.015, 2.8, 220, 20],
    ]

    c.lineCap = 'round'
    for (const [bandY, amp, wl, hue, lit] of bands) {
      const baseY = bandY * skyH
      // Draw multiple stroked lines to simulate thick brush strokes
      for (let pass = 0; pass < 12; pass++) {
        const yOff = (pass - 6) * skyH * 0.006
        const phase = pass * 0.4
        const litVar = lit + (pass - 6) * 1.5
        const alpha = 0.15 + (1 - Math.abs(pass - 6) / 6) * 0.35

        c.beginPath()
        c.strokeStyle = hsl(hue + pass * 0.8, 65 + pass * 2, litVar, alpha)
        c.lineWidth = skyH * amp * 0.4

        for (let x = 0; x <= w; x += 3) {
          const nx = x / w
          const wave = Math.sin(nx * wl * Math.PI + phase) * skyH * amp
            + Math.sin(nx * wl * 1.7 * Math.PI + phase * 1.3) * skyH * amp * 0.4
            + noise(nx * 4, bandY * 3, pass) * skyH * amp * 0.5
          const y = baseY + yOff + wave
          x === 0 ? c.moveTo(x, y) : c.lineTo(x, y)
        }
        c.stroke()
      }
    }

    // Many short directional brush strokes overlaid to add texture
    const N = Math.min(8000, Math.round(w * skyH / 12))
    for (let i = 0; i < N; i++) {
      const px = hash(i, 10, 88) * w
      const py = hash(i, 11, 88) * skyH
      const nx = px / w, ny = py / skyH

      // Strokes follow horizontal flow, curving near swirl areas
      let angle = noise(nx * 3, ny * 2, 5) * 0.5 - 0.25
      // Deflect near the big central swirl
      const dx = nx - 0.48, dy = ny - 0.50
      const d = Math.sqrt(dx * dx + dy * dy)
      if (d < 0.35 && d > 0.01) {
        const tangent = Math.atan2(dy, dx) + Math.PI * 0.5
        const inf = (1 - d / 0.35)
        angle = angle * (1 - inf) + tangent * inf
      }

      const len = 4 + hash(i, 12, 88) * 14
      const ex = px + Math.cos(angle) * len
      const ey = py + Math.sin(angle) * len

      const nv = noise(nx * 5, ny * 4, 3)
      const hue = 205 + nv * 30
      const sat = 50 + nv * 35
      const lit = 12 + ny * 30 + nv * 18
      const a = 0.06 + hash(i, 13, 88) * 0.18

      c.strokeStyle = hsl(hue, sat, lit, a)
      c.lineWidth = 1 + hash(i, 14, 88) * 3.5
      c.beginPath()
      c.moveTo(px, py)
      c.lineTo(ex, ey)
      c.stroke()
    }
  }

  /*  3. The large iconic swirl cloud (centre of sky)  */
  private drawLargeSwirl(c: CanvasRenderingContext2D, w: number, h: number) {
    const cx = w * 0.48, cy = h * 0.38
    const maxR = Math.min(w, h) * 0.17
    this.drawSwirlCloud(c, cx, cy, maxR, 1, 700)
  }

  /*  4. Smaller swirling cloud formations  */
  private drawSmallSwirls(c: CanvasRenderingContext2D, w: number, h: number) {
    const smalls: [number, number, number, number][] = [
      // [nx, ny, rFactor, dir]
      [0.22, 0.16, 0.06, -1],
      [0.70, 0.14, 0.055, 1],
      [0.35, 0.52, 0.05, -1],
      [0.62, 0.50, 0.048, 1],
      [0.82, 0.32, 0.042, -1],
    ]
    for (const [nx, ny, rf, dir] of smalls) {
      const r = Math.min(w, h) * rf
      this.drawSwirlCloud(c, nx * w, ny * h, r, dir, 250)
    }
  }

  /**
   * Draw a swirl as a cloud of many short curved brush strokes
   * that follow circular flow around the centre — NOT a geometric spiral.
   * This produces a soft, cloudy, painterly vortex.
   */
  private drawSwirlCloud(
    c: CanvasRenderingContext2D,
    cx: number, cy: number, maxR: number,
    dir: number, strokeCount: number
  ) {
    c.lineCap = 'round'

    // Soft radial glow underneath to give the swirl body
    const glow = c.createRadialGradient(cx, cy, maxR * 0.1, cx, cy, maxR * 1.1)
    glow.addColorStop(0.0, 'rgba(80,140,220,0.18)')
    glow.addColorStop(0.4, 'rgba(50,100,200,0.10)')
    glow.addColorStop(1.0, 'rgba(20,50,140,0)')
    c.fillStyle = glow
    c.beginPath()
    c.arc(cx, cy, maxR * 1.1, 0, Math.PI * 2)
    c.fill()

    // Many short arc strokes following circular flow
    for (let i = 0; i < strokeCount; i++) {
      // Place stroke at random radius and angle
      const rFrac = hash(i, 100, 42)           // 0..1 normalised radius
      const r = maxR * (0.08 + rFrac * 0.95)
      const baseAngle = hash(i, 101, 42) * Math.PI * 2

      // Arc length: inner strokes are shorter, outer ones longer
      const arcLen = (0.3 + rFrac * 0.7) * (0.4 + hash(i, 102, 42) * 0.8)

      // Colour: inner → brighter/lighter cyan-white, outer → deeper blue
      const innerFrac = 1 - rFrac
      const hue = 205 + innerFrac * 15 + hash(i, 103, 42) * 10
      const sat = 50 + innerFrac * 35 + hash(i, 104, 42) * 10
      const lit = 15 + innerFrac * 55 + hash(i, 105, 42) * 10
      const alpha = 0.08 + innerFrac * 0.30 + hash(i, 106, 42) * 0.12

      c.strokeStyle = hsl(hue, sat, lit, alpha)
      c.lineWidth = (1.5 + innerFrac * 5 + hash(i, 107, 42) * 3) * (maxR / 80)

      // Draw a short curved arc
      const steps = 8
      c.beginPath()
      for (let s = 0; s <= steps; s++) {
        const t = s / steps
        const angle = baseAngle + t * arcLen * dir
        // Slight radius wobble for organic feel
        const wobble = Math.sin(angle * 5 + i) * maxR * 0.02
        const x = cx + (r + wobble) * Math.cos(angle)
        const y = cy + (r + wobble) * Math.sin(angle)
        s === 0 ? c.moveTo(x, y) : c.lineTo(x, y)
      }
      c.stroke()
    }

    // Bright centre highlight
    const coreGlow = c.createRadialGradient(cx, cy, 0, cx, cy, maxR * 0.25)
    coreGlow.addColorStop(0.0, 'rgba(180,210,255,0.20)')
    coreGlow.addColorStop(0.5, 'rgba(120,170,240,0.08)')
    coreGlow.addColorStop(1.0, 'rgba(60,100,200,0)')
    c.fillStyle = coreGlow
    c.beginPath()
    c.arc(cx, cy, maxR * 0.25, 0, Math.PI * 2)
    c.fill()
  }

  /*  5. Stars with concentric yellow/white halos  */
  private drawStars(c: CanvasRenderingContext2D, w: number, h: number) {
    const skyH = h * 0.78
    for (const [nx, ny, sz] of STARS) {
      const sx = nx * w, sy = ny * skyH
      const baseR = Math.min(w, h) * 0.024 * sz

      // Outer glow
      const g3 = c.createRadialGradient(sx, sy, baseR * 1.5, sx, sy, baseR * 5)
      g3.addColorStop(0, 'rgba(200,180,60,0.15)')
      g3.addColorStop(1, 'rgba(100,120,180,0)')
      c.fillStyle = g3
      c.beginPath()
      c.arc(sx, sy, baseR * 5, 0, Math.PI * 2)
      c.fill()

      // Concentric rings (characteristic of the painting)
      const rings = 4
      for (let r = rings; r >= 0; r--) {
        const rr = baseR * (0.3 + r * 0.55)
        const litFactor = 1 - r / (rings + 1)
        c.beginPath()
        c.arc(sx, sy, rr, 0, Math.PI * 2)
        if (r === 0) {
          c.fillStyle = `rgba(255,255,240,0.95)`
        } else if (r <= 1) {
          c.fillStyle = `rgba(255,248,140,${0.7 * litFactor})`
        } else if (r <= 2) {
          c.fillStyle = `rgba(248,220,60,${0.45 * litFactor})`
        } else {
          c.fillStyle = `rgba(200,180,50,${0.25 * litFactor})`
        }
        c.fill()

        // Ring outline stroke (visible concentric circles like in the painting)
        if (r > 0) {
          c.strokeStyle = `rgba(240,210,80,${0.3 * litFactor})`
          c.lineWidth = 1.5
          c.stroke()
        }
      }

      // Bright white-yellow core
      c.fillStyle = 'rgba(255,255,230,1)'
      c.beginPath()
      c.arc(sx, sy, baseR * 0.25, 0, Math.PI * 2)
      c.fill()
    }
  }

  /*  7. Distant blue mountains  */
  private drawMountains(c: CanvasRenderingContext2D, w: number, h: number) {
    const baseY = h * 0.72
    c.beginPath()
    c.moveTo(0, h)
    for (let x = 0; x <= w; x += 2) {
      const nx = x / w
      const y = baseY
        - Math.sin(nx * 2.5 + 0.8) * h * 0.04
        - Math.sin(nx * 5 + 1.5) * h * 0.015
        - noise(nx * 3, 0.7, 30) * h * 0.02
      c.lineTo(x, y)
    }
    c.lineTo(w, h)
    c.closePath()
    const g = c.createLinearGradient(0, baseY - h * 0.06, 0, h)
    g.addColorStop(0, '#142848')
    g.addColorStop(0.2, '#0e2038')
    g.addColorStop(1, '#081020')
    c.fillStyle = g
    c.fill()
  }

  /*  8. Rolling green-dark hills  */
  private drawHills(c: CanvasRenderingContext2D, w: number, h: number) {
    const baseY = h * 0.78
    c.beginPath()
    c.moveTo(0, h)
    for (let x = 0; x <= w; x += 2) {
      const nx = x / w
      const y = baseY
        + Math.sin(nx * 6 + 0.9) * h * 0.022
        + Math.sin(nx * 3 + 2) * h * 0.015
        + noise(nx * 5, 0.5, 42) * h * 0.018
      c.lineTo(x, y)
    }
    c.lineTo(w, h)
    c.closePath()
    const g = c.createLinearGradient(0, baseY, 0, h)
    g.addColorStop(0, '#0c2018')
    g.addColorStop(0.4, '#081810')
    g.addColorStop(1, '#050e0a')
    c.fillStyle = g
    c.fill()

    // Hill brush-stroke texture
    const N = Math.min(1500, Math.round(w * h * 0.22 / 30))
    c.lineCap = 'round'
    for (let i = 0; i < N; i++) {
      const px = hash(i, 20, 77) * w
      const py = baseY + hash(i, 21, 77) * h * 0.22
      if (py < baseY - h * 0.02) continue
      const len = 3 + hash(i, 22, 77) * 8
      const angle = -0.1 + hash(i, 23, 77) * 0.2
      const nv = noise(px / w * 4, py / h * 3, 77)
      c.strokeStyle = hsl(140 + nv * 40, 25 + nv * 20, 6 + nv * 8, 0.15 + hash(i, 24, 77) * 0.2)
      c.lineWidth = 1 + hash(i, 25, 77) * 2.5
      c.beginPath()
      c.moveTo(px, py)
      c.lineTo(px + Math.cos(angle) * len, py + Math.sin(angle) * len)
      c.stroke()
    }
  }

  /*  9. Village with church steeple  */
  private drawVillage(c: CanvasRenderingContext2D, w: number, h: number) {
    const base = h * 0.88

    // Church steeple (the tallest element in the village)
    const sx = w * 0.50
    c.fillStyle = '#060c14'
    c.beginPath()
    c.moveTo(sx, h * 0.62)
    c.lineTo(sx - w * 0.008, base)
    c.lineTo(sx + w * 0.008, base)
    c.closePath()
    c.fill()
    // Church body
    c.fillRect(sx - w * 0.014, base - h * 0.04, w * 0.028, h * 0.04)

    // Houses
    for (let i = 0; i < 40; i++) {
      const bx = w * 0.22 + hash(i, 30, 500) * w * 0.62
      const bw = w * 0.008 + hash(i, 31, 500) * w * 0.018
      const bh = h * 0.010 + hash(i, 32, 500) * h * 0.032

      // Skip region near church steeple
      if (Math.abs(bx - sx) < w * 0.025) continue

      c.fillStyle = '#050a14'
      c.fillRect(bx, base - bh, bw, bh + h * 0.04)

      // Rooftops (triangles)
      c.beginPath()
      c.moveTo(bx - bw * 0.1, base - bh)
      c.lineTo(bx + bw * 0.5, base - bh - h * 0.012)
      c.lineTo(bx + bw * 1.1, base - bh)
      c.closePath()
      c.fillStyle = '#070e1a'
      c.fill()

      // Lit windows (warm yellow)
      if (hash(i, 33, 500) > 0.45) {
        const wy = base - bh * 0.5
        const wx = bx + bw * 0.25
        const ww = bw * 0.3
        const wh = bh * 0.22
        c.fillStyle = `rgba(248,218,70,${0.4 + hash(i, 34, 500) * 0.5})`
        c.fillRect(wx, wy, ww, wh)
        // Window glow
        const gg = c.createRadialGradient(wx + ww / 2, wy + wh / 2, 0, wx + ww / 2, wy + wh / 2, bw)
        gg.addColorStop(0, 'rgba(248,218,70,0.15)')
        gg.addColorStop(1, 'rgba(248,218,70,0)')
        c.fillStyle = gg
        c.beginPath()
        c.arc(wx + ww / 2, wy + wh / 2, bw, 0, Math.PI * 2)
        c.fill()
      }
    }

    // Ground strip
    c.fillStyle = '#040a10'
    c.fillRect(0, base, w, h - base)
  }

  /*  10. Cypress tree (tall dark flame shape, left foreground)  */
  private drawCypress(c: CanvasRenderingContext2D, w: number, h: number) {
    const cx = w * 0.12
    const topY = h * 0.04
    const botY = h * 0.92
    const maxHW = w * 0.035
    const N = 120

    // Main shape
    c.beginPath()
    c.moveTo(cx, topY)
    // Left edge
    for (let i = 0; i <= N; i++) {
      const t = i / N
      const y = topY + t * (botY - topY)
      const hw = t * t * maxHW
      const wave = Math.sin(t * 28) * maxHW * 0.12
        + Math.sin(t * 18 + 1) * maxHW * 0.08
        + Math.sin(t * 45 + 2) * maxHW * 0.04
      c.lineTo(cx - hw + wave, y)
    }
    // Right edge
    for (let i = N; i >= 0; i--) {
      const t = i / N
      const y = topY + t * (botY - topY)
      const hw = t * t * maxHW
      const wave = Math.sin(t * 28 + 1.5) * maxHW * 0.12
        + Math.sin(t * 18 + 3) * maxHW * 0.08
        + Math.sin(t * 45 + 4) * maxHW * 0.04
      c.lineTo(cx + hw + wave, y)
    }
    c.closePath()

    // Dark green gradient
    const g = c.createLinearGradient(cx - maxHW, 0, cx + maxHW, 0)
    g.addColorStop(0, '#020a04')
    g.addColorStop(0.3, '#041408')
    g.addColorStop(0.5, '#061a0c')
    g.addColorStop(0.7, '#041408')
    g.addColorStop(1, '#020a04')
    c.fillStyle = g
    c.fill()

    // Internal swirling brush strokes (the cypress in the painting has visible vertical swirl strokes)
    c.save()
    c.clip()
    const strokes = Math.min(600, Math.round(maxHW * (botY - topY) / 3))
    c.lineCap = 'round'
    for (let i = 0; i < strokes; i++) {
      const t = hash(i, 50, 66)
      const y = topY + t * (botY - topY)
      const hw = (t * t) * maxHW * 0.85
      const px = cx + (hash(i, 51, 66) - 0.5) * hw * 2
      const py = y
      // Upward swirling strokes
      const angle = -Math.PI / 2 + Math.sin(t * 15) * 0.6 + (hash(i, 52, 66) - 0.5) * 0.4
      const len = 4 + hash(i, 53, 66) * 10
      const nv = noise(px / w * 8, py / h * 6, 66)
      c.strokeStyle = hsl(130 + nv * 30, 30 + nv * 25, 5 + nv * 10, 0.2 + hash(i, 54, 66) * 0.25)
      c.lineWidth = 1 + hash(i, 55, 66) * 3
      c.beginPath()
      c.moveTo(px, py)
      c.lineTo(px + Math.cos(angle) * len, py + Math.sin(angle) * len)
      c.stroke()
    }
    c.restore()
  }

  /*  Animated star twinkle (Phaser Graphics overlay)  */
  private animateStars(w: number, h: number) {
    const g = this.starGfx
    g.clear()
    const t = this.frame * 0.015
    const skyH = h * 0.78

    for (const [nx, ny, sz] of STARS) {
      const sx = nx * w, sy = ny * skyH
      const baseR = Math.min(w, h) * 0.024 * sz
      const pulse = 0.6 + Math.sin(t * (0.8 + sz * 0.5) + nx * 18 + ny * 12) * 0.4
      const a = pulse

      // Outer warm glow
      g.fillStyle(0xf0d830, a * 0.12)
      g.fillCircle(sx, sy, baseR * 4 * pulse)

      // Mid glow
      g.fillStyle(0xf8e050, a * 0.25)
      g.fillCircle(sx, sy, baseR * 2 * pulse)

      // Inner bright
      g.fillStyle(0xfff8a0, a * 0.55)
      g.fillCircle(sx, sy, baseR * 0.9 * pulse)

      // Core
      g.fillStyle(0xffffff, a * 0.85)
      g.fillCircle(sx, sy, baseR * 0.28 * pulse)
    }

  }
}
