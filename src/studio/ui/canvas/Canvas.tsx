import { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import { EditorScene } from '../../engine'
import { useEditorStore } from '../../store/editorStore'
import styles from './Canvas.module.css'

const CANVAS_ID = 'studio-canvas'

export default function Canvas() {
  const gameRef = useRef<Phaser.Game | null>(null)
  const sceneRef = useRef<EditorScene | null>(null)
  const { banner, playing } = useEditorStore()

  useEffect(() => {
    const game = new Phaser.Game({
      parent: CANVAS_ID,
      type: Phaser.AUTO,
      width: banner.size.width,
      height: banner.size.height,
      backgroundColor: '#0d0d1a',
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      scene: [EditorScene],
    })

    game.events.once('ready', () => {
      sceneRef.current = game.scene.getScene('EditorScene') as EditorScene
    })
    gameRef.current = game

    return () => {
      sceneRef.current = null
      game.destroy(true)
      gameRef.current = null
    }
    // Recreate when banner size changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [banner.size.width, banner.size.height])

  // Play / stop timeline
  useEffect(() => {
    if (!sceneRef.current) return
    if (playing) {
      sceneRef.current.playTimeline(banner.timeline)
    } else {
      sceneRef.current.stopTimeline()
    }
  }, [playing, banner.timeline])

  return (
    <div className={styles.wrapper}>
      <div className={styles.sizeLabel}>
        {banner.size.width} × {banner.size.height}
      </div>
      <div id={CANVAS_ID} className={styles.canvas} />
    </div>
  )
}
