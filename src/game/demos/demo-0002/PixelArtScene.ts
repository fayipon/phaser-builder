import Phaser from 'phaser'

/**
 * PixelArtScene — renders pixel grid data as coloured rectangles.
 *
 * The scene listens for a custom 'pixel-data' event on itself.
 * When fired with { cols, rows, palette, pixels } it redraws the grid.
 * Each cell is auto-sized to fill the canvas while maintaining aspect ratio.
 */

export interface PixelData {
  cols: number
  rows: number
  /** Hex colour strings, e.g. ['#0a0e2a', '#c8a850', …] */
  palette: string[]
  /** 2-D array [row][col] of palette indices */
  pixels: number[][]
}

/** Convert '#rrggbb' to 0xRRGGBB */
function hexToNum(hex: string): number {
  return parseInt(hex.replace('#', ''), 16)
}

export class PixelArtScene extends Phaser.Scene {
  private gfx!: Phaser.GameObjects.Graphics
  private pixelData: PixelData | null = null
  private dirty = true
  private lastW = 0
  private lastH = 0

  constructor() {
    super({ key: 'PixelArtScene' })
  }

  create() {
    this.gfx = this.add.graphics()

    // Listen for pixel data pushed from React
    this.events.on('pixel-data', (d: PixelData) => {
      this.pixelData = d
      this.dirty = true
    })
  }

  update() {
    const w = this.scale.width
    const h = this.scale.height
    if (w < 4 || h < 4) return

    if (w !== this.lastW || h !== this.lastH) {
      this.lastW = w
      this.lastH = h
      this.dirty = true
    }

    if (!this.dirty || !this.pixelData) return
    this.dirty = false
    this.draw(w, h)
  }

  private draw(canvasW: number, canvasH: number) {
    const g = this.gfx
    const d = this.pixelData!
    g.clear()

    // Background
    g.fillStyle(0x111111, 1)
    g.fillRect(0, 0, canvasW, canvasH)

    // Fit grid into canvas
    const cellW = canvasW / d.cols
    const cellH = canvasH / d.rows
    const cell = Math.min(cellW, cellH)
    const totalW = cell * d.cols
    const totalH = cell * d.rows
    const offX = (canvasW - totalW) / 2
    const offY = (canvasH - totalH) / 2

    // Draw background behind art (dark)
    g.fillStyle(0x080808, 1)
    g.fillRect(offX, offY, totalW, totalH)

    // Draw each pixel
    for (let row = 0; row < d.rows; row++) {
      const pixelRow = d.pixels[row]
      if (!pixelRow) continue
      const y = offY + row * cell
      for (let col = 0; col < d.cols; col++) {
        const idx = pixelRow[col]
        const hex = d.palette[idx]
        if (!hex) continue
        g.fillStyle(hexToNum(hex), 1)
        g.fillRect(offX + col * cell, y, Math.ceil(cell), Math.ceil(cell))
      }
    }
  }
}
