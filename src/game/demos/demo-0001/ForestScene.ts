import Phaser from 'phaser'

/**
 * Seigaiha Scene — Full-screen 青海波 (seigaiha) pattern
 *
 * Gold concentric arcs on black, tiled across the entire canvas.
 *
 * Performance-optimised:
 *  - Arc pattern rendered ONCE to an offscreen Canvas 2D texture
 *    (rebuilt only on window resize).
 *  - A lightweight 20×14 grid overlay animates a diagonal brightness
 *    ripple at near-zero GPU cost (~100 fillRects vs ~2 600 arc
 *    stroke calls that the original per-frame approach required).
 */

export class ForestScene extends Phaser.Scene {
  private gfx!: Phaser.GameObjects.Graphics
  private layerSprite?: Phaser.GameObjects.Image
  private frame = 0
  private lastW = 0
  private lastH = 0
  private texId = 0

  constructor() { super({ key: 'ForestScene' }) }
  create() { this.gfx = this.add.graphics() }

  update() {
    this.frame++
    const w = this.scale.width, h = this.scale.height
    if (w < 4 || h < 4) return
    if (w !== this.lastW || h !== this.lastH) {
      this.lastW = w; this.lastH = h
      this.rebuildStatic(w, h)
    }
    this.animateRipple(this.gfx, w, h, this.frame)
  }

  /* ── Static arc texture (rebuilt on resize only) ── */
  private rebuildStatic(w: number, h: number) {
    if (this.layerSprite) this.layerSprite.destroy()
    const prev = 'seigaiha-' + this.texId
    if (this.textures.exists(prev)) this.textures.remove(prev)
    this.texId++
    const key = 'seigaiha-' + this.texId

    const cvs = document.createElement('canvas')
    cvs.width = w; cvs.height = h
    const ctx = cvs.getContext('2d')!

    ctx.fillStyle = '#0a0a0a'
    ctx.fillRect(0, 0, w, h)

    const minDim = Math.min(w, h)
    const tileR = minDim * 0.048
    const rowH = tileR * 0.88
    const colW = tileR * 2
    const rings = 5
    const lw = Math.max(0.8, tileR * 0.028)
    const rows = Math.ceil(h / rowH) + 2
    const cols = Math.ceil(w / colW) + 2

    ctx.lineWidth = lw
    ctx.lineCap = 'butt'
    ctx.strokeStyle = '#c8a850'

    for (let row = -1; row < rows; row++) {
      const yy = row * rowH
      const offset = (row & 1) === 0 ? 0 : tileR
      for (let col = -1; col < cols; col++) {
        const xx = col * colW + offset
        for (let i = 0; i < rings; i++) {
          const ri = tileR * (0.18 + ((i + 1) / rings) * 0.82)
          // Mid-point alpha of the original 0.30..0.75 range
          ctx.globalAlpha = 0.52 * (0.55 + (i / rings) * 0.45)
          ctx.beginPath()
          ctx.arc(xx, yy, ri, Math.PI, 0, false)
          ctx.stroke()
        }
      }
    }
    ctx.globalAlpha = 1

    this.textures.addCanvas(key, cvs)
    this.layerSprite = this.add.image(w / 2, h / 2, key).setDepth(0)
    this.gfx.setDepth(1)
  }

  /* ── Animated diagonal ripple (lightweight grid overlay) ── */
  private animateRipple(
    g: Phaser.GameObjects.Graphics,
    w: number, h: number,
    frame: number,
  ) {
    g.clear()
    const t = frame * 0.012
    const NX = 20, NY = 14
    const cw = w / NX, ch = h / NY

    for (let iy = 0; iy < NY; iy++) {
      for (let ix = 0; ix < NX; ix++) {
        const nx = (ix + 0.5) / NX
        const ny = (iy + 0.5) / NY
        const phase = nx * 3.0 + ny * 2.0
        const ripple = Math.sin(t - phase)  // –1..1

        if (ripple > 0.15) {
          // Brighten with gold overlay
          g.fillStyle(0xe0c878, ripple * 0.08)
          g.fillRect(ix * cw, iy * ch, cw + 1, ch + 1)
        } else if (ripple < -0.15) {
          // Darken with black overlay
          g.fillStyle(0x000000, -ripple * 0.10)
          g.fillRect(ix * cw, iy * ch, cw + 1, ch + 1)
        }
      }
    }
  }
}
