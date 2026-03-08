import Phaser from 'phaser'
import type { BannerDSL, BannerObject, TimelineEntry } from '../dsl'
import { getParticleConfig } from './particles'
import { useEditorStore, type EditorState } from '../store/editorStore'

/**
 * EditorScene — the main Phaser scene used by the banner editor.
 *
 * It subscribes to the Zustand store and re-renders objects whenever state changes.
 * Supports drag, selection, and timeline playback.
 */
export class EditorScene extends Phaser.Scene {
  private objMap = new Map<string, Phaser.GameObjects.GameObject>()
  private selBox: Phaser.GameObjects.Rectangle | null = null
  private unsub: (() => void) | null = null
  private prevSnapshot = ''

  constructor() {
    super({ key: 'EditorScene' })
  }

  create() {
    // Selection highlight rectangle (hidden until needed)
    this.selBox = this.add.rectangle(0, 0, 0, 0)
    this.selBox.setStrokeStyle(2, 0x7c6af7, 1)
    this.selBox.setFillStyle(0x7c6af7, 0.08)
    this.selBox.setDepth(9999).setVisible(false)

    // Click on empty space deselects
    this.input.on('pointerdown', (_p: Phaser.Input.Pointer) => {
      // Deselect only if no interactive objects were hit
    })

    // Subscribe to store
    this.unsub = useEditorStore.subscribe((state) => this.syncFromStore(state))
    this.syncFromStore(useEditorStore.getState())
  }

  // ── Sync ──────────────────────────────────────────────────
  private syncFromStore(state: EditorState) {
    const snapshot = JSON.stringify(state.banner.objects) + '|' + state.selectedId
    if (snapshot === this.prevSnapshot) return
    this.prevSnapshot = snapshot

    this.rebuildObjects(state.banner)
    this.updateSelection(state.selectedId)
  }

  private rebuildObjects(banner: BannerDSL) {
    const currentIds = new Set(banner.objects.map((o) => o.id))

    // Remove stale
    for (const [id, go] of this.objMap) {
      if (!currentIds.has(id)) {
        go.destroy()
        this.objMap.delete(id)
      }
    }

    // Create or update
    for (const obj of banner.objects) {
      let go = this.objMap.get(obj.id)
      if (!go) {
        go = this.createGameObject(obj)
        if (go) this.objMap.set(obj.id, go)
      }
      if (go) this.applyProps(go, obj)
    }
  }

  private createGameObject(obj: BannerObject): Phaser.GameObjects.GameObject | undefined {
    let go: Phaser.GameObjects.GameObject | undefined

    switch (obj.type) {
      case 'text': {
        const t = this.add.text(obj.x, obj.y, obj.text ?? '', {
          fontFamily: obj.style?.fontFamily ?? 'Arial',
          fontSize: obj.style?.fontSize ? `${obj.style.fontSize}px` : '24px',
          color: obj.style?.color ?? '#ffffff',
        })
        this.enableDrag(t, obj.id)
        go = t
        break
      }
      case 'image': {
        // Use a coloured rectangle placeholder if texture isn't loaded
        if (obj.asset && this.textures.exists(obj.asset)) {
          const img = this.add.image(obj.x, obj.y, obj.asset)
          this.enableDrag(img, obj.id)
          go = img
        } else {
          const r = this.add.rectangle(obj.x, obj.y, 80, 60, 0x334455)
          r.setStrokeStyle(1, 0x7c6af7)
          this.enableDrag(r, obj.id)
          go = r
        }
        break
      }
      case 'sprite': {
        if (obj.asset && this.textures.exists(obj.asset)) {
          const sp = this.add.sprite(obj.x, obj.y, obj.asset)
          if (obj.frameRate) {
            const key = `anim_${obj.id}`
            if (!this.anims.exists(key)) {
              this.anims.create({
                key,
                frames: this.anims.generateFrameNumbers(obj.asset, {
                  start: obj.startFrame ?? 0,
                  end: obj.endFrame ?? -1,
                }),
                frameRate: obj.frameRate,
                repeat: -1,
              })
            }
            sp.play(key)
          }
          this.enableDrag(sp, obj.id)
          go = sp
        } else {
          const r = this.add.rectangle(obj.x, obj.y, 64, 64, 0x225544)
          r.setStrokeStyle(1, 0x34d399)
          this.enableDrag(r, obj.id)
          go = r
        }
        break
      }
      case 'particle': {
        const { width, height } = useEditorStore.getState().banner.size
        const cfg = getParticleConfig(obj.particlePreset ?? 'sparkles', width, height)
        // Phaser 3.60+ uses addParticleEmitter differently — use a Graphics placeholder
        const marker = this.add.circle(obj.x, obj.y, 12, 0xff44ff, 0.5)
        marker.setStrokeStyle(1, 0xff44ff) as unknown
        this.enableDrag(marker, obj.id)
        // Store config for runtime; editor shows placeholder
        ;(marker as unknown as Record<string, unknown>)._particleCfg = cfg
        go = marker
        break
      }
      case 'container': {
        const c = this.add.container(obj.x, obj.y)
        go = c
        break
      }
    }

    return go
  }

  private applyProps(go: Phaser.GameObjects.GameObject, obj: BannerObject) {
    const g = go as unknown as Phaser.GameObjects.Components.Transform &
      Phaser.GameObjects.Components.Depth &
      Phaser.GameObjects.Components.Alpha &
      Phaser.GameObjects.Components.Size

    if ('setPosition' in g) g.setPosition(obj.x, obj.y)
    if ('setScale' in g) {
      const sx = obj.scaleX ?? obj.scale ?? 1
      const sy = obj.scaleY ?? obj.scale ?? 1
      g.setScale(sx, sy)
    }
    if ('setRotation' in g) g.setRotation(obj.rotation ?? 0)
    if ('setAlpha' in g) g.setAlpha(obj.alpha ?? 1)
    if ('setDepth' in g) g.setDepth(obj.depth ?? 0)

    // Update text content
    if (obj.type === 'text' && 'setText' in (go as Phaser.GameObjects.Text)) {
      ;(go as Phaser.GameObjects.Text).setText(obj.text ?? '')
      if (obj.style?.fontSize) {
        ;(go as Phaser.GameObjects.Text).setFontSize(obj.style.fontSize)
      }
      if (obj.style?.color) {
        ;(go as Phaser.GameObjects.Text).setColor(obj.style.color)
      }
    }
  }

  // ── Drag ──────────────────────────────────────────────────
  private enableDrag(go: Phaser.GameObjects.GameObject, id: string) {
    const g = go as Phaser.GameObjects.Components.Transform & Phaser.GameObjects.Image
    g.setInteractive({ draggable: true, useHandCursor: true })

    g.on('pointerdown', () => {
      useEditorStore.getState().selectObject(id)
    })

    g.on('drag', (_p: Phaser.Input.Pointer, dragX: number, dragY: number) => {
      useEditorStore.getState().updateObject(id, { x: Math.round(dragX), y: Math.round(dragY) })
    })

    this.input.setDraggable(g)
  }

  // ── Selection highlight ───────────────────────────────────
  private updateSelection(selectedId: string | null) {
    if (!this.selBox) return
    if (!selectedId) { this.selBox.setVisible(false); return }

    const go = this.objMap.get(selectedId)
    if (!go) { this.selBox.setVisible(false); return }

    const g = go as unknown as Phaser.GameObjects.Components.Transform &
      Phaser.GameObjects.Components.GetBounds
    if ('getBounds' in g) {
      const b = g.getBounds()
      this.selBox.setPosition(b.centerX, b.centerY)
      this.selBox.setSize(b.width + 8, b.height + 8)
      this.selBox.setVisible(true)
    } else {
      this.selBox.setVisible(false)
    }
  }

  // ── Timeline ──────────────────────────────────────────────
  playTimeline(entries: TimelineEntry[]) {
    this.tweens.killAll()
    for (const entry of entries) {
      const go = this.objMap.get(entry.target)
      if (!go) continue

      const target: Record<string, unknown> = {}
      target[entry.type] = entry.value

      this.tweens.add({
        targets: go,
        ...target,
        duration: entry.duration,
        delay: entry.delay ?? 0,
        ease: entry.ease ?? 'Sine.easeInOut',
        repeat: entry.repeat ?? 0,
        yoyo: entry.yoyo ?? false,
      })
    }
  }

  stopTimeline() {
    this.tweens.killAll()
    // Re-apply store positions
    this.syncFromStore(useEditorStore.getState())
  }

  // ── Cleanup ───────────────────────────────────────────────
  shutdown() {
    this.unsub?.()
    this.unsub = null
    this.objMap.clear()
  }
}
