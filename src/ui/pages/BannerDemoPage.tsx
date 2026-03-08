import { Link } from 'react-router-dom'
import { BANNER_SLIDES } from '../../data/bannerSlides'
import styles from './BannerDemoPage.module.css'

export default function BannerDemoPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Banner Demo</h1>
        <p>選擇一個 banner，獨立體驗 Phaser 渲染效果。</p>
      </header>

      <div className={styles.selector}>
        {BANNER_SLIDES.map((s) => (
          <Link
            key={s.slug}
            to={`/banner-demo/${s.slug}`}
            className={styles.selectorCard}
            style={{ '--card-accent': s.accentHex } as React.CSSProperties}
          >
            <span className={styles.selectorBar} />
            <span className={styles.selectorIndex}>
              {String(s.index + 1).padStart(2, '0')}
            </span>
            <span className={styles.selectorTitle}>{s.title}</span>
            <span className={styles.selectorSub}>{s.sub}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
