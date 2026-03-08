import { Link } from 'react-router-dom'
import styles from './DemoCard.module.css'

interface DemoCardProps {
  title: string
  description: string
  path: string
  tech?: 'REACT' | 'PHASER'
}

export default function DemoCard({ title, description, path, tech }: DemoCardProps) {
  const techClass = tech === 'REACT' ? styles.techREACT : styles.techPHASER

  return (
    <Link to={path} className={styles.card} aria-label={title}>
      <div className={styles.cardTop}>
        <span className={styles.icon} aria-hidden>🎮</span>
        {tech && (
          <span className={`${styles.techBadge} ${techClass}`}>{tech}</span>
        )}
      </div>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.description}>{description}</p>
      <span className={styles.cta}>開始體驗 →</span>
    </Link>
  )
}
