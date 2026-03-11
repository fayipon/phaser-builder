import Phaser from 'phaser'

/* ================================================================== */
/*  Constants                                                          */
/* ================================================================== */

const BASE_TILE_W = 128
const BASE_TILE_H = 64

const COLS = 4
const ROWS = 3

/** Colours */
const COLOR_SOIL = 0x8b6914
const COLOR_SOIL_DARK = 0x6b4f10
const COLOR_SOIL_SIDE = 0x5a3e0a
const COLOR_GRASS = 0x4caf50
const COLOR_GRASS_DARK = 0x388e3c
const COLOR_HOVER = 0xffe082
const COLOR_WATERED = 0x5d4037

/* ================================================================== */
/*  Seed / Crop definitions                                            */
/* ================================================================== */

interface SeedDef {
  id: string
  name: string
  icon: string
  stages: [string, string, string]
  harvestYield: number
  coinValue: number
  /** Seconds to advance one growth stage */
  growTime: number
}

/**
 * ddd.png + ddd.json — atlas with per-row frame definitions.
 * Frame names: r{row}c{col}  (col 1-3 = growth stages 0→2)
 */
const SEEDS: SeedDef[] = [
  { id: 'sunflower', name: '向日葵',       icon: '🌻', stages: ['farm-tiles:r0c1', 'farm-tiles:r0c2', 'farm-tiles:r0c3'], harvestYield: 2, coinValue: 10, growTime: 8 },
  { id: 'tulip',     name: '鬱金香',       icon: '🌷', stages: ['farm-tiles:r1c1', 'farm-tiles:r1c2', 'farm-tiles:r1c3'], harvestYield: 2, coinValue: 15, growTime: 10 },
  { id: 'sakura',    name: '桜',           icon: '🌸', stages: ['farm-tiles:r2c1', 'farm-tiles:r2c2', 'farm-tiles:r2c3'], harvestYield: 2, coinValue: 20, growTime: 14 },
  { id: 'hibiscus',  name: 'ハイビスカス', icon: '🌺', stages: ['farm-tiles:r3c1', 'farm-tiles:r3c2', 'farm-tiles:r3c3'], harvestYield: 2, coinValue: 18, growTime: 12 },
]

const SEED_BY_ID = Object.fromEntries(SEEDS.map((s) => [s.id, s]))

/** Special tool ID for watering can */
const TOOL_WATER = '__water__'

/* ================================================================== */
/*  Cell type                                                          */
/* ================================================================== */

interface Cell {
  col: number
  row: number
  /** -1 = empty, 0/1 = growing, 2 = mature (harvest-ready) */
  stage: number
  seedId: string | null
  gfx: Phaser.GameObjects.Polygon
  label: Phaser.GameObjects.Text
  baseFill: number
  /** Seconds remaining until next stage advance */
  timer: number
  /** Total seconds for current stage (for progress display) */
  timerMax: number
  /** Whether this cell has been watered in the current stage */
  watered: boolean
  /** Countdown text rendered on the cell */
  timerText: Phaser.GameObjects.Text
  /** Water icon rendered on the cell */
  waterIcon: Phaser.GameObjects.Text
  /** Harvest-ready icon (shown when mature) */
  harvestIcon: Phaser.GameObjects.Text
  /** Tween for bouncing harvest icon */
  harvestTween: Phaser.Tweens.Tween | null
  /** Sprite rendered for the crop stage */
  sprite: Phaser.GameObjects.Image
  /** 8 white-tinted offset copies for sticker outline */
  outlineSprites: Phaser.GameObjects.Image[]
}

/* ================================================================== */
/*  Scene                                                              */
/* ================================================================== */

export class FarmScene extends Phaser.Scene {
  private cells: Cell[] = []
  private originX = 0
  private originY = 0
  private tileW = BASE_TILE_W
  private tileH = BASE_TILE_H

  private inventory: Map<string, number> = new Map()
  /** Currently selected tool — a seed ID or TOOL_WATER */
  private selectedTool: string = SEEDS[0].id

  /** Legacy DOTOWN plant texture keys (kept for fallback) */
  private static readonly PLANT_KEYS: string[] = []
  private coins = 0

  /* HUD references */
  private coinText!: Phaser.GameObjects.Text
  private coinIcon!: Phaser.GameObjects.Graphics

  /* Tutorial system */
  private tutActive = false
  private tutIndex = 0
  private tutBuilt = false
  private readonly tutDialogues = [
    { name: 'GURA', text: 'Hey! Welcome to\nHAPPY FARM!' },
    { name: 'GURA', text: 'Pick a seed from the\ntoolbar, then tap a\ntile to plant it!' },
    { name: 'GURA', text: 'Use the WATER tool\nto speed up growth!' },
    { name: 'GURA', text: 'When a crop is ready,\ntap it with the hand\ncursor to harvest!' },
    { name: 'GURA', text: 'Earn coins and keep\ngrowing! Good luck!' },
  ]
  private tutTypeTimer: Phaser.Time.TimerEvent | null = null
  private tutHintTween: Phaser.Tweens.Tween | null = null
  private tutOverlayDim!: Phaser.GameObjects.Rectangle
  private tutBox!: Phaser.GameObjects.Rectangle
  private tutBoxBorder!: Phaser.GameObjects.Rectangle
  private tutCharImg!: Phaser.GameObjects.Image
  private tutNameBg!: Phaser.GameObjects.Rectangle
  private tutNameText!: Phaser.GameObjects.Text
  private tutBodyText!: Phaser.GameObjects.Text
  private tutHintText!: Phaser.GameObjects.Text

  private toolbarSlots: {
    toolId: string
    bg: Phaser.GameObjects.Arc
    icon: Phaser.GameObjects.Text
    count: Phaser.GameObjects.Text
  }[] = []

  /** Floating clouds */
  private clouds: { img: Phaser.GameObjects.Ellipse; speed: number }[] = []

  constructor() {
    super({ key: 'FarmScene' })
  }

  /* ================================================================ */
  /*  PRELOAD                                                          */
  /* ================================================================ */

  preload() {
    this.load.image('farm-bg', '/assets/farm-bg.png')
    this.load.image('farm-guide', '/assets/farm-guide.png')
    // Plant atlas with precise per-row frame sizes
    this.load.atlas('farm-tiles', '/assets/dotown/plant2/ddd.png', '/assets/dotown/plant2/ddd.json')
    for (const key of FarmScene.PLANT_KEYS) {
      this.load.image(key, `/assets/dotown/plant/${key}.png`)
    }
  }

  /* ================================================================ */
  /*  CREATE                                                           */
  /* ================================================================ */

  create() {
    const W = this.scale.width
    const H = this.scale.height

    // ── Background image (covers full canvas, behind everything) ──
    this.add.image(W / 2, H / 2, 'farm-bg')
      .setDisplaySize(W, H)
      .setDepth(-1)

    // ── Layout zones ────────────────────────────────────
    const topBarH = 48
    const toolbarH = 84
    const fieldH = H - topBarH - toolbarH

    // ── Tile sizing: fill the field zone ─────────────────────
    const depth = BASE_TILE_H * 0.28
    const gridBaseW = (COLS + ROWS) * (BASE_TILE_W / 2)
    const gridBaseH = (COLS + ROWS) * (BASE_TILE_H / 2) + depth
    const scaleW = (W * 0.92) / gridBaseW
    const scaleH = (fieldH * 0.92) / gridBaseH
    const sf = Math.min(scaleW, scaleH)
    this.tileW = Math.round(BASE_TILE_W * sf)
    this.tileH = Math.round(BASE_TILE_H * sf)

    const actualDepth = Math.round(this.tileH * 0.28)
    const actualGridH = (COLS + ROWS) * (this.tileH / 2) + actualDepth

    this.originX = W / 2 - (COLS - ROWS) * this.tileW / 4
    this.originY = topBarH + (fieldH - actualGridH) / 2 + this.tileH / 2 + fieldH * 0.12

    // ── Initial inventory ────────────────────────────────────
    this.inventory.set('sunflower', 5)
    this.inventory.set('tulip', 4)
    this.inventory.set('sakura', 3)
    this.inventory.set('hibiscus', 3)

    // ── Draw zones ───────────────────────────────────────────
    this.buildTopBar(W, topBarH)
    this.buildGrid()
    this.buildToolbar(W, H, toolbarH)

    // ── Floating clouds ─────────────────────────────────────
    this.buildClouds(W, H)

    // ── Tutorial: trigger 2 s after entering ─────────────────
    this.time.delayedCall(2000, () => this.showTutorial(), [], this)
  }

  /* ================================================================ */
  /*  UPDATE — tick growth timers                                      */
  /* ================================================================ */

  update(_time: number, delta: number) {
    const dt = delta / 1000

    // ── Move clouds ──
    const W = this.scale.width
    for (const c of this.clouds) {
      c.img.x += c.speed * dt
      if (c.speed > 0 && c.img.x - c.img.width / 2 > W) {
        c.img.x = -c.img.width / 2
        c.img.y = Phaser.Math.Between(20, Math.round(this.scale.height * 0.25))
      } else if (c.speed < 0 && c.img.x + c.img.width / 2 < 0) {
        c.img.x = W + c.img.width / 2
        c.img.y = Phaser.Math.Between(20, Math.round(this.scale.height * 0.25))
      }
    }

    for (const cell of this.cells) {
      if (cell.stage < 0 || cell.stage >= 2) continue
      if (cell.timer <= 0) continue

      cell.timer -= dt
      if (cell.timer <= 0) {
        cell.timer = 0
        cell.stage += 1
        cell.watered = false
        const def = SEED_BY_ID[cell.seedId!]
        if (def) {
          this.setSpriteTexture(cell, def.stages[cell.stage])
          cell.sprite.setAlpha(0)
          cell.outlineSprites.forEach(s => s.setAlpha(0))
          this.tweens.add({
            targets: [cell.sprite, ...cell.outlineSprites], alpha: { from: 0, to: 1 },
            duration: 250, ease: 'Sine.easeOut',
          })
        }
        if (cell.stage < 2 && def) {
          cell.timerMax = def.growTime
          cell.timer = def.growTime
        }
        this.updateCellOverlay(cell)
      } else {
        this.updateCellOverlay(cell)
      }
    }
  }

  /* ================================================================ */
  /*  CLOUDS                                                           */
  /* ================================================================ */

  private buildClouds(W: number, H: number) {
    const count = Phaser.Math.Between(4, 6)
    const maxY = Math.round(H * 0.28)

    for (let i = 0; i < count; i++) {
      const cw = Phaser.Math.Between(60, 140)
      const ch = Phaser.Math.Between(24, 48)
      const x = Phaser.Math.Between(-cw, W + cw)
      const y = Phaser.Math.Between(15, maxY)
      const alpha = Phaser.Math.FloatBetween(0.25, 0.55)
      const speed = Phaser.Math.FloatBetween(6, 18) * (Math.random() < 0.5 ? 1 : -1)

      // Build a cloud from overlapping ellipses grouped in a container
      const e = this.add.ellipse(x, y, cw, ch, 0xffffff, alpha)
        .setDepth(-0.5)

      this.clouds.push({ img: e, speed })
    }
  }

  /* ================================================================ */
  /*  TOP BAR                                                          */
  /* ================================================================ */

  private buildTopBar(W: number, barH: number) {
    this.add.rectangle(W / 2, barH / 2, W, barH, 0x1a2a1a, 0.95).setDepth(10)

    const back = this.add
      .text(14, barH / 2, '< Back', {
        fontFamily: '"Press Start 2P"', fontSize: '9px', color: '#66bb6a',
      })
      .setOrigin(0, 0.5).setDepth(11).setInteractive({ useHandCursor: true })
    back.on(Phaser.Input.Events.POINTER_DOWN, () => window.history.back())

    this.add
      .text(W / 2, barH / 2, 'HAPPY FARM', {
        fontFamily: '"Press Start 2P"', fontSize: '12px', color: '#fff',
      })
      .setOrigin(0.5).setDepth(11)

    this.coinText = this.add
      .text(W - 10, barH / 2, `${this.coins}`, {
        fontFamily: '"Press Start 2P"', fontSize: '11px', color: '#ffd54f',
      })
      .setOrigin(1, 0.5).setDepth(11)

    // Pixel coin icon — drawn left of the number text
    this.coinIcon = this.add.graphics().setDepth(11)
    this.refreshCoinIcon()
  }

  /* ================================================================ */
  /*  BOTTOM TOOLBAR: seeds + water can                                */
  /* ================================================================ */

  private buildToolbar(W: number, H: number, barH: number) {
    const y0 = H - barH

    const tools: { id: string; icon: string; showCount: boolean }[] = [
      ...SEEDS.map((s) => ({ id: s.id, icon: s.icon, showCount: true })),
      { id: TOOL_WATER, icon: '💧', showCount: false },
    ]

    const slotCount = tools.length
    const btnR = Math.min(26, Math.floor((barH - 30) / 2))
    const gap = 18
    const totalW = slotCount * btnR * 2 + (slotCount - 1) * gap
    const startX = (W - totalW) / 2 + btnR
    const cy = y0 + btnR + 4

    this.toolbarSlots = []

    tools.forEach((tool, i) => {
      const cx = startX + i * (btnR * 2 + gap)
      const selected = tool.id === this.selectedTool

      const circle = this.add
        .arc(cx, cy, btnR, 0, 360, false, selected ? 0x2d5a27 : 0x1a2a1a, 0.92)
        .setStrokeStyle(selected ? 3 : 1.5, selected ? 0x66bb6a : 0x444444)
        .setDepth(11)

      const iconSize = Math.max(16, Math.round(btnR * 0.88))
      const icon = this.add
        .text(cx, cy, tool.icon, { fontSize: `${iconSize}px` })
        .setOrigin(0.5).setDepth(12)

      let countTxt: Phaser.GameObjects.Text
      if (tool.showCount) {
        const count = this.inventory.get(tool.id) ?? 0
        countTxt = this.add
          .text(cx, cy + btnR + 5, `x${count}`, {
            fontFamily: '"Press Start 2P"', fontSize: '7px', color: '#b0bec5',
          })
          .setOrigin(0.5, 0).setDepth(12)
      } else {
        countTxt = this.add
          .text(cx, cy + btnR + 5, 'WATER', {
            fontFamily: '"Press Start 2P"', fontSize: '6px', color: '#81d4fa',
          })
          .setOrigin(0.5, 0).setDepth(12)
      }

      // Invisible hit zone — larger than the visual circle for easier tapping
      const hitR = btnR + 12
      const hitZone = this.add
        .zone(cx, cy, hitR * 2, hitR * 2)
        .setInteractive(new Phaser.Geom.Circle(hitR, hitR, hitR), Phaser.Geom.Circle.Contains)
        .setDepth(13)

      hitZone.on(Phaser.Input.Events.POINTER_DOWN, () => {
        this.selectedTool = tool.id
        this.refreshToolbar()
      })

      this.toolbarSlots.push({ toolId: tool.id, bg: circle, icon, count: countTxt })
    })
  }

  /**
   * Draw a small pixel-style gold coin to the left of coinText.
   * Called once on build and again after coinText width changes.
   */
  private refreshCoinIcon(W: number, barH: number) {
    const g = this.coinIcon
    g.clear()
    const r = 9
    const tx = this.coinText.x - this.coinText.width - r * 2 - 4
    const ty = barH / 2
    // outer ring (dark gold)
    g.fillStyle(0xc8860a, 1)
    g.fillCircle(tx, ty, r)
    // inner fill (bright gold)
    g.fillStyle(0xffd54f, 1)
    g.fillCircle(tx, ty, r - 2)
    // shine dot
    g.fillStyle(0xfff59d, 1)
    g.fillCircle(tx - 2, ty - 2, 2)
  }

  /**
   * Draw a small pixel-style gold coin to the left of coinText.
   * Called once on build and again after coinText content changes.
   */
  private refreshCoinIcon() {
    const g = this.coinIcon
    g.clear()
    const r = 9
    // anchor the coin just left of the number text
    const tx = this.coinText.x - this.coinText.width - r * 2 - 4
    const ty = this.coinText.y
    // outer ring (dark gold)
    g.fillStyle(0xc8860a, 1)
    g.fillCircle(tx, ty, r)
    // inner fill (bright gold)
    g.fillStyle(0xffd54f, 1)
    g.fillCircle(tx, ty, r - 2)
    // shine highlight
    g.fillStyle(0xfff59d, 1)
    g.fillCircle(tx - 2, ty - 2, 2)
  }

  private refreshToolbar() {
    this.toolbarSlots.forEach((slot) => {
      const selected = slot.toolId === this.selectedTool
      slot.bg.setStrokeStyle(selected ? 3 : 1.5, selected ? 0x66bb6a : 0x444444)
      slot.bg.setFillStyle(selected ? 0x2d5a27 : 0x1a2a1a, 0.92)
      if (slot.toolId !== TOOL_WATER) {
        const count = this.inventory.get(slot.toolId) ?? 0
        slot.count.setText(`x${count}`)
      }
    })
  }

  /* ================================================================ */
  /*  ISOMETRIC GRID                                                   */
  /* ================================================================ */

  private toScreen(col: number, row: number): { x: number; y: number } {
    return {
      x: this.originX + (col - row) * (this.tileW / 2),
      y: this.originY + (col + row) * (this.tileH / 2),
    }
  }

  private diamondPoints(): Phaser.Geom.Point[] {
    const hw = this.tileW / 2
    const hh = this.tileH / 2
    return [
      new Phaser.Geom.Point(0, -hh),
      new Phaser.Geom.Point(hw, 0),
      new Phaser.Geom.Point(0, hh),
      new Phaser.Geom.Point(-hw, 0),
    ]
  }

  private buildGrid() {
    const tw = this.tileW
    const th = this.tileH
    const depth = Math.round(th * 0.28)

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const { x, y } = this.toScreen(c, r)

        /** isometric depth — later (higher col+row) tiles render on top */
        const iso = c + r

        // side faces
        this.add.polygon(x, y,
          [tw / 2, 0, 0, th / 2, 0, th / 2 + depth, tw / 2, depth],
          COLOR_SOIL_SIDE).setOrigin(0, 0).setDepth(iso)
        this.add.polygon(x, y,
          [-tw / 2, 0, 0, th / 2, 0, th / 2 + depth, -tw / 2, depth],
          COLOR_SOIL_DARK).setOrigin(0, 0).setDepth(iso)

        // top face
        const pts = this.diamondPoints()
        const isEven = (c + r) % 2 === 0
        const fillColor = isEven ? COLOR_GRASS : COLOR_GRASS_DARK

        const diamond = this.add
          .polygon(x, y, pts, fillColor)
          .setOrigin(0, 0)
          .setDepth(iso + 0.1)
          .setInteractive(new Phaser.Geom.Polygon(pts), Phaser.Geom.Polygon.Contains)

        const label = this.add
          .text(x, y, '', { fontSize: '1px' })
          .setOrigin(0.5, 0.5).setVisible(false) // unused; kept for type compat

        // Sprite — origin (0.5, 0.7) aligns the soil/ground center of each
        // spritesheet frame with the isometric tile center.
        const spriteW = Math.round(tw * 0.8)
        const spriteH = Math.round(spriteW * 1.1)
        const sprite = this.add
          .image(x, y, 'farm-tiles', 'r0c1')
          .setDisplaySize(spriteW, spriteH)
          .setOrigin(0.5, 0.7)
          .setDepth(iso + 0.2)
          .setVisible(false)
        const outlineSprites: Phaser.GameObjects.Image[] = []

        // Countdown text (hidden initially)
        const timerFontSize = Math.max(7, Math.round(tw * 0.10))
        const timerText = this.add
          .text(x, y + th * 0.2, '', {
            fontFamily: '"Press Start 2P"',
            fontSize: `${timerFontSize}px`,
            color: '#fff',
            stroke: '#000',
            strokeThickness: 3,
          })
          .setOrigin(0.5, 0.5).setAlpha(0).setDepth(iso + 0.3)

        // Water icon (hidden initially)
        const waterIconSize = Math.max(12, Math.round(tw * 0.16))
        const waterIcon = this.add
          .text(x + tw * 0.28, y - th * 0.15, '💧', {
            fontSize: `${waterIconSize}px`,
          })
          .setOrigin(0.5, 0.5).setAlpha(0).setDepth(iso + 0.3)

        // Harvest icon — floats above the sprite
        const harvestIconSize = Math.max(14, Math.round(tw * 0.22))
        const harvestIcon = this.add
          .text(x, y - spriteH * 0.5 - th * 0.1, '👆', {
            fontSize: `${harvestIconSize}px`,
          })
          .setOrigin(0.5, 0.5).setAlpha(0).setDepth(iso + 0.4)

        const cell: Cell = {
          col: c, row: r, stage: -1, seedId: null,
          gfx: diamond, label, baseFill: fillColor,
          timer: 0, timerMax: 0, watered: false,
          timerText, waterIcon, harvestIcon, harvestTween: null, sprite, outlineSprites,
        }
        this.cells.push(cell)

        diamond.on(Phaser.Input.Events.POINTER_OVER, () => diamond.setFillStyle(COLOR_HOVER))
        diamond.on(Phaser.Input.Events.POINTER_OUT, () => {
          diamond.setFillStyle(this.getCellFill(cell))
        })
        diamond.on(Phaser.Input.Events.POINTER_DOWN, () => this.onCellClick(cell))
      }
    }
  }

  /**
   * Set a sprite's texture AND restore the clamped display size.
   * Must be called instead of raw .setTexture() — Phaser resets scale on
   * every texture swap, so displaySize must be re-applied each time.
   */
  private setSpriteTexture(cell: Cell, key: string) {
    const szW = Math.round(this.tileW * 0.8)
    const szH = Math.round(szW * 1.1)
    // Support 'textureKey:frameIndex' notation for spritesheets
    const colonIdx = key.lastIndexOf(':')
    if (colonIdx !== -1) {
      const texKey = key.slice(0, colonIdx)
      const frameName = key.slice(colonIdx + 1)
      cell.sprite.setTexture(texKey, frameName).setDisplaySize(szW, szH).setVisible(true)
      for (const s of cell.outlineSprites) {
        s.setTexture(texKey, frameName).setDisplaySize(szW, szH).setVisible(true)
      }
    } else {
      cell.sprite.setTexture(key).setDisplaySize(szW, szH).setVisible(true)
      for (const s of cell.outlineSprites) {
        s.setTexture(key).setDisplaySize(szW, szH).setVisible(true)
      }
    }
  }

  /** Returns the appropriate fill for a cell's current state */
  private getCellFill(cell: Cell): number {
    if (cell.stage < 0) return cell.baseFill
    return cell.watered ? COLOR_WATERED : COLOR_SOIL
  }

  /** Updates countdown text + water icon + harvest icon for a cell */
  private updateCellOverlay(cell: Cell) {
    if (cell.stage >= 0 && cell.stage < 2 && cell.timer > 0) {
      const secs = Math.ceil(cell.timer)
      cell.timerText.setText(`${secs}s`).setAlpha(1)
    } else {
      cell.timerText.setAlpha(0)
    }

    cell.waterIcon.setAlpha(cell.watered ? 1 : 0)
    cell.gfx.setFillStyle(this.getCellFill(cell))

    // Harvest icon — show bouncing when mature
    if (cell.stage >= 2) {
      if (!cell.harvestTween) {
        cell.harvestIcon.setAlpha(1)
        const baseY = cell.harvestIcon.y
        cell.harvestTween = this.tweens.add({
          targets: cell.harvestIcon,
          y: baseY - 6,
          duration: 400,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        })
      }
    } else {
      this.stopHarvestTween(cell)
    }
  }

  private stopHarvestTween(cell: Cell) {
    if (cell.harvestTween) {
      cell.harvestTween.stop()
      cell.harvestTween = null
    }
    cell.harvestIcon.setAlpha(0)
  }

  /* ================================================================ */
  /*  CELL CLICK HANDLER                                               */
  /* ================================================================ */

  private onCellClick(cell: Cell) {
    // Mature crops can always be harvested, regardless of selected tool
    if (cell.stage >= 2) {
      this.harvestCell(cell)
      return
    }
    if (this.selectedTool === TOOL_WATER) {
      this.waterCell(cell)
    } else {
      this.interactCrop(cell)
    }
  }

  /** Water a growing cell — halves remaining timer, once per stage */
  private waterCell(cell: Cell) {
    if (cell.stage < 0 || cell.stage >= 2 || cell.watered || cell.timer <= 0) {
      this.cameras.main.shake(80, 0.003)
      return
    }

    cell.watered = true
    cell.timer = Math.max(0.5, cell.timer * 0.5)

    // Visual feedback — water splash
    const { x, y } = this.toScreen(cell.col, cell.row)
    const splash = this.add
      .text(x, y - 10, '💦', { fontSize: '24px' })
      .setOrigin(0.5, 1)
    this.tweens.add({
      targets: splash, y: y - 40, alpha: 0, duration: 600,
      ease: 'Cubic.easeOut', onComplete: () => splash.destroy(),
    })

    this.updateCellOverlay(cell)
  }

  /** Interact with a crop cell using the selected seed tool */
  private interactCrop(cell: Cell) {
    if (cell.stage >= 2) {
      this.harvestCell(cell)
      return
    }
    if (cell.stage === -1) {
      this.plantSeed(cell)
      return
    }
    // Growing — can't manually advance; shake
    this.cameras.main.shake(60, 0.002)
  }

  private plantSeed(cell: Cell) {
    const seedId = this.selectedTool
    const count = this.inventory.get(seedId) ?? 0
    if (count <= 0) {
      this.cameras.main.shake(80, 0.003)
      return
    }

    this.inventory.set(seedId, count - 1)
    cell.seedId = seedId
    cell.stage = 0
    cell.watered = false

    const def = SEED_BY_ID[seedId]
    this.setSpriteTexture(cell, def ? def.stages[0] : 'farm-tiles:r0c1')
    cell.sprite.setAlpha(0)
    cell.outlineSprites.forEach(s => s.setAlpha(0))
    cell.gfx.setFillStyle(COLOR_SOIL)

    if (def) {
      cell.timerMax = def.growTime
      cell.timer = def.growTime
    }

    this.refreshToolbar()
    this.updateCellOverlay(cell)

    this.tweens.add({
      targets: [cell.sprite, ...cell.outlineSprites], alpha: { from: 0, to: 1 },
      duration: 250, ease: 'Sine.easeOut',
    })
  }

  private harvestCell(cell: Cell) {
    const def = SEED_BY_ID[cell.seedId!]
    if (!def) return

    this.inventory.set(def.id, (this.inventory.get(def.id) ?? 0) + def.harvestYield)
    this.coins += def.coinValue
    this.refreshToolbar()
    this.coinText.setText(`${this.coins}`)
    this.refreshCoinIcon()

    const { x, y } = this.toScreen(cell.col, cell.row)
    const fb = this.add
      .text(x, y - 16, `+${def.coinValue}G  x${def.harvestYield} ${def.id.toUpperCase()}`, {
        fontSize: '9px', color: '#fff', fontFamily: '"Press Start 2P"',
        stroke: '#000', strokeThickness: 3,
      })
      .setOrigin(0.5, 1)
    this.tweens.add({
      targets: fb, y: y - 50, alpha: 0, duration: 800,
      ease: 'Cubic.easeOut', onComplete: () => fb.destroy(),
    })
    this.tweens.add({
      targets: [this.coinText, this.coinIcon], scale: { from: 1.3, to: 1 },
      duration: 250, ease: 'Back.easeOut',
    })

    cell.stage = -1
    cell.seedId = null
    cell.timer = 0
    cell.timerMax = 0
    cell.watered = false
    cell.sprite.setVisible(false)
    cell.outlineSprites.forEach(s => s.setVisible(false))
    cell.gfx.setFillStyle(cell.baseFill)
    this.stopHarvestTween(cell)
    this.updateCellOverlay(cell)
  }

  /* ================================================================ */
  /*  TUTORIAL                                                         */
  /* ================================================================ */

  private buildTutorial() {
    if (this.tutBuilt) return
    this.tutBuilt = true

    const W = this.scale.width
    const H = this.scale.height
    const boxH = 138
    const charH = 230
    const charW = Math.round(charH * 0.78)

    // Dark dim overlay — whole canvas
    this.tutOverlayDim = this.add
      .rectangle(W / 2, H / 2, W, H, 0x000000, 0.45)
      .setDepth(50)
      .setVisible(false)

    // Dialogue box background
    this.tutBox = this.add
      .rectangle(W / 2, H - boxH / 2, W, boxH, 0x0a1a0a, 0.93)
      .setDepth(51)
      .setVisible(false)

    // Top border line on the box
    this.tutBoxBorder = this.add
      .rectangle(W / 2, H - boxH, W, 2, 0x4caf50)
      .setDepth(52)
      .setVisible(false)

    // Character portrait — slides up from below
    const charX = charW / 2 + 8
    this.tutCharImg = this.add
      .image(charX, H + charH, 'farm-guide')
      .setDisplaySize(charW, charH)
      .setOrigin(0.5, 1)
      .setDepth(52)
      .setVisible(false)

    // Name plate — positioned at top-left of the dialogue box
    const nameX = charW + 20
    const namePlateW = 118
    const namePlateH = 22
    const namePlateY = H - boxH + namePlateH / 2
    this.tutNameBg = this.add
      .rectangle(nameX + namePlateW / 2, namePlateY, namePlateW, namePlateH, 0x2e7d32)
      .setDepth(53)
      .setVisible(false)

    this.tutNameText = this.add
      .text(nameX + namePlateW / 2, namePlateY, 'GURA', {
        fontFamily: '"Press Start 2P"', fontSize: '8px', color: '#ffffff',
      })
      .setOrigin(0.5)
      .setDepth(53)
      .setVisible(false)

    // Body text
    this.tutBodyText = this.add
      .text(nameX, H - boxH + namePlateH + 10, '', {
        fontFamily: '"Press Start 2P"', fontSize: '8px', color: '#e8f5e9',
        lineSpacing: 10,
        wordWrap: { width: W - nameX - 18 },
      })
      .setOrigin(0, 0)
      .setDepth(53)
      .setVisible(false)

    // Tap-to-continue hint
    this.tutHintText = this.add
      .text(W - 12, H - 8, '[ TAP TO CONTINUE ]', {
        fontFamily: '"Press Start 2P"', fontSize: '7px', color: '#81c784',
      })
      .setOrigin(1, 1)
      .setDepth(53)
      .setVisible(false)
  }

  private showTutorial() {
    this.buildTutorial()
    this.tutActive = true
    this.tutIndex = 0

    // Show all elements
    this.tutOverlayDim.setVisible(true).setAlpha(0)
    this.tutBox.setVisible(true).setAlpha(0)
    this.tutBoxBorder.setVisible(true).setAlpha(0)
    this.tutNameBg.setVisible(true).setAlpha(0)
    this.tutNameText.setVisible(true).setAlpha(0)
    this.tutBodyText.setVisible(true).setAlpha(0)
    this.tutHintText.setVisible(true).setAlpha(0)

    // Fade in UI elements
    this.tweens.add({
      targets: [
        this.tutOverlayDim, this.tutBox, this.tutBoxBorder,
        this.tutNameBg, this.tutNameText, this.tutBodyText, this.tutHintText,
      ],
      alpha: 1,
      duration: 350,
      ease: 'Sine.easeOut',
    })

    // Slide character up from below
    const H = this.scale.height
    this.tutCharImg.setVisible(true).setAlpha(0).setY(H + 50)
    this.tweens.add({
      targets: this.tutCharImg,
      y: H,
      alpha: 1,
      duration: 450,
      ease: 'Back.easeOut',
      delay: 100,
    })

    // Blinking hint
    this.tutHintTween = this.tweens.add({
      targets: this.tutHintText,
      alpha: { from: 0.25, to: 1 },
      duration: 650,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })

    this.showTutDialogue(0)

    // Register input handler
    this.input.on('pointerdown', this.onTutClick, this)
  }

  private readonly onTutClick = () => {
    if (!this.tutActive) return

    // If typewriter is still running, skip to full text
    if (this.tutTypeTimer && !this.tutTypeTimer.hasDispatched) {
      this.tutTypeTimer.remove(false)
      this.tutTypeTimer = null
      this.tutBodyText.setText(this.tutDialogues[this.tutIndex].text)
      return
    }

    this.tutIndex++
    if (this.tutIndex >= this.tutDialogues.length) {
      this.closeTutorial()
    } else {
      this.showTutDialogue(this.tutIndex)
    }
  }

  private showTutDialogue(index: number) {
    const d = this.tutDialogues[index]
    this.tutNameText.setText(d.name)
    this.tutBodyText.setText('')

    if (this.tutTypeTimer) {
      this.tutTypeTimer.remove(false)
      this.tutTypeTimer = null
    }

    const fullText = d.text
    let charIdx = 0
    this.tutTypeTimer = this.time.addEvent({
      delay: 42,
      repeat: fullText.length - 1,
      callback: () => {
        charIdx++
        this.tutBodyText.setText(fullText.substring(0, charIdx))
      },
    })
  }

  private closeTutorial() {
    this.tutActive = false
    this.input.off('pointerdown', this.onTutClick, this)

    if (this.tutTypeTimer) {
      this.tutTypeTimer.remove(false)
      this.tutTypeTimer = null
    }
    if (this.tutHintTween) {
      this.tutHintTween.stop()
      this.tutHintTween = null
    }

    const targets = [
      this.tutOverlayDim, this.tutBox, this.tutBoxBorder, this.tutCharImg,
      this.tutNameBg, this.tutNameText, this.tutBodyText, this.tutHintText,
    ]
    this.tweens.add({
      targets,
      alpha: 0,
      duration: 300,
      ease: 'Sine.easeIn',
      onComplete: () => targets.forEach(t => { if (t) t.setVisible(false) }),
    })
  }
}
