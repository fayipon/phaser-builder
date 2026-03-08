import Toolbar from './toolbar/Toolbar'
import AssetsPanel from './assets/AssetsPanel'
import Canvas from './canvas/Canvas'
import PropertiesPanel from './properties/PropertiesPanel'
import TimelinePanel from './timeline/TimelinePanel'
import styles from './StudioPage.module.css'

export default function StudioPage() {
  return (
    <div className={styles.studio}>
      <Toolbar />
      <div className={styles.body}>
        <div className={styles.leftPanel}>
          <AssetsPanel />
        </div>
        <div className={styles.center}>
          <Canvas />
          <TimelinePanel />
        </div>
        <div className={styles.rightPanel}>
          <PropertiesPanel />
        </div>
      </div>
    </div>
  )
}
