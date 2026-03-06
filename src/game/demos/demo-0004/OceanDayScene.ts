import Phaser from 'phaser'

/*
 * OceanDayScene — "World Oceans Day" banner
 *
 * Layout: Left white panel (title + text) | Right underwater illustration
 * The divider is an organic wavy edge.
 */

type P = { x: number; y: number }

interface Bubble { x: number; y: number; r: number; speed: number; alpha: number }
interface Fish   { x: number; y: number; dir: 1 | -1; speed: number; size: number; depth: number }

export class OceanDayScene extends Phaser.Scene {
  private gfx!: Phaser.GameObjects.Graphics

  /* animation state */
  private bubbles: Bubble[] = []
  private fish: Fish[] = []
  private whaleBob = 0

  constructor() { super({ key: 'OceanDayScene' }) }

  create() {
    this.gfx = this.add.graphics()
  }

  update(time: number, delta: number) {
    const w = this.scale.width
    const h = this.scale.height
    const t = time * 0.001
    const dt = delta * 0.001

    /* seed bubbles once we know size */
    if (this.bubbles.length === 0) this.seedBubbles(w, h)
    if (this.fish.length === 0)    this.seedFish(w, h)

    /* tick bubbles */
    for (const b of this.bubbles) {
      b.y -= b.speed * dt * h
      if (b.y < -b.r * 2) { b.y = h * 0.95; b.x = this.randomOceanX(w) }
    }

    /* tick fish */
    for (const f of this.fish) {
      f.x += f.dir * f.speed * dt * w
      const edge = w * 0.1
      if (f.x > w + edge) f.x = -edge
      if (f.x < -edge)    f.x = w + edge
    }

    /* whale bob */
    this.whaleBob = Math.sin(t * 0.5) * h * 0.018

    this.gfx.clear()
    this.draw(w, h, t)
  }

  /* ──────────────────────────────── Seed helpers */
  private randomOceanX(w: number) {
    return w * 0.45 + Math.random() * w * 0.55
  }

  private seedBubbles(w: number, h: number) {
    for (let i = 0; i < 22; i++) {
      this.bubbles.push({
        x: this.randomOceanX(w),
        y: Math.random() * h,
        r: 3 + Math.random() * 7,
        speed: 0.06 + Math.random() * 0.09,
        alpha: 0.2 + Math.random() * 0.5,
      })
    }
  }

  private seedFish(w: number, h: number) {
    const configs = [
      { d: h * 0.60, sz: 0.022, sp: 0.10, dir:  1 as const },
      { d: h * 0.65, sz: 0.016, sp: 0.13, dir: -1 as const },
      { d: h * 0.70, sz: 0.013, sp: 0.08, dir:  1 as const },
      { d: h * 0.58, sz: 0.018, sp: 0.11, dir: -1 as const },
    ]
    for (const c of configs) {
      this.fish.push({
        x: this.randomOceanX(w),
        y: c.d,
        dir: c.dir,
        speed: c.sp,
        size: c.sz,
        depth: c.d,
      })
    }
  }

  /* ──────────────────────────────── Main draw */
  private draw(w: number, h: number, t: number) {
    const g = this.gfx

    /* split point x */
    const split = w * 0.40

    /* ── Left panel background (white) ── */
    g.fillStyle(0xffffff, 1)
    g.fillRect(0, 0, split + 10, h)

    /* ── Right panel ocean gradient ── */
    this.drawOceanBg(w, h, split)

    /* ── Organic wave divider (ocean side fills over the split) ── */
    this.drawDivider(w, h, split)

    /* ── Light rays ── */
    this.drawLightRays(w, h, split, t)

    /* ── Ocean floor (coral / seaweed) ── */
    this.drawSeaFloor(w, h)

    /* ── Whale ── */
    this.drawWhale(w, h)

    /* ── Fish ── */
    for (const f of this.fish) this.drawFish(f, h)

    /* ── Bubbles ── */
    for (const b of this.bubbles) {
      g.lineStyle(1.2, 0xffffff, b.alpha)
      g.strokeCircle(b.x, b.y, b.r)
    }

    /* ── Left panel text ── */
    this.drawText(w, h, split)
  }

  /* ──────────────────────────────── Ocean background */
  private drawOceanBg(w: number, h: number, split: number) {
    const g = this.gfx
    /* Horizontal gradient bands — light at top, dark below */
    const bands = [
      { y: 0,    c: 0x5dc8e8, a: 1 },
      { y: 0.18, c: 0x3aafce, a: 1 },
      { y: 0.35, c: 0x2590b8, a: 1 },
      { y: 0.52, c: 0x1572a0, a: 1 },
      { y: 0.68, c: 0x0d5a88, a: 1 },
      { y: 0.82, c: 0x063f6a, a: 1 },
      { y: 1.0,  c: 0x032a50, a: 1 },
    ]
    for (let i = 0; i < bands.length - 1; i++) {
      const y0 = bands[i].y * h
      const y1 = bands[i + 1].y * h
      const steps = Math.ceil((y1 - y0) / 3)
      for (let s = 0; s < steps; s++) {
        const frac = s / steps
        const r0 = (bands[i].c >> 16) & 0xff, g0 = (bands[i].c >> 8) & 0xff, b0 = bands[i].c & 0xff
        const r1 = (bands[i+1].c >> 16) & 0xff, g1 = (bands[i+1].c >> 8) & 0xff, b1 = bands[i+1].c & 0xff
        const r = (r0 + (r1 - r0) * frac) | 0
        const gg = (g0 + (g1 - g0) * frac) | 0
        const b = (b0 + (b1 - b0) * frac) | 0
        g.fillStyle((r << 16) | (gg << 8) | b, 1)
        g.fillRect(split, y0 + s * (y1 - y0) / steps, w - split, (y1 - y0) / steps + 1)
      }
    }
  }

  /* ──────────────────────────────── Organic wave divider */
  private drawDivider(w: number, h: number, split: number) {
    const g = this.gfx
    /* Re-draw a chunk of ocean that bulges left over the white area */
    const pts: P[] = [
      { x: split + w * 0.06, y: 0 },
      { x: split + w * 0.10, y: h * 0.08 },
      { x: split - w * 0.02, y: h * 0.20 },
      { x: split + w * 0.05, y: h * 0.32 },
      { x: split - w * 0.01, y: h * 0.46 },
      { x: split + w * 0.06, y: h * 0.60 },
      { x: split + w * 0.02, y: h * 0.75 },
      { x: split + w * 0.08, y: h * 0.88 },
      { x: split + w * 0.05, y: h },
      { x: w, y: h },
      { x: w, y: 0 },
    ]

    /* Gradient fill — reuse top ocean colour */
    g.fillStyle(0x5dc8e8, 1)
    g.fillPoints(pts, true)

    /* Re-paint ocean gradient over this shape (simple approximation — dark bands) */
    const bands2 = [
      { y: 0,    c: 0x5dc8e8 },
      { y: 0.35, c: 0x2590b8 },
      { y: 0.65, c: 0x0d5a88 },
      { y: 1.0,  c: 0x032a50 },
    ]
    for (let i = 0; i < bands2.length - 1; i++) {
      const y0 = bands2[i].y * h
      const y1 = bands2[i + 1].y * h
      const steps = Math.ceil((y1 - y0) / 4)
      for (let s = 0; s < steps; s++) {
        const frac = s / steps
        const r0 = (bands2[i].c >> 16) & 0xff, g0 = (bands2[i].c >> 8) & 0xff, b0 = bands2[i].c & 0xff
        const r1 = (bands2[i+1].c >> 16) & 0xff, g1 = (bands2[i+1].c >> 8) & 0xff, b1 = bands2[i+1].c & 0xff
        const r = (r0 + (r1 - r0) * frac) | 0
        const gg = (g0 + (g1 - g0) * frac) | 0
        const b = (b0 + (b1 - b0) * frac) | 0
        g.fillStyle((r << 16) | (gg << 8) | b, 1)
        // Clip to divider polygon approx — just fill inside wide enough band
        const segY = y0 + s * (y1 - y0) / steps
        const segH = (y1 - y0) / steps + 1
        // find left edge of curve at this y
        const leftX = this.dividerEdgeX(segY / h, w, split)
        g.fillRect(leftX, segY, w - leftX, segH)
      }
    }

    /* Soft edge highlight */
    g.lineStyle(2, 0xffffff, 0.25)
    g.strokePoints(pts.slice(0, 9), false)
  }

  private dividerEdgeX(fy: number, w: number, split: number): number {
    /* Approximate the organic curve x value at normalized y (0-1) */
    const offsets = [0.06, 0.05, -0.02, 0.04, -0.01, 0.05, 0.01, 0.07, 0.04]
    const n = offsets.length - 1
    const i = Math.min(n - 1, (fy * n) | 0)
    const frac = (fy * n) - i
    const ox = offsets[i] + (offsets[i + 1] - offsets[i]) * frac
    return split + ox * w
  }

  /* ──────────────────────────────── Light rays */
  private drawLightRays(w: number, h: number, split: number, t: number) {
    const g = this.gfx
    const originX = split + (w - split) * 0.45
    const angles = [-0.35, -0.18, 0, 0.18, 0.38]
    for (let i = 0; i < angles.length; i++) {
      const pulse = 0.04 + Math.sin(t * 0.8 + i * 1.2) * 0.025
      const spread = 0.04 + Math.abs(angles[i]) * 0.2
      const lx1 = originX + Math.sin(angles[i] - spread) * h * 1.2
      const lx2 = originX + Math.sin(angles[i] + spread) * h * 1.2
      g.fillStyle(0xffffff, pulse)
      g.fillTriangle(originX, -10, lx1, h * 0.9, lx2, h * 0.9)
    }
  }

  /* ──────────────────────────────── Sea floor */
  private drawSeaFloor(w: number, h: number) {
    const g = this.gfx

    /* Sandy floor base */
    g.fillStyle(0x0a3c5c, 1)
    g.fillRect(w * 0.38, h * 0.86, w * 0.62, h * 0.14)

    /* Coral shapes */
    const corals = [
      { x: 0.52, h: 0.14, c: 0x2e8b8b },
      { x: 0.60, h: 0.10, c: 0x3aafaf },
      { x: 0.67, h: 0.18, c: 0x1f7070 },
      { x: 0.73, h: 0.12, c: 0x4cbfbf },
      { x: 0.80, h: 0.09, c: 0x2a9090 },
      { x: 0.88, h: 0.15, c: 0x1d6060 },
      { x: 0.94, h: 0.11, c: 0x3aafaf },
    ]
    for (const c of corals) {
      const cx = c.x * w
      const cy = h * 0.86
      const ch = c.h * h
      g.fillStyle(c.c, 1)
      /* stem */
      g.fillRect(cx - w * 0.004, cy - ch * 0.6, w * 0.008, ch * 0.6)
      /* branches */
      g.fillTriangle(cx, cy - ch, cx - w * 0.018, cy - ch * 0.4, cx + w * 0.018, cy - ch * 0.4)
      g.fillTriangle(cx - w * 0.008, cy - ch * 0.7, cx - w * 0.025, cy - ch * 0.3, cx, cy - ch * 0.45)
      g.fillTriangle(cx + w * 0.008, cy - ch * 0.7, cx + w * 0.025, cy - ch * 0.3, cx, cy - ch * 0.45)
    }

    /* Rounded pebbles / rocks */
    const rocks = [
      { x: 0.55, r: 0.020, c: 0x0d4a6e },
      { x: 0.70, r: 0.015, c: 0x0a3a58 },
      { x: 0.84, r: 0.012, c: 0x0d4a6e },
    ]
    for (const r of rocks) {
      g.fillStyle(r.c, 1)
      g.fillEllipse(r.x * w, h * 0.90, r.r * w * 2, r.r * w * 0.8)
    }
  }

  /* ──────────────────────────────── Whale */
  private drawWhale(w: number, h: number) {
    const g = this.gfx
    const cx = w * 0.72
    const cy = h * 0.38 + this.whaleBob
    const bw = w * 0.24  // body half-width
    const bh = h * 0.10  // body half-height

    /* Body */
    g.fillStyle(0x3a8fbf, 1)
    g.fillEllipse(cx, cy, bw * 2, bh * 2)

    /* Belly (lighter) */
    g.fillStyle(0x8fd4ef, 1)
    g.fillEllipse(cx + bw * 0.1, cy + bh * 0.2, bw * 1.1, bh * 0.9)

    /* Tail */
    const tx = cx + bw * 0.9
    const ty = cy
    g.fillStyle(0x3a8fbf, 1)
    g.fillTriangle(tx, ty, tx + bw * 0.35, ty - bh * 0.8, tx + bw * 0.35, ty + bh * 0.8)

    /* Pectoral fin */
    g.fillStyle(0x2a7aab, 1)
    g.fillTriangle(
      cx - bw * 0.1, cy + bh * 0.3,
      cx - bw * 0.1 - bw * 0.25, cy + bh * 1.0,
      cx + bw * 0.2, cy + bh * 0.4,
    )

    /* Eye */
    g.fillStyle(0xffffff, 1)
    g.fillCircle(cx - bw * 0.5, cy - bh * 0.12, bh * 0.12)
    g.fillStyle(0x1a4060, 1)
    g.fillCircle(cx - bw * 0.5 + bh * 0.02, cy - bh * 0.12, bh * 0.07)

    /* Mouth curve */
    g.lineStyle(1.5, 0x2a6a8f, 0.7)
    g.beginPath()
    const mx = cx - bw * 0.85
    g.moveTo(mx, cy + bh * 0.05)
    g.lineTo(mx + bw * 0.12, cy + bh * 0.18)
    g.strokePath()

    /* Dorsal fin */
    g.fillStyle(0x2f82af, 1)
    g.fillTriangle(cx, cy - bh, cx - bw * 0.15, cy - bh * 0.25, cx + bw * 0.2, cy - bh * 0.2)
  }

  /* ──────────────────────────────── Fish */
  private drawFish(f: Fish, h: number) {
    const g = this.gfx
    const fl = f.size * h * 0.9   // body length
    const fh = fl * 0.38
    const cx = f.x
    const cy = f.y

    const bodyColor  = 0x4ec9e4
    const finColor   = 0x38a8c8
    const bellyColor = 0xa8e4f0

    const sx = f.dir  /* 1 = right, -1 = left */

    /* Body */
    g.fillStyle(bodyColor, 1)
    g.fillEllipse(cx, cy, fl, fh)
    /* Belly */
    g.fillStyle(bellyColor, 0.7)
    g.fillEllipse(cx + sx * fl * 0.05, cy + fh * 0.1, fl * 0.6, fh * 0.55)

    /* Tail */
    g.fillStyle(finColor, 1)
    g.fillTriangle(
      cx - sx * fl * 0.46, cy,
      cx - sx * fl * 0.78, cy - fh * 0.6,
      cx - sx * fl * 0.78, cy + fh * 0.6,
    )

    /* Eye */
    g.fillStyle(0xffffff, 1)
    g.fillCircle(cx + sx * fl * 0.28, cy - fh * 0.05, fh * 0.22)
    g.fillStyle(0x0a2030, 1)
    g.fillCircle(cx + sx * fl * 0.30, cy - fh * 0.05, fh * 0.12)

    /* Dorsal fin */
    g.fillStyle(finColor, 0.8)
    g.fillTriangle(
      cx + sx * fl * 0.05, cy - fh * 0.48,
      cx + sx * fl * 0.22, cy - fh * 0.12,
      cx - sx * fl * 0.08, cy - fh * 0.12,
    )
  }

  /* ──────────────────────────────── Left text panel */
  private drawText(w: number, h: number, split: number) {
    const g = this.gfx
    const navyC = 0x1a3a5c

    /* ── Title area ── */
    const lines = ['WORLD', 'OCEANS', 'DAY']
    const lineH = h * 0.155
    const titleX = w * 0.05
    const titleY = h * 0.10

    for (let i = 0; i < lines.length; i++) {
      this.drawBoldText(g, lines[i], titleX, titleY + i * lineH, lineH * 0.78, navyC)
    }

    /* ── Accent bar ── */
    const barY = titleY + lines.length * lineH + h * 0.01
    g.fillStyle(navyC, 1)
    g.fillRect(titleX, barY, w * 0.08, h * 0.012)

    /* ── Body text (simulated with thin rectangles) ── */
    const textY = barY + h * 0.04
    const textW = split * 0.82
    const rowH  = h * 0.018
    const gap   = h * 0.008
    const rows  = [1, 1, 1, 0.6]  // relative widths
    for (let i = 0; i < rows.length; i++) {
      g.fillStyle(0x8898a8, 0.55)
      g.fillRoundedRect(titleX, textY + i * (rowH + gap), textW * rows[i], rowH, rowH * 0.45)
    }
    const textY2 = textY + rows.length * (rowH + gap) + gap
    const rows2  = [1, 1, 0.75]
    for (let i = 0; i < rows2.length; i++) {
      g.fillStyle(0x8898a8, 0.4)
      g.fillRoundedRect(titleX, textY2 + i * (rowH + gap), textW * rows2[i], rowH, rowH * 0.45)
    }
  }

  /* ──────────────────────────────── Bold text */
  private drawBoldText(
    g: Phaser.GameObjects.Graphics,
    text: string,
    x: number, y: number,
    size: number,
    color: number,
  ) {
    /* Each letter is drawn as a set of filled rectangles (pixel font style).
     * We use a compact 5×7 grid per character, scaled to `size`.
     */
    const charW  = size * 0.62
    const charGap = size * 0.12
    const stroke = size * 0.14

    let cx = x
    for (const ch of text) {
      const segs = GLYPHS[ch]
      if (segs) {
        for (const [ox, oy, sw, sh] of segs) {
          g.fillStyle(color, 1)
          g.fillRect(
            cx + ox * charW,
            y  + oy * size,
            sw * charW + stroke * 0.3,
            sh * size  + stroke * 0.3,
          )
        }
      }
      cx += charW + charGap
    }
  }
}

/* ══════════════════════════════════════════════════════════
   Minimal bold glyph definitions
   Each entry: [ox, oy, width, height] normalised to charW/size
   ══════════════════════════════════════════════════════════ */
type Seg = [number, number, number, number]
const GLYPHS: Record<string, Seg[]> = {
  W: [
    [0, 0, 0.20, 1],
    [0.80, 0, 0.20, 1],
    [0.38, 0.45, 0.24, 0.55],
    [0.10, 0, 0.20, 0.65],
    [0.70, 0, 0.20, 0.65],
  ],
  O: [
    [0,    0,    1, 0.18],
    [0,    0.82, 1, 0.18],
    [0,    0,    0.18, 1],
    [0.82, 0,    0.18, 1],
  ],
  R: [
    [0, 0, 0.19, 1],
    [0, 0, 1,    0.18],
    [0, 0.40,  1,  0.18],
    [0.82, 0,  0.18, 0.58],
    [0.38, 0.58, 0.62, 0.18],
    [0.68, 0.58, 0.18, 0.42],
  ],
  L: [
    [0, 0, 0.19, 1],
    [0, 0.82, 1, 0.18],
  ],
  D: [
    [0, 0, 0.19, 1],
    [0, 0, 0.80, 0.18],
    [0, 0.82, 0.80, 0.18],
    [0.80, 0, 0.20, 1],
  ],
  C: [
    [0, 0,    1,    0.18],
    [0, 0.82, 1,    0.18],
    [0, 0,    0.18, 1],
  ],
  E: [
    [0, 0, 0.19, 1],
    [0, 0,    1, 0.18],
    [0, 0.41, 0.80, 0.18],
    [0, 0.82, 1, 0.18],
  ],
  A: [
    [0,    0,    0.19, 1],
    [0.81, 0,    0.19, 1],
    [0,    0,    1,    0.18],
    [0,    0.41, 1,    0.18],
  ],
  N: [
    [0,    0, 0.19, 1],
    [0.81, 0, 0.19, 1],
    [0,    0, 0.19, 0.55],
    [0.81, 0.45, 0.19, 0.55],
    [0.14, 0, 0.72, 0.22],
  ],
  S: [
    [0,    0,    1,    0.18],
    [0,    0.41, 1,    0.18],
    [0,    0.82, 1,    0.18],
    [0,    0,    0.19, 0.59],
    [0.81, 0.41, 0.19, 0.59],
  ],
  Y: [
    [0,    0,    0.19, 0.55],
    [0.81, 0,    0.19, 0.55],
    [0.40, 0.45, 0.20, 0.55],
    [0,    0,    1,    0.18],
    [0,    0.41, 1,    0.18],
  ],
}
