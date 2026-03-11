import { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import { FarmScene } from '../../game/scenes/FarmScene'
import styles from './FarmPage.module.css'

const CANVAS_ID = 'farm-canvas'

export default function FarmPage() {
  const gameRef = useRef<Phaser.Game | null>(null)

  useEffect(() => {
    const game = new Phaser.Game({
      parent: CANVAS_ID,
      type: Phaser.WEBGL,
      backgroundColor: '#000000',
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: '100%',
        height: '100%',
      },
      render: {
        antialias: false,
        pixelArt: true,
        roundPixels: true,
      },
      fps: {
        target: 30,
        forceSetTimeOut: true,
      },
      scene: [FarmScene],
    })

    gameRef.current = game

    return () => {
      gameRef.current?.destroy(true)
      gameRef.current = null
    }
  }, [])

  return (
    <div className={styles.page}>
      <div id={CANVAS_ID} className={styles.canvas} />
    </div>
  )
}
