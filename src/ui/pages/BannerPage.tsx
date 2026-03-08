import { useEffect, useRef } from 'react'
import { useParams, Navigate, Link } from 'react-router-dom'
import Phaser from 'phaser'
import { BannerScene } from '../../game/scenes/BannerScene'
import { BANNER_BY_SLUG, BANNER_TOTAL } from '../../data/bannerSlides'
import styles from './BannerPage.module.css'

const CANVAS_ID = 'banner-canvas'

export default function BannerPage() {
  const { slug } = useParams<{ slug: string }>()
  const slide = BANNER_BY_SLUG[slug ?? '']
  const gameRef = useRef<Phaser.Game | null>(null)

  useEffect(() => {
    if (!slide) return

    const startIndex = slide.index
    const game = new Phaser.Game({
      parent: CANVAS_ID,
      type: Phaser.AUTO,
      width: 1200,
      height: 420,
      transparent: true,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    })

    game.events.once('ready', () => {
      game.scene.add('BannerScene', BannerScene, true, {
        startIndex,
        singleMode: true,
      })
    })

    gameRef.current = game

    return () => {
      gameRef.current?.destroy(true)
      gameRef.current = null
    }
  }, [slide?.index])

  if (!slide) return <Navigate to="/banner-demo" replace />

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/banner-demo" className={styles.back}>← 返回選單</Link>
        <div>
          <h1 className={styles.title}>{slide.title}</h1>
          <p className={styles.sub}>{slide.sub}</p>
        </div>
      </header>

      <section className={styles.stage}>
        <div id={CANVAS_ID} className={styles.canvas} />

        <div className={styles.overlay}>
          <span className={styles.badge} style={{ color: slide.accentHex }}>
            {String(slide.index + 1).padStart(2, '0')} / {String(BANNER_TOTAL).padStart(2, '0')}
          </span>
          <h2 className={styles.slideTitle}>{slide.title}</h2>
          <div className={styles.accentLine} style={{ background: slide.accentHex }} />
          <p className={styles.slideSub}>{slide.sub}</p>
        </div>
      </section>
    </div>
  )
}
