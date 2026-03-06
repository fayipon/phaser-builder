import Phaser from 'phaser'

/*
 * The Great Wave off Kanagawa - Phaser 3 Graphics API
 *
 * Approach: layered filled shapes with white-stroke outlines.
 * Each visual layer is drawn back-to-front (painter algorithm).
 */

type P = { x: number; y: number }

export class GreatWaveScene extends Phaser.Scene {
  private gfx!: Phaser.GameObjects.Graphics

  constructor() { super({ key: 'GreatWaveScene' }) }
  create() { this.gfx = this.add.graphics() }

  update(time: number) {
    this.gfx.clear()
    const w = this.scale.width
    const h = this.scale.height
    this.draw(w, h, time * 0.001)
  }

  /* ================================================================ */
  private draw(w: number, h: number, t: number) {
    const g = this.gfx
    const bob = Math.sin(t * 0.4) * h * 0.004

    // --- Sky gradient ---
    const horizon = h * 0.52
    const skyC = [0x03090f, 0x061420, 0x0a2038, 0x122e50, 0x1c4268, 0x285880, 0x367098, 0x4888b0]
    const bH = horizon / skyC.length
    for (let i = 0; i < skyC.length; i++) {
      g.fillStyle(skyC[i]); g.fillRect(0, i * bH, w, bH + 1)
    }

    // --- Sun (浮世繪風格：實心紅圓 + 淡色暈染) ---
    const sunX = w * 0.78, sunY = h * 0.18
    const sunR = h * 0.05
    // Subtle warm wash behind — like woodblock ink bleed
    g.fillStyle(0xc86030, 0.035)
    g.fillCircle(sunX, sunY, sunR * 3.0)
    g.fillStyle(0xd07040, 0.045)
    g.fillCircle(sunX, sunY, sunR * 2.0)
    // Solid vermilion disc (朱色) — flat, no gradient, like a stamp
    g.fillStyle(0xc03020)
    g.fillCircle(sunX, sunY, sunR)
    // Slightly brighter centre to hint at ink density
    g.fillStyle(0xd04030, 0.6)
    g.fillCircle(sunX, sunY, sunR * 0.6)

    // --- Ocean base ---
    g.fillStyle(0x061828)
    g.fillRect(0, horizon, w, h - horizon)

    // --- Background swells (3 layers) ---
    for (let L = 0; L < 3; L++) {
      const baseY = horizon + (h - horizon) * (0.25 + L * 0.24)
      const pts: P[] = []
      for (let i = 0; i <= 80; i++) {
        const fx = i / 80
        pts.push({
          x: fx * w,
          y: baseY + Math.sin(fx * (4 - L * 0.5) * Math.PI * 2 - t * (0.35 + L * 0.1)) * (3 + L * 2),
        })
      }
      const fill: P[] = [...pts, { x: w, y: h + 4 }, { x: 0, y: h + 4 }]
      g.fillStyle(0x0a2240 + L * 0x020608)
      g.fillPoints(fill, true)
      g.lineStyle(1.0, 0xb0cee0, 0.22 - L * 0.05)
      g.strokePoints(pts, false)
    }

    // --- Mount Fuji ---
    const fjX = w * 0.545, fjTop = h * 0.22 + bob * 0.3, fjBase = horizon, fjHW = w * 0.06

    // Atmospheric haze / glow behind the mountain
    for (let r = 3; r >= 0; r--) {
      const spread = fjHW * (1.2 + r * 0.18)
      const lift = (fjBase - fjTop) * r * 0.03
      g.fillStyle(0x285880, 0.06 + r * 0.02)
      g.fillTriangle(fjX, fjTop - lift, fjX - spread, fjBase, fjX + spread, fjBase)
    }

    // Mountain body — subtle left/right shading via two overlapping halves
    // Full silhouette (base colour)
    g.fillStyle(0x2a4c64)
    g.fillTriangle(fjX, fjTop, fjX - fjHW, fjBase, fjX + fjHW, fjBase)
    // Sunlit side (left, slightly brighter)
    g.fillStyle(0x365e78, 0.45)
    g.fillTriangle(fjX, fjTop, fjX - fjHW, fjBase, fjX, fjBase)
    // Shadow side (right, slightly darker)
    g.fillStyle(0x1e3c52, 0.35)
    g.fillTriangle(fjX, fjTop, fjX, fjBase, fjX + fjHW, fjBase)

    // Ridge lines for depth
    g.lineStyle(0.6, 0x4a7a96, 0.25)
    g.strokePoints([
      { x: fjX, y: fjTop },
      { x: fjX - fjHW * 0.35, y: fjTop + (fjBase - fjTop) * 0.55 },
      { x: fjX - fjHW * 0.6, y: fjBase },
    ], false)
    g.strokePoints([
      { x: fjX, y: fjTop },
      { x: fjX + fjHW * 0.30, y: fjTop + (fjBase - fjTop) * 0.50 },
      { x: fjX + fjHW * 0.55, y: fjBase },
    ], false)

    // Snow cap — irregular natural edge
    const sH = (fjBase - fjTop) * 0.22
    const snowPts: P[] = [
      { x: fjX, y: fjTop },
      // left descent with bumps
      { x: fjX - fjHW * 0.08, y: fjTop + sH * 0.30 },
      { x: fjX - fjHW * 0.18, y: fjTop + sH * 0.55 },
      { x: fjX - fjHW * 0.25, y: fjTop + sH * 0.85 },
      { x: fjX - fjHW * 0.22, y: fjTop + sH * 1.0 },
      // jagged bottom edge (left to right)
      { x: fjX - fjHW * 0.15, y: fjTop + sH * 1.12 },
      { x: fjX - fjHW * 0.08, y: fjTop + sH * 0.95 },
      { x: fjX - fjHW * 0.02, y: fjTop + sH * 1.08 },
      { x: fjX + fjHW * 0.04, y: fjTop + sH * 0.90 },
      { x: fjX + fjHW * 0.10, y: fjTop + sH * 1.05 },
      { x: fjX + fjHW * 0.16, y: fjTop + sH * 0.88 },
      { x: fjX + fjHW * 0.22, y: fjTop + sH * 1.0 },
      // right ascent
      { x: fjX + fjHW * 0.24, y: fjTop + sH * 0.80 },
      { x: fjX + fjHW * 0.18, y: fjTop + sH * 0.50 },
      { x: fjX + fjHW * 0.08, y: fjTop + sH * 0.25 },
    ]
    // Snow fill
    g.fillStyle(0xc8d8e4)
    g.fillPoints(snowPts, true)
    // Snow highlight (brighter top edge)
    g.lineStyle(1.0, 0xe0ecf4, 0.6)
    g.strokePoints(snowPts.slice(0, 5), false)
    // Snow shadow streaks
    g.lineStyle(0.5, 0x6a90a8, 0.3)
    g.strokePoints([
      { x: fjX + fjHW * 0.02, y: fjTop + sH * 0.15 },
      { x: fjX + fjHW * 0.06, y: fjTop + sH * 0.55 },
      { x: fjX + fjHW * 0.12, y: fjTop + sH * 0.85 },
    ], false)
    g.strokePoints([
      { x: fjX - fjHW * 0.03, y: fjTop + sH * 0.20 },
      { x: fjX - fjHW * 0.08, y: fjTop + sH * 0.50 },
      { x: fjX - fjHW * 0.14, y: fjTop + sH * 0.78 },
    ], false)

    // Subtle outline
    g.lineStyle(0.8, 0x5080a0, 0.30)
    g.strokePoints([
      { x: fjX - fjHW, y: fjBase },
      { x: fjX, y: fjTop },
      { x: fjX + fjHW, y: fjBase },
    ], false)

    // ========================================================
    //   Boats
    // ========================================================
    const footY = h * 0.62 + bob
    const boatBase = footY + h * 0.015
    for (const [bx, sz] of [[w * 0.30, 1], [w * 0.40, 0.85], [w * 0.50, 0.72]] as const) {
      const by = boatBase + Math.sin(t * 0.6 + bx * 0.01) * h * 0.004
      const bw = w * 0.04 * sz, bh = h * 0.008 * sz
      g.fillStyle(0x14283e)
      g.fillPoints([
        { x: bx - bw * 0.5, y: by }, { x: bx - bw * 0.4, y: by + bh },
        { x: bx + bw * 0.4, y: by + bh }, { x: bx + bw * 0.5, y: by },
      ], true)
      g.lineStyle(0.7, 0x80a0ba, 0.4)
      g.strokePoints([
        { x: bx - bw * 0.5, y: by }, { x: bx - bw * 0.4, y: by + bh },
        { x: bx + bw * 0.4, y: by + bh }, { x: bx + bw * 0.5, y: by },
      ], true)
    }

    // ========================================================
    //   Foam lines at wave base
    // ========================================================
    for (let i = 0; i < 3; i++) {
      const fY = footY + h * 0.003 + i * h * 0.014
      const pts: P[] = []
      for (let j = 0; j <= 60; j++) {
        const fx = j / 60
        pts.push({ x: fx * w, y: fY + Math.sin(fx * 6 * Math.PI - t * 0.8 + i * 0.7) * h * 0.004 })
      }
      g.lineStyle(1.0, 0x90b0c8, 0.20 - i * 0.05)
      g.strokePoints(pts, false)
    }
  }
}
