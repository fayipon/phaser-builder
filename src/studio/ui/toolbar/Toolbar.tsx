import { useEditorStore } from '../../store/editorStore'
import { BANNER_SIZES } from '../../dsl'
import styles from './Toolbar.module.css'

export default function Toolbar() {
  const { banner, setPlaying, playing, exportDSL, reset, setBannerSize, loadBanner } =
    useEditorStore()

  const handleExport = () => {
    const dsl = exportDSL()
    const json = JSON.stringify(dsl, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'banner.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      const text = await file.text()
      try {
        const dsl = JSON.parse(text)
        loadBanner(dsl)
      } catch {
        alert('Invalid JSON file')
      }
    }
    input.click()
  }

  const sizeKey = `${banner.size.width}x${banner.size.height}`

  return (
    <div className={styles.toolbar}>
      <span className={styles.brand}>Banner AI Studio</span>

      <div className={styles.group}>
        <label className={styles.label}>Size</label>
        <select
          className={styles.select}
          value={sizeKey}
          onChange={(e) => {
            const s = BANNER_SIZES[e.target.value]
            if (s) setBannerSize(s)
          }}
        >
          {Object.keys(BANNER_SIZES).map((k) => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>
      </div>

      <div className={styles.actions}>
        <button className={styles.btn} onClick={() => setPlaying(!playing)}>
          {playing ? '⏹ Stop' : '▶ Play'}
        </button>
        <button className={styles.btn} onClick={handleExport}>
          📦 Export JSON
        </button>
        <button className={styles.btn} onClick={handleImport}>
          📂 Import
        </button>
        <button className={styles.btnDanger} onClick={reset}>
          🗑 Reset
        </button>
      </div>
    </div>
  )
}
