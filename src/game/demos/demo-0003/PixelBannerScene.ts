import Phaser from 'phaser'

/**
 * PixelBannerScene — renders pixel-data JSON as a full-bleed animated banner.
 *
 * Features:
 *  • Pixel grid fills the canvas (no padding)
 *  • Subtle "shimmer" effect — random cells briefly brighten
 *  • Slow horizontal parallax drift
 *  • Vignette overlay for cinematic depth
 *
 * Accepts `pixel-data` event from React with the same { cols, rows, palette, pixels }
 * format exported by Demo 0002.
 */

export interface PixelData {
  cols: number
  rows: number
  palette: string[]
  pixels: number[][]
}

/** Convert '#rrggbb' → 0xRRGGBB */
function hexToNum(hex: string): number {
  return parseInt(hex.replace('#', ''), 16)
}

/** Lighten an 0xRRGGBB colour by `amount` (0-1) */
function lighten(color: number, amount: number): number {
  let r = (color >> 16) & 0xff
  let g = (color >> 8) & 0xff
  let b = color & 0xff
  r = Math.min(255, r + (255 - r) * amount) | 0
  g = Math.min(255, g + (255 - g) * amount) | 0
  b = Math.min(255, b + (255 - b) * amount) | 0
  return (r << 16) | (g << 8) | b
}

/* ── Shimmer cell ── */
interface ShimmerCell {
  row: number
  col: number
  life: number     // 0 → 1 → 0
  speed: number    // how fast it fades
  baseColor: number
}

export class PixelBannerScene extends Phaser.Scene {
  private gfx!: Phaser.GameObjects.Graphics
  private overlay!: Phaser.GameObjects.Graphics
  private pixelData: PixelData | null = null
  private paletteNums: number[] = []
  private dirty = true
  private lastW = 0
  private lastH = 0

  /* Animation state */
  private driftX = 0
  private shimmerCells: ShimmerCell[] = []
  private shimmerTimer = 0
  private animEnabled = true

  constructor() {
    super({ key: 'PixelBannerScene' })
  }

  create() {
    this.gfx = this.add.graphics()
    this.overlay = this.add.graphics()

    this.events.on('pixel-data', (d: PixelData) => {
      this.pixelData = d
      this.paletteNums = d.palette.map(hexToNum)
      this.dirty = true
      this.shimmerCells = []
    })

    this.events.on('toggle-animation', (on: boolean) => {
      this.animEnabled = on
      this.dirty = true
    })
  }

  update(_time: number, delta: number) {
    const w = this.scale.width
    const h = this.scale.height
    if (w < 4 || h < 4) return

    if (w !== this.lastW || h !== this.lastH) {
      this.lastW = w
      this.lastH = h
      this.dirty = true
    }

    if (!this.pixelData) return

    /* Animation tick */
    if (this.animEnabled) {
      const dt = delta / 1000

      // Drift
      this.driftX += dt * 3.0
      this.dirty = true

      // Spawn shimmer cells
      this.shimmerTimer -= dt
      if (this.shimmerTimer <= 0) {
        this.shimmerTimer = 0.03 + Math.random() * 0.06
        this.spawnShimmer()
      }

      // Update shimmer
      for (let i = this.shimmerCells.length - 1; i >= 0; i--) {
        const c = this.shimmerCells[i]
        c.life += dt * c.speed
        if (c.life >= 1) {
          this.shimmerCells.splice(i, 1)
        }
      }
    }

    if (!this.dirty) return
    this.dirty = false
    this.draw(w, h)
    if (this.animEnabled) {
      this.drawVignette(w, h)
    } else {
      this.overlay.clear()
    }
  }

  /* Spawn a random shimmer highlight */
  private spawnShimmer() {
    const d = this.pixelData!
    const row = (Math.random() * d.rows) | 0
    const col = (Math.random() * d.cols) | 0
    const idx = d.pixels[row]?.[col]
    if (idx == null) return
    this.shimmerCells.push({
      row,
      col,
      life: 0,
      speed: 0.6 + Math.random() * 1.5,
      baseColor: this.paletteNums[idx] ?? 0,
    })
  }

  /* ── Draw pixel grid ── */
  private draw(canvasW: number, canvasH: number) {
    const g = this.gfx
    const d = this.pixelData!
    g.clear()

    // Fill background with darkest palette colour (or black)
    g.fillStyle(0x080808, 1)
    g.fillRect(0, 0, canvasW, canvasH)

    // Cell dimensions — fill the whole canvas
    const cellW = canvasW / d.cols
    const cellH = canvasH / d.rows

    // Drift offset (wrapping)
    const driftPx = this.animEnabled ? this.driftX % cellW : 0

    // Build a shimmer lookup map for fast access
    const shimmerMap = new Map<string, number>()
    for (const sc of this.shimmerCells) {
      // Triangle wave: 0→1→0
      const intensity = sc.life < 0.5 ? sc.life * 2 : (1 - sc.life) * 2
      shimmerMap.set(`${sc.row},${sc.col}`, intensity)
    }

    // Draw cells
    for (let row = 0; row < d.rows; row++) {
      const pixelRow = d.pixels[row]
      if (!pixelRow) continue
      const y = row * cellH
      for (let col = 0; col < d.cols; col++) {
        const idx = pixelRow[col]
        let color = this.paletteNums[idx] ?? 0

        // Apply shimmer
        const shimmer = shimmerMap.get(`${row},${col}`)
        if (shimmer != null && shimmer > 0) {
          color = lighten(color, shimmer * 0.45)
        }

        g.fillStyle(color, 1)
        // Drift: shift all cols left; wrap around
        const baseX = col * cellW - driftPx
        const x = baseX < -cellW ? baseX + canvasW + cellW : baseX
        g.fillRect(x, y, Math.ceil(cellW) + 1, Math.ceil(cellH) + 1)

        // If wrapping produces a gap at the right edge, draw a duplicate
        if (baseX < 0) {
          g.fillRect(baseX + canvasW + cellW, y, Math.ceil(cellW) + 1, Math.ceil(cellH) + 1)
        }
      }
    }
  }

  /* ── Cinematic vignette ── */
  private drawVignette(w: number, h: number) {
    const o = this.overlay
    o.clear()

    // Top / bottom gradient bars
    const barH = h * 0.25
    for (let i = 0; i < 12; i++) {
      const a = (1 - i / 12) * 0.55
      // top
      o.fillStyle(0x000000, a)
      o.fillRect(0, i * (barH / 12), w, barH / 12 + 1)
      // bottom
      o.fillRect(0, h - (i + 1) * (barH / 12), w, barH / 12 + 1)
    }

    // Corners darkening
    const cornerR = Math.max(w, h) * 0.55
    o.fillStyle(0x000000, 0.15)
    o.fillCircle(0, 0, cornerR)
    o.fillCircle(w, 0, cornerR)
    o.fillCircle(0, h, cornerR)
    o.fillCircle(w, h, cornerR)
  }
}
