import Phaser from 'phaser'

/* ================================================================== */
/*  Constants                                                          */
/* ================================================================== */

const BASE_TILE_W = 128
const BASE_TILE_H = 64

const COLS = 3
const ROWS = 4

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

const SEEDS: SeedDef[] = [
  { id: 'sunflower', name: '向日葵', icon: '🌻', stages: ['plant_weed_01', 'plant_weed_02', 'plant_sunflower_01'], harvestYield: 2, coinValue: 10, growTime: 8 },
  { id: 'tulip',     name: '鬱金香', icon: '🌷', stages: ['plant_weed_01', 'plant_flower_01', 'plant_tulips_03'],   harvestYield: 2, coinValue: 15, growTime: 10 },
  { id: 'sakura',    name: '桜',     icon: '🌸', stages: ['plant_weed_01', 'plant_cherry-blossoms_03', 'plant_cherry-blossoms_01'], harvestYield: 2, coinValue: 20, growTime: 14 },
  { id: 'hibiscus',  name: 'ハイビスカス', icon: '🌺', stages: ['plant_weed_01', 'plant_flower_pink_01', 'plant_hibiscus_01'], harvestYield: 2, coinValue: 18, growTime: 12 },
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

  /** All DOTOWN plant texture keys to preload */
  private static readonly PLANT_KEYS = [
    'plant_weed_01', 'plant_weed_02',
    'plant_sunflower_01',
    'plant_flower_01', 'plant_tulips_03',
    'plant_cherry-blossoms_01', 'plant_cherry-blossoms_03',
    'plant_flower_pink_01', 'plant_hibiscus_01',
  ]
  private coins = 0

  /* HUD references */
  private coinText!: Phaser.GameObjects.Text
  private coinIcon!: Phaser.GameObjects.Graphics
  private toolbarSlots: {
    toolId: string
    bg: Phaser.GameObjects.Rectangle
    icon: Phaser.GameObjects.Text
    count: Phaser.GameObjects.Text
  }[] = []

  constructor() {
    super({ key: 'FarmScene' })
  }

  /* ================================================================ */
  /*  PRELOAD                                                          */
  /* ================================================================ */

  preload() {
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

    // ── Layout zones ─────────────────────────────────────────
    const topBarH = 48
    const toolbarH = 72
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
    this.originY = topBarH + (fieldH - actualGridH) / 2 + this.tileH / 2

    // ── Initial inventory ────────────────────────────────────
    this.inventory.set('sunflower', 5)
    this.inventory.set('tulip', 4)
    this.inventory.set('sakura', 3)
    this.inventory.set('hibiscus', 3)

    // ── Draw zones ───────────────────────────────────────────
    this.buildTopBar(W, topBarH)
    this.buildGrid()
    this.buildToolbar(W, H, toolbarH)
  }

  /* ================================================================ */
  /*  UPDATE — tick growth timers                                      */
  /* ================================================================ */

  update(_time: number, delta: number) {
    const dt = delta / 1000
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
          this.tweens.add({
            targets: cell.sprite, alpha: { from: 0, to: 1 },
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
  /*  TOP BAR                                                          */
  /* ================================================================ */

  private buildTopBar(W: number, barH: number) {
    this.add.rectangle(W / 2, barH / 2, W, barH, 0x1a2a1a, 0.95).setDepth(10)

    const back = this.add
      .text(14, barH / 2, '← 返回', {
        fontFamily: 'Arial, sans-serif', fontSize: '18px', color: '#66bb6a',
      })
      .setOrigin(0, 0.5).setDepth(11).setInteractive({ useHandCursor: true })
    back.on(Phaser.Input.Events.POINTER_DOWN, () => window.history.back())

    this.add
      .text(W / 2, barH / 2, '🌾 開心農場', {
        fontFamily: 'Arial, sans-serif', fontSize: '20px', color: '#fff', fontStyle: 'bold',
      })
      .setOrigin(0.5).setDepth(11)

    this.coinText = this.add
      .text(W - 10, barH / 2, `${this.coins}`, {
        fontFamily: 'Arial, sans-serif', fontSize: '18px', color: '#ffd54f',
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
    this.add.rectangle(W / 2, y0 + barH / 2, W, barH, 0x1a2a1a, 0.95).setDepth(10)
    this.add.rectangle(W / 2, y0, W, 2, 0x4caf50, 0.5).setDepth(10)

    const tools: { id: string; icon: string; showCount: boolean }[] = [
      ...SEEDS.map((s) => ({ id: s.id, icon: s.icon, showCount: true })),
      { id: TOOL_WATER, icon: '💧', showCount: false },
    ]

    const slotCount = tools.length
    const gap = 8
    const totalGap = gap * (slotCount + 1)
    const slotW = Math.min(72, (W - totalGap) / slotCount)
    const slotH = barH - 16
    const startX = (W - (slotCount * slotW + (slotCount - 1) * gap)) / 2

    this.toolbarSlots = []

    tools.forEach((tool, i) => {
      const cx = startX + slotW / 2 + i * (slotW + gap)
      const cy = y0 + barH / 2
      const selected = tool.id === this.selectedTool

      const bg = this.add
        .rectangle(cx, cy, slotW, slotH, selected ? 0x4caf50 : 0x3a3a3a, selected ? 0.25 : 0.7)
        .setOrigin(0.5)
        .setStrokeStyle(2, selected ? 0x4caf50 : 0x555555)
        .setInteractive().setDepth(11)

      const iconSize = Math.max(22, Math.round(slotH * 0.48))
      const icon = this.add
        .text(cx, cy - 6, tool.icon, { fontSize: `${iconSize}px` })
        .setOrigin(0.5).setDepth(11)

      let countTxt: Phaser.GameObjects.Text
      if (tool.showCount) {
        const count = this.inventory.get(tool.id) ?? 0
        countTxt = this.add
          .text(cx, cy + slotH / 2 - 6, `×${count}`, {
            fontFamily: 'Arial, sans-serif', fontSize: '13px', color: '#ccc',
          })
          .setOrigin(0.5, 1).setDepth(11)
      } else {
        countTxt = this.add
          .text(cx, cy + slotH / 2 - 6, '澆水', {
            fontFamily: 'Arial, sans-serif', fontSize: '12px', color: '#81d4fa',
          })
          .setOrigin(0.5, 1).setDepth(11)
      }

      bg.on(Phaser.Input.Events.POINTER_DOWN, () => {
        this.selectedTool = tool.id
        this.refreshToolbar()
      })

      this.toolbarSlots.push({ toolId: tool.id, bg, icon, count: countTxt })
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
      slot.bg.setStrokeStyle(2, selected ? 0x4caf50 : 0x555555)
      slot.bg.setFillStyle(selected ? 0x4caf50 : 0x3a3a3a, selected ? 0.25 : 0.7)
      if (slot.toolId !== TOOL_WATER) {
        const count = this.inventory.get(slot.toolId) ?? 0
        slot.count.setText(`×${count}`)
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

        // Sprite — origin (0.5, 1) means Y = bottom of sprite.
        // Tile center is (x, y); placing bottom there makes the sprite grow upward from the surface.
        const spriteSize = Math.round(tw * 0.52)
        const sprite = this.add
          .image(x, y, 'plant_weed_01')
          .setDisplaySize(spriteSize, spriteSize)
          .setOrigin(0.5, 1)
          .setDepth(iso + 0.2)
          .setVisible(false)

        // Countdown text (hidden initially)
        const timerFontSize = Math.max(10, Math.round(tw * 0.14))
        const timerText = this.add
          .text(x, y + th * 0.2, '', {
            fontFamily: 'Arial, sans-serif',
            fontSize: `${timerFontSize}px`,
            color: '#fff',
            stroke: '#000',
            strokeThickness: 2,
          })
          .setOrigin(0.5, 0.5).setAlpha(0).setDepth(iso + 0.3)

        // Water icon (hidden initially)
        const waterIconSize = Math.max(12, Math.round(tw * 0.16))
        const waterIcon = this.add
          .text(x + tw * 0.28, y - th * 0.15, '💧', {
            fontSize: `${waterIconSize}px`,
          })
          .setOrigin(0.5, 0.5).setAlpha(0).setDepth(iso + 0.3)

        // Harvest icon — floats above the sprite top (bottom=y, top=y-spriteSize)
        const harvestIconSize = Math.max(14, Math.round(tw * 0.22))
        const harvestIcon = this.add
          .text(x, y - spriteSize - th * 0.1, '👆', {
            fontSize: `${harvestIconSize}px`,
          })
          .setOrigin(0.5, 0.5).setAlpha(0).setDepth(iso + 0.4)

        const cell: Cell = {
          col: c, row: r, stage: -1, seedId: null,
          gfx: diamond, label, baseFill: fillColor,
          timer: 0, timerMax: 0, watered: false,
          timerText, waterIcon, harvestIcon, harvestTween: null, sprite,
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
    const sz = Math.round(this.tileW * 0.52)
    cell.sprite.setTexture(key).setDisplaySize(sz, sz).setVisible(true)
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
    this.setSpriteTexture(cell, def ? def.stages[0] : 'plant_weed_01')
    cell.sprite.setAlpha(0)
    cell.gfx.setFillStyle(COLOR_SOIL)

    if (def) {
      cell.timerMax = def.growTime
      cell.timer = def.growTime
    }

    this.refreshToolbar()
    this.updateCellOverlay(cell)

    this.tweens.add({
      targets: cell.sprite, alpha: { from: 0, to: 1 },
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
      .text(x, y - 16, `+${def.coinValue} G  ×${def.harvestYield} ${def.name}`, {
        fontSize: '16px', color: '#fff', fontFamily: 'Arial, sans-serif',
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
    cell.gfx.setFillStyle(cell.baseFill)
    this.stopHarvestTween(cell)
    this.updateCellOverlay(cell)
  }
}
