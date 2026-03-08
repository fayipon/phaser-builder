import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import Phaser from 'phaser'
import { FarmScene } from '../../game/scenes/FarmScene'
import styles from './FarmPage.module.css'

const CANVAS_ID = 'farm-canvas'

export default function FarmPage() {
  const gameRef = useRef<Phaser.Game | null>(null)

  useEffect(() => {
    const game = new Phaser.Game({
      parent: CANVAS_ID,
      type: Phaser.AUTO,
      backgroundColor: '#1a2a1a',
      width: 900,
      height: 560,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
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
      <header className={styles.header}>
        <Link to="/" className={styles.back}>← 返回首頁</Link>
        <h1 className={styles.title}>🌾 開心農場</h1>
        <p className={styles.sub}>45° 等角視角 ‧ 點擊格子種植與收成</p>
      </header>

      <div id={CANVAS_ID} className={styles.canvas} />
    </div>
  )
}
