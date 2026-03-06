import Phaser from 'phaser'
import { bus } from '../../bridge/EventBus'
import { BANNER_SLIDES, BANNER_TOTAL } from '../../data/bannerSlides'

const TOTAL = BANNER_TOTAL
const SLIDES = BANNER_SLIDES

/** Floating particle descriptor, tracked per slide */
interface Orb {
  gfx: Phaser.GameObjects.Arc
  baseX: number
  baseY: number
}

export class BannerScene extends Phaser.Scene {
  private container!: Phaser.GameObjects.Container
  private current = 0
  private busy = false
  private pointerStartX = 0
  private autoTimer!: Phaser.Time.TimerEvent
  private waveGfx:  Phaser.GameObjects.Graphics | null = null
  private screamGfx: Phaser.GameObjects.Graphics | null = null
  private crispyGfx:  Phaser.GameObjects.Graphics | null = null
  private crispyText: Phaser.GameObjects.Text     | null = null
  private crispyGirl: Phaser.GameObjects.Text     | null = null
  private readonly onBannerGoto = ({ index }: { index: number }) => {
    this.resetAutoTimer()
    this.goto(index)
  }

  constructor() {
    super({ key: 'BannerScene' })
  }

  create() {
    const { width, height } = this.scale

    this.container = this.add.container(0, 0)

    SLIDES.forEach((slide, i) => {
      this.container.add(this.buildSlide(i, slide, width, height))
    })

    // ── Pointer swipe ────────────────────────────────────────
    this.input.on(Phaser.Input.Events.POINTER_DOWN, (p: Phaser.Input.Pointer) => {
      this.pointerStartX = p.x
    })

    this.input.on(Phaser.Input.Events.POINTER_UP, (p: Phaser.Input.Pointer) => {
      const delta = this.pointerStartX - p.x
      if (Math.abs(delta) > 40) {
        this.resetAutoTimer()
        this.goto(this.current + (delta > 0 ? 1 : -1))
      }
    })

    // ── EventBus: React �?Phaser ─────────────────────────────
    bus.on('banner:goto', this.onBannerGoto)

    // ── Auto-advance ─────────────────────────────────────────
    this.autoTimer = this.time.addEvent({
      delay: 4000,
      loop: true,
      callback: () => this.goto((this.current + 1) % TOTAL),
    })

    bus.emit('banner:changed', { index: 0 })
  }

  // ── Build one slide panel ──────────────────────────────────
  private buildSlide(
    index: number,
    slide: (typeof SLIDES)[number],
    w: number,
    h: number,
  ) {
    if (index === 0) return this.buildWaveSlide(w, h)
    if (index === 1) return this.buildScreamSlide(index, w, h)
    if (index === 2) return this.buildCrispySlide(index, w, h)

    const panel = this.add.container(index * w, 0)

    // ── Static background ─────────────────────────────────────
    const bg = this.add.rectangle(w / 2, h / 2, w, h, slide.bg)

    // ── Large animated blobs ──────────────────────────────────
    const blob1 = this.add.circle(w * 0.85, h * 0.18, w * 0.22, slide.accent, 0.22)
    const blob2 = this.add.circle(w * 0.12, h * 0.78, w * 0.14, slide.accent, 0.16)
    const blob3 = this.add.circle(w * 0.5,  h * 1.05, w * 0.35, slide.accent, 0.09)

    this.animateBlob(blob1, 18, 5500 + index * 400)
    this.animateBlob(blob2, 12, 7200 + index * 300)
    this.animateBlob(blob3, 22, 6100 + index * 500)

    // ── Floating orbs ─────────────────────────────────────────
    const orbs: Orb[] = this.buildOrbs(index, slide.accent, w, h)
    orbs.forEach((o) => panel.add(o.gfx))
    this.startOrbLoops(orbs, w, h)

    // ── Diagonal shimmer lines ────────────────────────────────
    const shimmerLines = this.buildShimmerLines(slide.accent, w, h)
    shimmerLines.forEach((l) => panel.add(l))

    panel.add([bg, blob1, blob2, blob3])
    return panel
  }

  // ── update: redraw animated graphics every frame ──────────
  update(time: number): void {
    const w = this.scale.width
    const h = this.scale.height
    if (this.waveGfx) {
      this.waveGfx.clear()
      this.drawOcean(this.waveGfx, w, h, time)
    }
    if (this.screamGfx) {
      this.screamGfx.clear()
      this.drawScream(this.screamGfx, w, h, time)
    }
    if (this.crispyGfx) {
      this.crispyGfx.clear()
      this.drawCrispy(this.crispyGfx, w, h, time)
    }
  }

  // ── Crispy slide (slide 2) ────────────────────────────────
  private buildCrispySlide(index: number, w: number, h: number): Phaser.GameObjects.Container {
    const panel = this.add.container(index * w, 0)
    this.crispyGfx = this.add.graphics()

    // "CRISPY!" comic-book text — hidden until bite fires
    this.crispyText = this.add.text(w * 0.640, h * 0.370, 'CRISPY!', {
      fontFamily: '"Impact","Arial Black",sans-serif',
      fontSize: `${Math.round(h * 0.175)}px`,
      color: '#ffffff',
      stroke: '#7a0000',
      strokeThickness: Math.round(h * 0.026),
      shadow: { offsetX: 4, offsetY: 4, color: '#000000', blur: 0, fill: true },
    }).setOrigin(0.5, 0.5).setAlpha(0).setScale(0.1)

    // Girl emoji — large, left side, anchored at bottom-centre
    this.crispyGirl = this.add.text(w * 0.210, h * 0.960, '\uD83D\uDC67', {
      fontSize: `${Math.round(h * 0.82)}px`,
    }).setOrigin(0.5, 1.0)

    panel.add([this.crispyGfx, this.crispyText, this.crispyGirl])

    const girlRestX = w * 0.210
    const girlBiteX = w * 0.265    // lean right toward drumstick

    // Fire bite animation at 55% of each 3200 ms cycle
    const PERIOD = 3200
    const BITE_AT = PERIOD * 0.55
    this.time.addEvent({
      delay: PERIOD,
      loop: true,
      startAt: PERIOD - BITE_AT,
      callback: () => {
        if (!this.crispyText || !this.crispyGirl) return

        // Lean girl toward drumstick
        this.tweens.add({
          targets: this.crispyGirl,
          x: girlBiteX,
          angle: 10,
          duration: 280,
          ease: 'Sine.easeIn',
          onComplete: () => {
            // hold at bite pose, then lean back
            this.tweens.add({
              targets: this.crispyGirl!,
              x: girlRestX,
              angle: 0,
              delay: 520,
              duration: 360,
              ease: 'Back.easeOut',
            })
          },
        })

        // CRISPY! text punch-in
        this.crispyText.setAlpha(0).setScale(0.15).setAngle(-10)
        this.tweens.add({
          targets: this.crispyText,
          alpha: 1, scale: 1.08, angle: 4,
          duration: 140,
          ease: 'Back.easeOut',
          onComplete: () => {
            this.tweens.add({
              targets: this.crispyText!,
              scale: { from: 1.08, to: 0.96 },
              angle: { from: 4, to: -3 },
              yoyo: true, repeat: 2, duration: 100,
              onComplete: () => {
                this.tweens.add({
                  targets: this.crispyText!,
                  alpha: 0, delay: PERIOD * 0.28, duration: 220,
                })
              },
            })
          },
        })
      },
    })

    return panel
  }

  // Seeded deterministic random (used for crispy texture)
  private rngS(s: number): number {
    return Math.abs(Math.sin(s * 127.1 + 311.7) * 43758.5453) % 1
  }

  // ── Crispy scene: girl + fritter + burst ────────────────────
  private drawCrispy(g: Phaser.GameObjects.Graphics, w: number, h: number, time: number): void {
    const PERIOD = 3200
    const cyc = (time % PERIOD) / PERIOD        // 0 → 1 per cycle

    // ─ Background: Jollibee red restaurant ────────────────
    g.fillStyle(0xc01020, 1)           // deep Jollibee red – wall
    g.fillRect(0, 0, w, h)
    g.fillStyle(0xe8a000, 1)           // Jollibee yellow – counter / tray area
    g.fillRect(0, h * 0.72, w, h * 0.28)

    // Soft bokeh circles (out-of-focus restaurant bg)
    const bokehs = [
      { x: 0.80, y: 0.14, r: 0.080, c: 0xff2030, a: 0.45 },
      { x: 0.92, y: 0.38, r: 0.060, c: 0xffc200, a: 0.35 },
      { x: 0.70, y: 0.65, r: 0.070, c: 0xe89000, a: 0.40 },
      { x: 0.08, y: 0.12, r: 0.050, c: 0xff4040, a: 0.32 },
      { x: 0.15, y: 0.78, r: 0.058, c: 0xffd040, a: 0.38 },
      { x: 0.96, y: 0.86, r: 0.082, c: 0xc00018, a: 0.50 },
    ]
    bokehs.forEach(({ x, y, r, c, a }) => {
      g.fillStyle(c, a)
      g.fillCircle(w * x, h * y, w * r)
    })

    // Counter edge stripe
    g.fillStyle(0xcc8800, 1)
    g.fillRect(0, h * 0.72, w, h * 0.018)

    // ─ Chickenjoy drumstick ────────────────────────────────────
    const drX    = w * 0.640            // centre of meat
    const drY    = h * 0.660
    const mRX    = w * 0.155            // meat half-width
    const mRY    = h * 0.118            // meat half-height
    const boneL  = w * 0.170            // bone length protruding left
    const boneTX = drX - mRX * 0.78    // bone-to-meat join X
    const biteR  = mRY * 0.72

    // Shadow
    g.fillStyle(0x000000, 0.20)
    g.fillEllipse(drX, drY + mRY * 0.78, mRX * 2.10, mRY * 0.38)

    // Bone handle
    g.fillStyle(0xf0ead0, 1)
    g.fillRoundedRect(boneTX - boneL, drY - h * 0.016, boneL + mRX * 0.18, h * 0.032, h * 0.016)
    // Bone knob (rounded end)
    g.fillCircle(boneTX - boneL, drY, h * 0.030)
    g.fillStyle(0xddd8b8, 1)   // subtle shade on knob
    g.fillCircle(boneTX - boneL + h * 0.006, drY + h * 0.006, h * 0.018)

    // Crispy coating base (dark Jollibee golden-brown)
    g.fillStyle(0xb84e0c, 1)
    g.fillEllipse(drX, drY, mRX * 2, mRY * 2)

    // Crispy highlight layer
    g.fillStyle(0xd87818, 1)
    g.fillEllipse(drX - mRX * 0.12, drY - mRY * 0.26, mRX * 1.64, mRY * 1.18)

    // Top golden sheen
    g.fillStyle(0xf0a830, 0.60)
    g.fillEllipse(drX - mRX * 0.18, drY - mRY * 0.38, mRX * 1.20, mRY * 0.60)

    // Crispy texture bumps
    for (let di = 0; di < 26; di++) {
      const dx = (this.rngS(di * 7.3)  - 0.5) * mRX * 1.55
      const dy = (this.rngS(di * 13.1) - 0.5) * mRY * 1.55
      // Only draw bumps inside the meat ellipse
      if ((dx * dx) / (mRX * mRX) + (dy * dy) / (mRY * mRY) > 0.80) continue
      g.fillStyle(0x8a3606, 0.70)
      g.fillCircle(drX + dx, drY + dy, mRY * (0.04 + this.rngS(di * 3.7) * 0.065))
    }

    // Bite notch into meat (left side — girl's mouth)
    const hasBite = cyc > 0.50
    if (hasBite) {
      const notchX = drX - mRX * 0.68
      g.fillStyle(0xc01020, 1)          // erase with bg red colour
      g.fillCircle(notchX, drY, biteR)
      g.fillStyle(0xf8e8c8, 1)          // pale exposed chicken interior
      g.fillCircle(notchX + biteR * 0.28, drY, biteR * 0.60)
      // Crumb spray
      for (let ci = 0; ci < 12; ci++) {
        const cr  = this.rngS(ci * 17.3)
        const ca  = this.rngS(ci * 31.1) * Math.PI * 0.75 - Math.PI * 0.38
        const cd  = (0.28 + this.rngS(ci * 5.7) * 0.62) * biteR * 1.9
        g.fillStyle(0xc06010, 0.82)
        g.fillCircle(notchX + biteR * 0.45 + Math.cos(ca) * cd,
                     drY + Math.sin(ca) * cd,
                     mRY * (0.022 + cr * 0.038))
      }
    }

    // ─ Impact burst (drawn when CRISPY text is visible) ───────
    const burstActive = cyc > 0.55 && cyc < 0.88
    if (burstActive) {
      const bt   = Math.min(1, (cyc - 0.55) / 0.12)   // 0→1 over first 12%
      const textX = w * 0.640
      const textY = h * 0.365
      const bR    = w * (0.13 + bt * 0.06)

      // Radial lines — alternating Jollibee red and yellow
      for (let li = 0; li < 14; li++) {
        const ang = (li / 14) * Math.PI * 2 + 0.18
        g.lineStyle(Math.max(2, w * 0.0028), li % 2 === 0 ? 0xffc200 : 0xe31837, 0.88)
        g.strokePoints([
          { x: textX + Math.cos(ang) * bR * 0.72, y: textY + Math.sin(ang) * bR * 0.72 },
          { x: textX + Math.cos(ang) * bR * 1.18, y: textY + Math.sin(ang) * bR * 1.18 },
        ], false)
      }

      // Impact triangles — Jollibee yellow / red
      const tris = [
        -0.55, -0.28, -0.05, 0.20, 0.48, 0.72, 1.05, 1.35,
      ]
      tris.forEach((af, ti) => {
        const ang  = af * Math.PI
        const dist = 0.88 + (ti % 3) * 0.10
        const tx   = textX + Math.cos(ang) * bR * dist
        const ty   = textY + Math.sin(ang) * bR * dist
        const sz   = bR * 0.22
        const rot  = ang + Math.PI * 0.5
        g.fillStyle(ti % 2 === 0 ? 0xffc200 : 0xe31837, 0.94)
        g.fillPoints([
          { x: tx + Math.cos(rot)          * sz,        y: ty + Math.sin(rot)          * sz        },
          { x: tx + Math.cos(rot + 2.25)   * sz * 0.75, y: ty + Math.sin(rot + 2.25)   * sz * 0.75 },
          { x: tx + Math.cos(rot - 2.25)   * sz * 0.75, y: ty + Math.sin(rot - 2.25)   * sz * 0.75 },
        ], true)
      })
    }
  }

  // ── Scream slide (slide 1) ────────────────────────────────
  private buildScreamSlide(index: number, _w: number, _h: number): Phaser.GameObjects.Container {
    const panel = this.add.container(index * this.scale.width, 0)
    this.screamGfx = this.add.graphics()
    panel.add(this.screamGfx)
    return panel
  }

  /**
   * Wavy pixel-snapped band edge points.
   * Each sample point is quantised to PX-grid to produce chunky pixel-art look.
   */
  private screamBandPts(
    w: number, baseY: number, bandH: number,
    T: number, bi: number, PX: number, ampF: number,
  ): { top: Array<{x:number;y:number}>; bot: Array<{x:number;y:number}> } {
    const STEPS = Math.ceil(w / PX) + 1
    const snap = (v: number) => Math.round(v / PX) * PX
    const top: Array<{x:number;y:number}> = []
    const bot: Array<{x:number;y:number}> = []
    for (let i = 0; i <= STEPS; i++) {
      const x = Math.min(i * PX, w)
      const p1 = (x / w) * Math.PI * 2 * 2.1 + T * 0.80 + bi * 0.85
      const p2 = (x / w) * Math.PI * 2 * 3.7 + T * 1.40 + bi * 1.50
      const raw = Math.sin(p1) * 0.60 + Math.sin(p2) * 0.40
      const dy  = Math.round(raw * 2.8 * ampF) * PX
      top.push({ x, y: snap(baseY + dy) })
      bot.push({ x, y: snap(baseY + bandH + dy * 0.82) })
    }
    return { top, bot }
  }

  // ── Master Scream composer ────────────────────────────────
  private drawScream(g: Phaser.GameObjects.Graphics, w: number, h: number, time: number): void {
    const T  = time * 0.001
    const PX = Math.max(6, Math.round(w / 150))  // ≈8 px for 1200 w
    const snap = (v: number) => Math.round(v / PX) * PX

    // Base fill
    g.fillStyle(0x0d0300, 1)
    g.fillRect(0, 0, w, h)

    // ── Sky: 14 undulating bands red→orange→yellow→teal→horizon ──
    const skyBands = [
      { yr: 0.000, yh: 0.038, c: 0x1a0000 },
      { yr: 0.038, yh: 0.036, c: 0x440000 },
      { yr: 0.074, yh: 0.036, c: 0x660000 },
      { yr: 0.110, yh: 0.040, c: 0x881100 },
      { yr: 0.150, yh: 0.040, c: 0xaa2200 },
      { yr: 0.190, yh: 0.042, c: 0xcc3300 },
      { yr: 0.232, yh: 0.042, c: 0xdd5500 },
      { yr: 0.274, yh: 0.040, c: 0xee7700 },
      { yr: 0.314, yh: 0.036, c: 0xff9900 },
      { yr: 0.350, yh: 0.030, c: 0xffcc00 },
      { yr: 0.380, yh: 0.024, c: 0x4a8880 },  // teal streak 1
      { yr: 0.404, yh: 0.020, c: 0x336655 },  // teal streak 2
      { yr: 0.424, yh: 0.032, c: 0xff8800 },  // back to orange
      { yr: 0.456, yh: 0.026, c: 0xcc6600 },  // darker horizon
    ]
    skyBands.forEach(({ yr, yh, c }, bi) => {
      const { top, bot } = this.screamBandPts(w, h * yr, h * yh, T, bi, PX, 1.0)
      g.fillStyle(c, 1)
      g.fillPoints([...top, ...[...bot].reverse()], true)
    })

    // ── Landscape + fjord bands ───────────────────────────────
    const landBands = [
      { yr: 0.482, yh: 0.048, c: 0x183018 },
      { yr: 0.530, yh: 0.030, c: 0x2a3a28 },
      { yr: 0.560, yh: 0.040, c: 0x091822 },
      { yr: 0.600, yh: 0.038, c: 0x102233 },
      { yr: 0.638, yh: 0.032, c: 0x1a2a3a },
    ]
    landBands.forEach(({ yr, yh, c }, li) => {
      const { top, bot } = this.screamBandPts(w, h * yr, h * yh, T, li + 14, PX, 0.45)
      g.fillStyle(c, 1)
      g.fillPoints([...top, ...[...bot].reverse()], true)
    })

    // Dark foreground base
    g.fillStyle(0x100808, 1)
    g.fillRect(0, snap(h * 0.670), w, h)

    // ── Bridge: two perspective rails to vanishing point ─────
    const vpX = snap(w * 0.62)
    const vpY = snap(h * 0.63)
    const rails = [
      { lBot: 0.72, thick: PX * 1.8, c: 0x6b3a10 },
      { lBot: 0.84, thick: PX * 1.8, c: 0x7d4415 },
    ]
    rails.forEach(({ lBot, thick, c }) => {
      const ly = snap(h * lBot)
      g.fillStyle(c, 1)
      g.fillPoints([
        { x: 0,   y: ly         },
        { x: vpX, y: vpY        },
        { x: vpX, y: vpY + thick },
        { x: 0,   y: ly + thick },
      ], true)
    })
    // Floor planks
    for (let fy = vpY; fy < snap(h * 0.88); fy += PX * 2) {
      g.fillStyle(fy % (PX * 4) === 0 ? 0x4a2808 : 0x5a3410, 1)
      g.fillRect(0, fy, vpX, PX)
    }

    // ── Background silhouettes (two dark figures upper-left) ──
    const sils = [
      { x: w * 0.12, y: h * 0.50, bw: PX * 2, bh: PX * 9 },
      { x: w * 0.19, y: h * 0.51, bw: PX * 2, bh: PX * 8 },
    ]
    sils.forEach(({ x, y, bw, bh }) => {
      const bx = snap(x), by = snap(y)
      g.fillStyle(0x080606, 1)
      g.fillRect(bx, by, bw, bh)
      g.fillCircle(bx + bw / 2, by - PX, bw * 0.7)
    })

    // ── Screaming figure ─────────────────────────────────────
    this.screamFigure(g, w, h, T, PX)
  }

  // ── Pixel-art screaming figure ────────────────────────────
  private screamFigure(
    g: Phaser.GameObjects.Graphics,
    w: number, h: number, T: number, PX: number,
  ): void {
    const snap  = (v: number) => Math.round(v / PX) * PX
    const cx    = w * 0.47
    const headCY = h * 0.40
    const headRX = w * 0.060
    const headRY = h * 0.092

    // ── Skull head ───────────────────────────────────────────
    const hx0 = cx - headRX * 1.35,  hx1 = cx + headRX * 1.35
    const hy0 = headCY - headRY * 1.2, hy1 = headCY + headRY * 1.2
    const bx0 = snap(hx0), bx1 = snap(hx1)
    const by0 = snap(hy0), by1 = snap(hy1)

    for (let py = by0; py < by1; py += PX) {
      const fy = (py - hy0) / (hy1 - hy0)          // 0..1
      const distX = Math.round(Math.sin(fy * 9.0 + T * 2.2) * 0.35) * PX
      for (let px = bx0; px < bx1; px += PX) {
        const fx = (px - hx0) / (hx1 - hx0)        // 0..1
        const nx = (fx - 0.5) * 2.0
        const ny = (fy - 0.5) * 2.0
        if (nx * nx + ny * ny >= 1.0) continue
        const headD = nx * nx + ny * ny

        const eld = ((fx - 0.32) / 0.13) ** 2 + ((fy - 0.38) / 0.11) ** 2
        const erd = ((fx - 0.68) / 0.13) ** 2 + ((fy - 0.38) / 0.11) ** 2
        const md  = ((fx - 0.50) / 0.17) ** 2 + ((fy - 0.66) / 0.13) ** 2
        const mdi = ((fx - 0.50) / 0.09) ** 2 + ((fy - 0.66) / 0.07) ** 2

        let c: number
        if (eld < 1.0 || erd < 1.0) {
          c = 0x181010
        } else if (md < 1.0 && mdi >= 1.0) {
          c = 0x220800
        } else if (md < 1.0) {
          c = 0x330000
        } else {
          const edge = Math.max(0, 1 - headD * 1.1)
          c = fy < 0.25 ? 0xb89030 : (edge > 0.4 ? 0xcca840 : 0x997828)
        }
        g.fillStyle(c, 1)
        g.fillRect(px + distX, py, PX, PX)
      }
    }

    // ── Hands (flat ovals at sides of head) ──────────────────
    const hands = [
      { hcx: cx - headRX * 1.12, hcy: headCY - headRY * 0.05, hrx: headRX * 0.30, hry: headRY * 0.82 },
      { hcx: cx + headRX * 1.12, hcy: headCY - headRY * 0.05, hrx: headRX * 0.30, hry: headRY * 0.82 },
    ]
    hands.forEach(({ hcx, hcy, hrx, hry }) => {
      const hbx0 = snap(hcx - hrx), hbx1 = snap(hcx + hrx)
      const hby0 = snap(hcy - hry), hby1 = snap(hcy + hry)
      for (let py = hby0; py < hby1; py += PX) {
        for (let px = hbx0; px < hbx1; px += PX) {
          const hdx = (px - hcx) / hrx, hdy = (py - hcy) / hry
          if (hdx * hdx + hdy * hdy < 1.0) {
            g.fillStyle(0x1a1008, 1)
            g.fillRect(px, py, PX, PX)
          }
        }
      }
    })

    // ── Body: dark flowing robe, widens downward ──────────────
    const bodyTop  = snap(headCY + headRY * 1.08)
    const bodyRows = Math.ceil((h - bodyTop) / PX)
    for (let r = 0; r < bodyRows; r++) {
      const nr    = r / Math.max(1, bodyRows)
      const halfW = snap(headRX * 0.90 + nr * headRX * 2.5)
      const distX = Math.round(Math.sin(r * 0.55 + T * 1.6) * 0.4) * PX
      g.fillStyle(r % 3 === 0 ? 0x160a04 : 0x1e1008, 1)
      g.fillRect(snap(cx - halfW) + distX, bodyTop + r * PX, halfW * 2, PX)
    }
  }

  // ── Wave slide setup ──────────────────────────────────────
  private buildWaveSlide(_w: number, _h: number): Phaser.GameObjects.Container {
    const panel = this.add.container(0, 0)
    this.waveGfx = this.add.graphics()
    panel.add(this.waveGfx)
    return panel
  }

  /**
   * Stokes-like wave profile:
   *   - crests tall & sharp (exponent < 1 flattens the sin curve upward → peaks up)
   *   - troughs wide & shallow (negative side heavily compressed)
   */
  private waveProf(t: number): number {
    const s = Math.sin(t)
    return s >= 0
      ? Math.pow(s, 0.48)           // sharp peaked crest
      : -Math.pow(-s, 1.9) * 0.28  // very shallow flat trough
  }

  // ── Master ocean draw ─────────────────────────────────────
  private drawOcean(g: Phaser.GameObjects.Graphics, w: number, h: number, time: number): void {
    const T = time * 0.001

    // Fill base sea colour behind everything
    g.fillStyle(0x0d3a58, 1)
    g.fillRect(0, 0, w, h)

    this.drawSky(g, w, h)

    // 6 wave layers back → front, each faster & larger & darker-front
    const layers = [
      { yR: 0.30, ampR: 0.028, freq: 3.6, spd: 0.42, body: 0x2d7090, face: 0x4a98b8 },
      { yR: 0.40, ampR: 0.042, freq: 3.0, spd: 0.58, body: 0x23607c, face: 0x3d8aa8 },
      { yR: 0.51, ampR: 0.060, freq: 2.5, spd: 0.76, body: 0x1a5070, face: 0x307898 },
      { yR: 0.63, ampR: 0.082, freq: 2.1, spd: 0.98, body: 0x144060, face: 0x256888 },
      { yR: 0.76, ampR: 0.110, freq: 1.8, spd: 1.24, body: 0x0f3050, face: 0x1d5878 },
      { yR: 0.91, ampR: 0.145, freq: 1.5, spd: 1.55, body: 0x0a2440, face: 0x174868 },
    ]

    layers.forEach((lyr, li) =>
      this.drawWaveLayer(g, w, h, T, lyr, li >= 3),
    )
  }

  // ── Sky ───────────────────────────────────────────────────
  private drawSky(g: Phaser.GameObjects.Graphics, w: number, h: number): void {
    const skyH = h * 0.30
    // Gradient bands top → horizon
    const bands = [
      { y: 0,           ht: skyH * 0.28, c: 0x4878a8 },
      { y: skyH * 0.28, ht: skyH * 0.24, c: 0x5e90be },
      { y: skyH * 0.52, ht: skyH * 0.24, c: 0x7aaecf },
      { y: skyH * 0.76, ht: skyH * 0.24, c: 0x9ac8db },
    ]
    bands.forEach(({ y, ht, c }) => {
      g.fillStyle(c, 1)
      g.fillRect(0, y, w, ht)
    })

    // Sun disc (upper right)
    g.fillStyle(0xfff0c0, 0.85)
    g.fillCircle(w * 0.82, h * 0.06, w * 0.038)
    g.fillStyle(0xfff8e0, 0.30)
    g.fillCircle(w * 0.82, h * 0.06, w * 0.058)

    // Sun glare streak on horizon
    g.fillStyle(0xffe8a0, 0.22)
    g.fillRect(w * 0.60, skyH - h * 0.005, w * 0.38, h * 0.012)

    // Clouds
    const clouds: Array<{ x: number; y: number; rx: number; ry: number; a: number }> = [
      { x: 0.09, y: 0.05, rx: 0.09, ry: 0.030, a: 0.82 },
      { x: 0.25, y: 0.08, rx: 0.13, ry: 0.038, a: 0.88 },
      { x: 0.46, y: 0.04, rx: 0.10, ry: 0.026, a: 0.75 },
      { x: 0.60, y: 0.10, rx: 0.07, ry: 0.024, a: 0.60 },
      { x: 0.42, y: 0.17, rx: 0.16, ry: 0.044, a: 0.78 },
      { x: 0.72, y: 0.16, rx: 0.11, ry: 0.032, a: 0.65 },
    ]
    clouds.forEach(({ x, y, rx, ry, a }) => {
      g.fillStyle(0xffffff, a * 0.55)
      g.fillEllipse(w * x,               h * y,           w * rx * 2,        h * ry * 2)
      g.fillStyle(0xf8f8f8, a * 0.50)
      g.fillEllipse(w * x - w * rx * 0.4, h * y - h * ry * 0.3, w * rx * 1.4, h * ry * 1.2)
      g.fillStyle(0xffffff, a * 0.40)
      g.fillEllipse(w * x + w * rx * 0.35, h * y - h * ry * 0.2, w * rx * 1.1, h * ry * 0.9)
    })
  }

  // ── One scrolling wave layer ──────────────────────────────
  private drawWaveLayer(
    g: Phaser.GameObjects.Graphics,
    w: number, h: number, T: number,
    lyr: { yR: number; ampR: number; freq: number; spd: number; body: number; face: number },
    _drawFoam: boolean,
  ): void {
    const phase = -T * lyr.spd  // negative → wave moves left to right
    const baseY = h * lyr.yR
    const amp   = h * lyr.ampR
    const STEPS = 200

    // ── profile points ────────────────────────────────────────
    const top: Array<{ x: number; y: number }> = []
    for (let i = 0; i <= STEPS; i++) {
      const x = (i / STEPS) * w
      const t = (x / w) * Math.PI * 2 * lyr.freq + phase
      top.push({ x, y: baseY - amp * this.waveProf(t) })
    }

    // ── dark wave body ────────────────────────────────────────
    g.fillStyle(lyr.body, 1)
    g.fillPoints([...top, { x: w, y: h + 1 }, { x: 0, y: h + 1 }], true)

    // ── bright front face: a strip sitting just above the body on the steep side ──
    // Front face of a rightward-travelling wave = right side of crest (cos(t) < 0)
    const faceTop = top.map((p) => {
      const t = (p.x / w) * Math.PI * 2 * lyr.freq + phase
      const frontFace = Math.cos(t) < 0
      return { x: p.x, y: p.y + (frontFace ? amp * 0.04 : amp * 0.38) }
    })
    g.fillStyle(lyr.face, 1)
    g.fillPoints([...faceTop, { x: w, y: h + 1 }, { x: 0, y: h + 1 }], true)

    // ── foam crest line ───────────────────────────────────────
    const foamA = 0.90
    g.lineStyle(Math.max(1.5, w * 0.0022), 0xdaf2ff, foamA)
    g.strokePoints(top, false)

    // second softer line just below
    g.lineStyle(Math.max(1, w * 0.0015), 0xffffff, foamA * 0.50)
    g.strokePoints(top.map(p => ({ x: p.x, y: p.y + amp * 0.06 })), false)


  }

  // ── Animate a blob: slow float + gentle scale breathe ─────
  private animateBlob(
    blob: Phaser.GameObjects.Arc,
    floatRange: number,
    duration: number,
  ) {
    // Float
    this.tweens.add({
      targets: blob,
      y: `+=${floatRange}`,
      yoyo: true,
      repeat: -1,
      duration,
      ease: 'Sine.easeInOut',
    })
    // Breathe
    this.tweens.add({
      targets: blob,
      scaleX: { from: 1, to: 1.08 },
      scaleY: { from: 1, to: 1.08 },
      yoyo: true,
      repeat: -1,
      duration: duration * 0.7,
      ease: 'Sine.easeInOut',
      delay: duration * 0.3,
    })
  }

  // ── Build floating orb objects for one slide ───────────────
  private buildOrbs(
    slideIndex: number,
    accent: number,
    w: number,
    h: number,
  ): Orb[] {
    const configs = [
      { rx: 0.18, ry: 0.55, r: w * 0.025, alpha: 0.28 },
      { rx: 0.72, ry: 0.70, r: w * 0.018, alpha: 0.22 },
      { rx: 0.38, ry: 0.15, r: w * 0.014, alpha: 0.30 },
      { rx: 0.62, ry: 0.40, r: w * 0.030, alpha: 0.18 },
      { rx: 0.90, ry: 0.60, r: w * 0.012, alpha: 0.25 },
      { rx: 0.28, ry: 0.85, r: w * 0.020, alpha: 0.20 },
    ]

    return configs.map(({ rx, ry, r, alpha }, i) => {
      // Deterministic spread per slide so slides look distinct
      const seed = (slideIndex * 17 + i * 7) % 20
      const bx = w * rx + (seed - 10) * 3
      const by = h * ry + (seed - 10) * 2
      const gfx = this.add.circle(bx, by, r, accent, alpha)
      return { gfx, baseX: bx, baseY: by }
    })
  }

  // ── Start looping drift + fade tweens on orbs ─────────────
  private startOrbLoops(orbs: Orb[], _w: number, _h: number) {
    orbs.forEach((orb, i) => {
      const driftY   = 14 + (i % 3) * 8
      const driftX   = 6  + (i % 4) * 4
      const duration = 4000 + i * 900
      const delay    = i * 430

      // Drift up/down
      this.tweens.add({
        targets: orb.gfx,
        y: `+=${driftY}`,
        x: `+=${i % 2 === 0 ? driftX : -driftX}`,
        yoyo: true,
        repeat: -1,
        duration,
        ease: 'Sine.easeInOut',
        delay,
      })

      // Fade in/out
      this.tweens.add({
        targets: orb.gfx,
        alpha: { from: orb.gfx.alpha, to: orb.gfx.alpha * 0.25 },
        yoyo: true,
        repeat: -1,
        duration: duration * 1.3,
        ease: 'Sine.easeInOut',
        delay: delay + 200,
      })

      // Scale pulse
      this.tweens.add({
        targets: orb.gfx,
        scaleX: { from: 1, to: 1.5 },
        scaleY: { from: 1, to: 1.5 },
        yoyo: true,
        repeat: -1,
        duration: duration * 0.9,
        ease: 'Sine.easeInOut',
        delay: delay + 100,
      })
    })
  }

  // ── Diagonal shimmer lines ─────────────────────────────────
  private buildShimmerLines(accent: number, w: number, h: number) {
    const lines: Phaser.GameObjects.Rectangle[] = []
    const specs = [
      { x: w * 0.25, angle: -28, len: w * 0.55, delay: 0 },
      { x: w * 0.70, angle: -28, len: w * 0.40, delay: 800 },
    ]

    specs.forEach(({ x, angle, len, delay }) => {
      const line = this.add
        .rectangle(x, h * 0.5, len, 1.5, accent, 0.12)
        .setAngle(angle)

      this.tweens.add({
        targets: line,
        alpha: { from: 0.03, to: 0.18 },
        scaleX: { from: 0.8, to: 1.1 },
        yoyo: true,
        repeat: -1,
        duration: 3200,
        ease: 'Sine.easeInOut',
        delay,
      })
      lines.push(line)
    })

    return lines
  }

  // ── Navigate to a slide ────────────────────────────────────
  goto(index: number) {
    const next = Phaser.Math.Clamp(index, 0, TOTAL - 1)
    if (next === this.current || this.busy) return

    this.busy = true
    this.current = next

    this.tweens.add({
      targets: this.container,
      x: -this.scale.width * this.current,
      duration: 450,
      ease: 'Cubic.easeInOut',
      onComplete: () => {
        this.busy = false
        bus.emit('banner:changed', { index: this.current })
      },
    })
  }

  // ── Reset auto-advance on manual interaction ───────────────
  private resetAutoTimer() {
    this.autoTimer.reset({
      delay: 4000,
      loop: true,
      callback: () => this.goto((this.current + 1) % TOTAL),
    })
  }

  shutdown() {
    bus.off('banner:goto', this.onBannerGoto)
  }
}

