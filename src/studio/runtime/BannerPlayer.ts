import Phaser from 'phaser'
import type { BannerDSL, BannerObject, TimelineEntry } from '../dsl'
import { getParticleConfig } from '../engine/particles'

/**
 * RuntimeScene — lightweight read-only Phaser scene that renders
 * a BannerDSL JSON and plays its timeline automatically.
 */
class RuntimeScene extends Phaser.Scene {
  private dsl!: BannerDSL
  private objMap = new Map<string, Phaser.GameObjects.GameObject>()

  constructor() {
    super({ key: 'RuntimeScene' })
  }

  init(data: { dsl: BannerDSL }) {
    this.dsl = data.dsl
  }

  create() {
    const { size, objects, timeline } = this.dsl

    // Background
    this.cameras.main.setBackgroundColor('#0c0c1a')

    // Build objects
    objects
      .slice()
      .sort((a, b) => (a.depth ?? 0) - (b.depth ?? 0))
      .forEach((obj) => this.buildObject(obj, size.width, size.height))

    // Play timeline tweens
    timeline.forEach((entry) => this.playTween(entry))
  }

  private buildObject(obj: BannerObject, w: number, h: number) {
    let go: Phaser.GameObjects.GameObject | null = null

    switch (obj.type) {
      case 'text': {
        const t = this.add.text(obj.x, obj.y, obj.text ?? '', {
          fontFamily: obj.style?.fontFamily ?? 'Arial',
          fontSize: `${obj.style?.fontSize ?? 16}px`,
          color: obj.style?.color ?? '#ffffff',
          fontStyle: obj.style?.fontStyle ?? '',
          align: obj.style?.align ?? 'left',
          stroke: obj.style?.stroke,
          strokeThickness: obj.style?.strokeThickness,
          wordWrap: obj.style?.wordWrap,
        })
        t.setOrigin(0.5)
        go = t
        break
      }
      case 'image': {
        // Without real assets use a placeholder rectangle
        const rect = this.add.rectangle(obj.x, obj.y, 80, 60, 0x333366)
        rect.setStrokeStyle(1, 0x7c6af7)
        go = rect
        break
      }
      case 'sprite': {
        const rect = this.add.rectangle(obj.x, obj.y, 64, 64, 0x336644)
        rect.setStrokeStyle(1, 0x34d399)
        go = rect
        break
      }
      case 'particle': {
        if (obj.particlePreset) {
          const cfg = getParticleConfig(obj.particlePreset, w, h)
          // Phaser 3.60+ uses addParticleEmitter API
          if (this.add.particles) {
            const emitter = this.add.particles(obj.x, obj.y, '__WHITE', cfg)
            go = emitter
          }
        }
        break
      }
      default:
        break
    }

    if (go) {
      const t = go as Phaser.GameObjects.Components.Transform & Phaser.GameObjects.Components.Alpha & Phaser.GameObjects.Components.Depth & Phaser.GameObjects.GameObject
      if (obj.scale !== undefined) t.setScale(obj.scale)
      if (obj.scaleX !== undefined && obj.scaleY !== undefined) t.setScale(obj.scaleX, obj.scaleY)
      if (obj.rotation !== undefined) t.setRotation(obj.rotation)
      if (obj.alpha !== undefined) t.setAlpha(obj.alpha)
      if (obj.depth !== undefined) t.setDepth(obj.depth)
      this.objMap.set(obj.id, go)
    }
  }

  private playTween(entry: TimelineEntry) {
    const go = this.objMap.get(entry.target)
    if (!go) return

    this.tweens.add({
      targets: go,
      [entry.type]: entry.value,
      duration: entry.duration,
      delay: entry.delay ?? 0,
      ease: entry.ease ?? 'Sine.easeInOut',
      repeat: entry.repeat ?? 0,
      yoyo: entry.yoyo ?? false,
    })
  }
}

/**
 * Mount a lightweight read-only Phaser banner player into the given DOM element.
 * Returns a destroy function.
 */
export function createBannerPlayer(
  container: HTMLElement,
  dsl: BannerDSL,
): { destroy: () => void } {
  // Generate a white pixel texture at runtime (used by particles)
  // Boot scene that creates a white pixel texture then hands off to RuntimeScene
  class BootScene extends Phaser.Scene {
    constructor() { super({ key: 'BootRuntime' }) }
    create() {
      const g = this.add.graphics()
      g.fillStyle(0xffffff, 1)
      g.fillRect(0, 0, 4, 4)
      g.generateTexture('__WHITE', 4, 4)
      g.destroy()
      this.scene.start('RuntimeScene', { dsl })
    }
  }

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: container,
    width: dsl.size.width,
    height: dsl.size.height,
    backgroundColor: '#0c0c1a',
    scene: [BootScene, RuntimeScene],
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
  })

  return {
    destroy: () => game.destroy(true),
  }
}
