import styles from './HomePage.module.css'
import DemoCard from '../components/DemoCard'
import { demoMeta } from '../../routesMeta'

const PHASER_VERSION = '3.87'
const REACT_VERSION = '18'

export default function HomePage() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <h1 className={styles.headline}>
          <span className={styles.headlineLine1}>Build & showcase</span>
          <span className={styles.headlineLine2}>Phaser demos</span>
        </h1>
        <p className={styles.description}>
          以 React + Phaser 3 打造的互動遊戲場景展示站。<br />
          每個 demo 直接在瀏覽器中即時體驗，無需安裝。
        </p>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{demoMeta.length}</span>
            <span className={styles.statLabel}>DEMOS</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statValue}>{PHASER_VERSION}</span>
            <span className={styles.statLabel}>PHASER</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statValue}>{REACT_VERSION}</span>
            <span className={styles.statLabel}>REACT</span>
          </div>
        </div>
      </section>

      <section className={styles.demoSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>ALL DEMOS</h2>
          <span className={styles.demoCount}>
            {demoMeta.length} / {demoMeta.length}
          </span>
        </div>

        {demoMeta.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>🚧</span>
            <p>No demos yet — more pages coming soon.</p>
          </div>
        ) : (
          <ul className={styles.grid}>
            {demoMeta.map((r) => (
              <li key={r.path}>
                <DemoCard
                  path={r.path}
                  title={r.label}
                  description={r.description ?? ''}
                  tech={r.tech}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className={styles.footer}>
        <span>Built with React + Phaser 3</span>
      </footer>
    </div>
  )
}
