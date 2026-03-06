import Phaser from 'phaser'

/**
 * Seigaiha Scene    Full-screen 青海波 (seigaiha) pattern
 *
 * Gold concentric arcs on black, tiled across the entire canvas
 * with a slow wave-ripple animation via Phaser Graphics overlay.
 */

export class ForestScene extends Phaser.Scene {
  private gfx!: Phaser.GameObjects.Graphics
  private frame = 0

  constructor() { super({ key: 'ForestScene' }) }
  create() { this.gfx = this.add.graphics() }

  update() {
    this.frame++
    const w = this.scale.width, h = this.scale.height
    if (w < 4 || h < 4) return

    this.gfx.clear()
    this.drawSeigaiha(this.gfx, w, h, this.frame)
  }

  /**
   * Draw full-screen seigaiha with animated alpha ripple.
   * Every tile is drawn each frame via Phaser Graphics so
   * the ripple animation is smooth without rebuilding a texture.
   */
  private drawSeigaiha(
    g: Phaser.GameObjects.Graphics,
    w: number, h: number,
    frame: number
  ) {
    const t = frame * 0.012
    const minDim = Math.min(w, h)
    const tileR = minDim * 0.048          // radius of each arc set
    const rowH = tileR * 0.88             // vertical spacing
    const colW = tileR * 2                // horizontal spacing
    const rings = 5                       // concentric arcs per tile
    const lw = Math.max(0.8, tileR * 0.028)

    const rows = Math.ceil(h / rowH) + 2
    const cols = Math.ceil(w / colW) + 2

    // Black fill handled by scene / container bg, but clear just in case
    g.fillStyle(0x0a0a0a, 1)
    g.fillRect(0, 0, w, h)

    for (let row = -1; row < rows; row++) {
      const yy = row * rowH
      const offset = (row & 1) === 0 ? 0 : tileR

      for (let col = -1; col < cols; col++) {
        const xx = col * colW + offset

        //  Animated alpha ripple 
        // Wave travels diagonally from top-left to bottom-right
        const phase = (xx / w) * 3.0 + (yy / h) * 2.0
        const ripple = Math.sin(t - phase) * 0.5 + 0.5          // 0..1
        const baseAlpha = 0.30 + ripple * 0.45                   // 0.30..0.75

        // Colour: brighter near ripple peak
        const bright = ripple > 0.6
        const colHex = bright ? 0xe0c878 : 0xc8a850

        // Draw concentric upper-half arcs
        for (let i = 0; i < rings; i++) {
          const ri = tileR * (0.18 + ((i + 1) / rings) * 0.82)
          // Inner rings slightly dimmer
          const ringAlpha = baseAlpha * (0.55 + (i / rings) * 0.45)

          g.lineStyle(lw, colHex, ringAlpha)
          g.beginPath()
          g.arc(xx, yy, ri, Phaser.Math.DegToRad(180), Phaser.Math.DegToRad(360), false, 0.02)
          g.strokePath()
        }
      }
    }
  }
}
