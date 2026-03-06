import { useEffect, useRef, useState } from 'react'
import Phaser from 'phaser'
import { BannerScene } from '../../game/scenes/BannerScene'
import { bus } from '../../bridge/EventBus'
import { BANNER_SLIDES, BANNER_TOTAL } from '../../data/bannerSlides'
import styles from './BannerDemoPage.module.css'

const TOTAL = BANNER_TOTAL
const CANVAS_ID = 'banner-canvas'

export default function BannerDemoPage() {
  const gameRef = useRef<Phaser.Game | null>(null)
  const [active, setActive] = useState(0)

  // ── Mount / unmount Phaser ────────────────────────────────
  useEffect(() => {
    gameRef.current = new Phaser.Game({
      parent: CANVAS_ID,
      type: Phaser.AUTO,
      width: 1200,
      height: 420,
      transparent: true,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      scene: [BannerScene],
    })

    const onChanged = ({ index }: { index: number }) => setActive(index)
    bus.on('banner:changed', onChanged)

    return () => {
      bus.off('banner:changed', onChanged)
      gameRef.current?.destroy(true)
      gameRef.current = null
    }
  }, [])

  // ── Controls ──────────────────────────────────────────────
  const goto = (index: number) => {
    const next = Math.max(0, Math.min(TOTAL - 1, index))
    bus.emit('banner:goto', { index: next })
  }

  const slide = BANNER_SLIDES[active]

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Banner Demo</h1>
        <p>Three Phaser-rendered banners — drag, swipe, or use the controls.</p>
      </header>

      <section className={styles.stage}>
        {/* ── Phaser animated background ── */}
        <div id={CANVAS_ID} className={styles.canvas} />

        {/* ── React text overlay ── */}
        <div className={styles.overlay}>
          {BANNER_SLIDES.map((s, i) => (
            <div
              key={i}
              className={`${styles.slideText} ${i === active ? styles.slideTextActive : ''}`}
            >
              <span className={styles.badge} style={{ color: s.accentHex }}>
                {String(i + 1).padStart(2, '0')} / {String(TOTAL).padStart(2, '0')}
              </span>
              <h2 className={styles.slideTitle}>{s.title}</h2>
              <div className={styles.accentLine} style={{ background: s.accentHex }} />
              <p className={styles.slideSub}>{s.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Arrow buttons ── */}
        <button
          className={`${styles.arrow} ${styles.arrowLeft}`}
          onClick={() => goto(active - 1)}
          disabled={active === 0}
          aria-label="Previous slide"
        >
          ‹
        </button>
        <button
          className={`${styles.arrow} ${styles.arrowRight}`}
          onClick={() => goto(active + 1)}
          disabled={active === TOTAL - 1}
          aria-label="Next slide"
        >
          ›
        </button>

        {/* ── Dot indicators ── */}
        <div className={styles.dots} role="tablist" aria-label="Slide indicators">
          {BANNER_SLIDES.map((_s, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === active}
              aria-label={`Go to slide ${i + 1}`}
              className={`${styles.dot} ${i === active ? styles.dotActive : ''}`}
              style={i === active ? { background: slide.accentHex } : undefined}
              onClick={() => goto(i)}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
