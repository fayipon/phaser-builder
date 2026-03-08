import Phaser from 'phaser'

/** Tile dimensions for isometric (2:1) diamond projection */
const TILE_W = 128
const TILE_H = 64

/** Grid layout: 3 columns × 4 rows = 12 cells */
const COLS = 3
const ROWS = 4

/** Soil / grass colours */
const COLOR_SOIL = 0x8b6914
const COLOR_SOIL_DARK = 0x6b4f10
const COLOR_SOIL_SIDE = 0x5a3e0a
const COLOR_GRASS = 0x4caf50
const COLOR_GRASS_DARK = 0x388e3c
const COLOR_HOVER = 0xffe082

/* ================================================================== */
/*  Seed / Crop definitions                                            */
/* ================================================================== */

interface SeedDef {
  id: string
  name: string
  icon: string            // emoji shown in inventory
  stages: [string, string, string]  // seed → sprout → grown
  harvestYield: number    // seeds returned on harvest
  coinValue: number       // coins earned on harvest
}

const SEEDS: SeedDef[] = [
  { id: 'sunflower', name: '向日葵', icon: '🌻', stages: ['🌱', '🌿', '🌻'], harvestYield: 2, coinValue: 10 },
  { id: 'carrot',    name: '紅蘿蔔', icon: '🥕', stages: ['🌱', '☘️', '🥕'], harvestYield: 3, coinValue: 8 },
  { id: 'tulip',     name: '鬱金香', icon: '🌷', stages: ['🌱', '🌿', '🌷'], harvestYield: 2, coinValue: 15 },
  { id: 'strawberry',name: '草莓',   icon: '🍓', stages: ['🌱', '🍀', '🍓'], harvestYield: 2, coinValue: 12 },
]

const SEED_BY_ID = Object.fromEntries(SEEDS.map((s) => [s.id, s]))

/* ================================================================== */
/*  Inventory panel layout constants                                   */
/* ================================================================== */

const INV_W = 200
const INV_PADDING = 12
const INV_ROW_H = 36
const INV_BG = 0x222e22
const INV_BG_ALPHA = 0.92
const INV_SELECTED = 0x4caf50
const INV_UNSELECTED = 0x3a3a3a

interface Cell {
  col: number
  row: number
  stage: number        // -1 = empty, 0–2 = crop stage
  seedId: string | null
  gfx: Phaser.GameObjects.Polygon
  label: Phaser.GameObjects.Text
}

export class FarmScene extends Phaser.Scene {
  private cells: Cell[] = []
  private originX = 0
  private originY = 0

  /** Inventory: seedId → count */
  private inventory: Map<string, number> = new Map()
  /** Currently selected seed for planting */
  private selectedSeed: string = SEEDS[0].id

  /** Coins */
  private coins = 0
  private coinText!: Phaser.GameObjects.Text

  /** Inventory UI objects */
  private invContainer!: Phaser.GameObjects.Container
  private invVisible = false
  private invRows: {
    seedId: string
    bg: Phaser.GameObjects.Rectangle
    label: Phaser.GameObjects.Text
  }[] = []
  constructor() {
    super({ key: 'FarmScene' })
  }

  create() {
    const { width, height } = this.scale

    // ── Initial inventory ────────────────────────────────────
    this.inventory.set('sunflower', 5)
    this.inventory.set('carrot', 3)
    this.inventory.set('tulip', 4)
    this.inventory.set('strawberry', 3)

    // Centre the grid
    this.originX = width / 2
    this.originY = height / 2 - ((ROWS * TILE_H) / 2)

    // ── Coin HUD (top-left) ──────────────────────────────
    this.coinText = this.add
      .text(20, 24, this.coinDisplayText(), {
        fontFamily: 'Arial, sans-serif',
        fontSize: '22px',
        color: '#ffd54f',
      })
      .setOrigin(0, 0)

    // Draw ground shadow / base
    this.buildGrid()

    // Title
    this.add
      .text(width / 2, 30, '🌾 開心農場 🌾', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '28px',
        color: '#fff',
      })
      .setOrigin(0.5, 0)

    // Instruction
    this.add
      .text(width / 2, height - 30, '點擊格子種植 / 收成　｜　右上角開啟道具箱', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        color: '#aaa',
      })
      .setOrigin(0.5, 1)

    // ── Build inventory UI ───────────────────────────────────
    this.buildInventoryToggle(width)
    this.buildInventoryPanel(width)
  }

  /* ------------------------------------------------------------------ */
  /*  Isometric helpers                                                  */
  /* ------------------------------------------------------------------ */

  /** Convert grid (col, row) → screen (x, y) using isometric projection */
  private toScreen(col: number, row: number): { x: number; y: number } {
    const x = this.originX + (col - row) * (TILE_W / 2)
    const y = this.originY + (col + row) * (TILE_H / 2)
    return { x, y }
  }

  /** Diamond polygon points (relative to tile centre) */
  private diamondPoints(): Phaser.Geom.Point[] {
    return [
      new Phaser.Geom.Point(0, -TILE_H / 2),
      new Phaser.Geom.Point(TILE_W / 2, 0),
      new Phaser.Geom.Point(0, TILE_H / 2),
      new Phaser.Geom.Point(-TILE_W / 2, 0),
    ]
  }

  /* ------------------------------------------------------------------ */
  /*  Grid construction                                                  */
  /* ------------------------------------------------------------------ */

  private buildGrid() {
    const depth = 18 // pixel depth for the "block" side faces

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const { x, y } = this.toScreen(c, r)

        // ── Side faces (give the tile a 3-D block look) ──────────
        // Right side
        this.add
          .polygon(
            x, y,
            [
              TILE_W / 2, 0,
              0, TILE_H / 2,
              0, TILE_H / 2 + depth,
              TILE_W / 2, depth,
            ],
            COLOR_SOIL_SIDE,
          )
          .setOrigin(0, 0)

        // Left side
        this.add
          .polygon(
            x, y,
            [
              -TILE_W / 2, 0,
              0, TILE_H / 2,
              0, TILE_H / 2 + depth,
              -TILE_W / 2, depth,
            ],
            COLOR_SOIL_DARK,
          )
          .setOrigin(0, 0)

        // ── Top face (interactive diamond) ───────────────────────
        const pts = this.diamondPoints()
        const isEven = (c + r) % 2 === 0
        const fillColor = isEven ? COLOR_GRASS : COLOR_GRASS_DARK

        const diamond = this.add
          .polygon(x, y, pts, fillColor)
          .setOrigin(0, 0)
          .setInteractive(
            new Phaser.Geom.Polygon(pts),
            Phaser.Geom.Polygon.Contains,
          )

        // Crop label (emoji)
        const label = this.add
          .text(x, y, '', {
            fontSize: '32px',
          })
          .setOrigin(0.5, 0.5)

        const cell: Cell = { col: c, row: r, stage: -1, seedId: null, gfx: diamond, label }
        this.cells.push(cell)

        // ── Hover highlight ──────────────────────────────────────
        diamond.on(Phaser.Input.Events.POINTER_OVER, () => {
          diamond.setFillStyle(COLOR_HOVER)
        })
        diamond.on(Phaser.Input.Events.POINTER_OUT, () => {
          diamond.setFillStyle(fillColor)
        })

        // ── Click: advance crop stage ────────────────────────────
        diamond.on(Phaser.Input.Events.POINTER_DOWN, () => {
          this.advanceCrop(cell, fillColor)
        })
      }
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Crop logic                                                         */
  /* ------------------------------------------------------------------ */

  private advanceCrop(cell: Cell, baseFill: number) {
    if (cell.stage >= 2) {
      // Harvest → give back seeds + reset
      const def = SEED_BY_ID[cell.seedId!]
      if (def) {
        const cur = this.inventory.get(def.id) ?? 0
        this.inventory.set(def.id, cur + def.harvestYield)
        this.coins += def.coinValue
        this.refreshInventory()
        this.refreshCoinHUD()

        // Floating "+N" feedback
        const { x, y } = this.toScreen(cell.col, cell.row)
        const fb = this.add
          .text(x, y - 20, `+${def.harvestYield} ${def.icon}  +${def.coinValue} 🪙`, {
            fontSize: '18px',
            color: '#fff',
            fontFamily: 'Arial, sans-serif',
          })
          .setOrigin(0.5, 1)
        this.tweens.add({
          targets: fb,
          y: y - 60,
          alpha: 0,
          duration: 800,
          ease: 'Cubic.easeOut',
          onComplete: () => fb.destroy(),
        })

        // Coin HUD pop animation
        this.tweens.add({
          targets: this.coinText,
          scale: { from: 1.3, to: 1 },
          duration: 250,
          ease: 'Back.easeOut',
        })
      }

      cell.stage = -1
      cell.seedId = null
      cell.label.setText('')
      cell.gfx.setFillStyle(baseFill)

      this.tweens.add({
        targets: cell.label,
        scale: { from: 1.4, to: 1 },
        duration: 200,
      })
      return
    }

    // ── Plant or grow ────────────────────────────────────────
    if (cell.stage === -1) {
      // Planting: consume a seed from inventory
      const count = this.inventory.get(this.selectedSeed) ?? 0
      if (count <= 0) {
        // No seeds — flash a warning
        this.cameras.main.shake(80, 0.003)
        return
      }
      this.inventory.set(this.selectedSeed, count - 1)
      cell.seedId = this.selectedSeed
      this.refreshInventory()
    }

    cell.stage += 1
    const def = SEED_BY_ID[cell.seedId!]
    cell.label.setText(def ? def.stages[cell.stage] : '🌱')
    cell.gfx.setFillStyle(COLOR_SOIL)

    this.tweens.add({
      targets: cell.label,
      scale: { from: 0.2, to: 1 },
      duration: 300,
      ease: 'Back.easeOut',
    })
  }

  /* ------------------------------------------------------------------ */
  /*  Inventory toggle button (top-right)                                */
  /* ------------------------------------------------------------------ */

  private buildInventoryToggle(sceneW: number) {
    const btnW = 120
    const btnH = 36
    const px = sceneW - 20 - btnW / 2
    const py = 30

    const bg = this.add.rectangle(0, 0, btnW, btnH, 0x4caf50, 0.9).setOrigin(0.5)
    bg.setStrokeStyle(2, 0x81c784)

    const txt = this.add
      .text(0, 0, '🎒 道具箱', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        color: '#fff',
      })
      .setOrigin(0.5)

    const container = this.add.container(px, py, [bg, txt])
    container.setSize(btnW, btnH)
    container.setInteractive(
      new Phaser.Geom.Rectangle(-btnW / 2, -btnH / 2, btnW, btnH),
      Phaser.Geom.Rectangle.Contains,
    )

    container.on(Phaser.Input.Events.POINTER_OVER, () => bg.setFillStyle(0x66bb6a, 1))
    container.on(Phaser.Input.Events.POINTER_OUT, () => bg.setFillStyle(0x4caf50, 0.9))
    container.on(Phaser.Input.Events.POINTER_DOWN, () => this.toggleInventory())

    // keep reference on the container so GC doesn't collect it
    container.setData('role', 'inv-toggle')
  }

  /* ------------------------------------------------------------------ */
  /*  Inventory panel                                                    */
  /* ------------------------------------------------------------------ */

  private buildInventoryPanel(sceneW: number) {
    const panelH = INV_PADDING * 2 + SEEDS.length * INV_ROW_H + 30 // header + rows
    const px = sceneW - 20 - INV_W
    const py = 60

    const container = this.add.container(px, py)

    // panel background
    const bg = this.add
      .rectangle(0, 0, INV_W, panelH, INV_BG, INV_BG_ALPHA)
      .setOrigin(0, 0)
      .setStrokeStyle(2, 0x4caf50)
    container.add(bg)

    // header
    const header = this.add
      .text(INV_W / 2, INV_PADDING, '🎒 持有種子', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        color: '#a5d6a7',
      })
      .setOrigin(0.5, 0)
    container.add(header)

    // seed rows
    const startY = INV_PADDING + 30
    this.invRows = []

    SEEDS.forEach((seed, i) => {
      const ry = startY + i * INV_ROW_H

      const rowBg = this.add
        .rectangle(INV_PADDING, ry, INV_W - INV_PADDING * 2, INV_ROW_H - 4, INV_UNSELECTED, 0.6)
        .setOrigin(0, 0)
        .setInteractive()

      const count = this.inventory.get(seed.id) ?? 0
      const rowLabel = this.add
        .text(
          INV_PADDING + 8,
          ry + (INV_ROW_H - 4) / 2,
          `${seed.icon} ${seed.name}　×${count}`,
          {
            fontFamily: 'Arial, sans-serif',
            fontSize: '14px',
            color: '#eee',
          },
        )
        .setOrigin(0, 0.5)

      // selection highlight
      if (seed.id === this.selectedSeed) {
        rowBg.setFillStyle(INV_SELECTED, 0.35)
      }

      rowBg.on(Phaser.Input.Events.POINTER_DOWN, () => {
        this.selectedSeed = seed.id
        this.refreshInventory()
      })
      rowBg.on(Phaser.Input.Events.POINTER_OVER, () => {
        rowBg.setStrokeStyle(1, 0x81c784)
      })
      rowBg.on(Phaser.Input.Events.POINTER_OUT, () => {
        rowBg.setStrokeStyle(0)
      })

      container.add([rowBg, rowLabel])
      this.invRows.push({ seedId: seed.id, bg: rowBg, label: rowLabel })
    })

    container.setVisible(false)
    this.invContainer = container
  }

  private toggleInventory() {
    this.invVisible = !this.invVisible
    this.invContainer.setVisible(this.invVisible)
    if (this.invVisible) this.refreshInventory()
  }

  private coinDisplayText(): string {
    return `🪙 ${this.coins}`
  }

  private refreshCoinHUD() {
    this.coinText.setText(this.coinDisplayText())
  }

  /** Update inventory panel text and highlight */
  private refreshInventory() {
    this.invRows.forEach((row) => {
      const def = SEED_BY_ID[row.seedId]
      const count = this.inventory.get(row.seedId) ?? 0
      row.label.setText(`${def.icon} ${def.name}　×${count}`)
      row.bg.setFillStyle(
        row.seedId === this.selectedSeed ? INV_SELECTED : INV_UNSELECTED,
        row.seedId === this.selectedSeed ? 0.35 : 0.6,
      )
    })
  }
}
