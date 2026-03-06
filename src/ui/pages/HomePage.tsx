import styles from './HomePage.module.css'
import DemoCard from '../components/DemoCard'
import { demoMeta } from '../../routesMeta'

export default function HomePage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.logo}>
          <span className={styles.logoAccent}>Phaser</span> Builder
        </h1>
        <p className={styles.tagline}>
          A collection of interactive Phaser 3 demos built with React.
        </p>
      </header>

      <main className={styles.main}>
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
                />
              </li>
            ))}
          </ul>
        )}
      </main>

      <footer className={styles.footer}>
        <span>phaser-builder</span>
      </footer>
    </div>
  )
}
