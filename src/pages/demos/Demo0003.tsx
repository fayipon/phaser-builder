import { useState, useRef, useCallback, useLayoutEffect, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Phaser from 'phaser'
import { PixelBannerScene } from '../../game/demos/demo-0003/PixelBannerScene'
import type { PixelData } from '../../game/demos/demo-0003/PixelBannerScene'

/* ══════════════════════════════════════════════
   Built-in sample — 32×18 sunset gradient
   ══════════════════════════════════════════════ */
function generateSample(): PixelData {
  const cols = 48
  const rows = 27
  const palette = [
    '#0b0d2e', '#111752', '#1a2372', '#1f3596', '#2648a8',
    '#3060b8', '#4080c0', '#60a0d0', '#80c0dd', '#a0d8e8',
    '#f0a050', '#e88040', '#e06030', '#d04020', '#b82818',
    '#f8c870', '#f0e0a0', '#ffe8c0', '#ffd0a0', '#ffb880',
    '#180830', '#201048', '#301860', '#3a206e', '#482880',
  ]
  const pixels: number[][] = []
  for (let r = 0; r < rows; r++) {
    const row: number[] = []
    const fy = r / (rows - 1) // 0 (top) → 1 (bottom)
    for (let c = 0; c < cols; c++) {
      const fx = c / (cols - 1)
      // Sky: dark blue (top) → lighter blue (horizon)
      // Ground: orange/red (horizon) → dark purple (bottom)
      const horizon = 0.55
      let idx: number
      if (fy < horizon) {
        // Sky zone
        const t = fy / horizon
        const noise = Math.sin(fx * 12 + r * 0.5) * 0.08
        const skyIdx = Math.min(9, Math.max(0, Math.round((t + noise) * 9)))
        idx = skyIdx
      } else if (fy < horizon + 0.12) {
        // Horizon glow
        const t = (fy - horizon) / 0.12
        const glowPalette = [15, 16, 17, 18, 19, 10]
        const noise = Math.sin(fx * 8) * 0.15
        const gi = Math.min(glowPalette.length - 1, Math.max(0, Math.round((t + noise) * (glowPalette.length - 1))))
        idx = glowPalette[gi]
      } else {
        // Ground
        const t = (fy - horizon - 0.12) / (1 - horizon - 0.12)
        const groundPalette = [11, 12, 13, 14, 20, 21, 22, 23, 24]
        const noise = Math.sin(fx * 6 + r * 0.3) * 0.1
        const gi = Math.min(groundPalette.length - 1, Math.max(0, Math.round((t + noise) * (groundPalette.length - 1))))
        idx = groundPalette[gi]
      }
      row.push(idx)
    }
    pixels.push(row)
  }
  return { cols, rows, palette, pixels }
}

const SAMPLE_DATA = generateSample()

/* ══════════════════════════════════════════════
   Overlay Presets — text displayed on top of banner
   ══════════════════════════════════════════════ */
const OVERLAY_PRESETS = [
  { title: 'Welcome Home', subtitle: 'A pixel-perfect experience awaits you' },
  { title: '像素藝術世界', subtitle: '用 JSON 驅動的視覺體驗' },
  { title: 'Game Night', subtitle: 'Explore retro-styled interactive banners' },
  { title: 'Custom', subtitle: '' },
]

/* ══════════════════════════════════════════════
   Component
   ══════════════════════════════════════════════ */
export default function Demo0003() {
  const [pixelData, setPixelData] = useState<PixelData>(SAMPLE_DATA)
  const [jsonText, setJsonText] = useState('')
  const [jsonError, setJsonError] = useState<string | null>(null)
  const [animEnabled, setAnimEnabled] = useState(true)
  const [overlayIdx, setOverlayIdx] = useState(0)
  const [customTitle, setCustomTitle] = useState('')
  const [customSubtitle, setCustomSubtitle] = useState('')
  const [sourceLabel, setSourceLabel] = useState('內建範例')
  const [showJsonPanel, setShowJsonPanel] = useState(false)
  const [phase, setPhase] = useState<'title' | 'reveal'>('title') // animation phase

  const containerRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<Phaser.Game | null>(null)
  const sceneRef = useRef<PixelBannerScene | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  /* Mount Phaser once */
  useLayoutEffect(() => {
    if (!containerRef.current) return
    const el = containerRef.current

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: el,
      width: el.offsetWidth || 800,
      height: el.offsetHeight || 450,
      backgroundColor: '#080808',
      scene: [PixelBannerScene],
      scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
      render: { antialias: false, pixelArt: true },
      fps: { target: 30, limit: 30 },
      audio: { noAudio: true },
      banner: false,
    })
    gameRef.current = game

    game.events.once('ready', () => {
      const scene = game.scene.getScene('PixelBannerScene') as unknown as PixelBannerScene
      sceneRef.current = scene
      // Push initial sample data
      scene.events.emit('pixel-data', SAMPLE_DATA)
    })

    return () => {
      gameRef.current = null
      sceneRef.current = null
      game.destroy(true)
    }
  }, [])

  /* Banner animation loop: title → reveal → title … */
  useEffect(() => {
    if (!animEnabled) {
      setPhase('reveal')
      return
    }
    let cancelled = false
    const loop = () => {
      if (cancelled) return
      setPhase('title')
      setTimeout(() => {
        if (cancelled) return
        setPhase('reveal')
        setTimeout(() => {
          if (cancelled) return
          loop()
        }, 3500) // stay revealed
      }, 2500)   // stay with title
    }
    loop()
    return () => { cancelled = true }
  }, [animEnabled])

  /* Push pixel data to scene */
  useEffect(() => {
    if (!sceneRef.current) return
    sceneRef.current.events.emit('pixel-data', pixelData)
  }, [pixelData])

  /* Toggle animation */
  useEffect(() => {
    if (!sceneRef.current) return
    sceneRef.current.events.emit('toggle-animation', animEnabled)
  }, [animEnabled])

  /* Parse & apply JSON */
  const applyJson = useCallback((raw: string, label: string) => {
    try {
      const obj = JSON.parse(raw)
      // Validate shape
      if (
        typeof obj.cols !== 'number' ||
        typeof obj.rows !== 'number' ||
        !Array.isArray(obj.palette) ||
        !Array.isArray(obj.pixels)
      ) {
        setJsonError('JSON 格式錯誤：缺少 cols / rows / palette / pixels 欄位')
        return
      }
      setJsonError(null)
      setPixelData(obj as PixelData)
      setSourceLabel(label)
    } catch {
      setJsonError('JSON 解析失敗：格式不正確')
    }
  }, [])

  /* File upload */
  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0]
      if (!f) return
      const reader = new FileReader()
      reader.onload = () => {
        const text = reader.result as string
        setJsonText(text)
        applyJson(text, f.name)
      }
      reader.readAsText(f)
    },
    [applyJson],
  )

  /* Use sample */
  const useSample = useCallback(() => {
    setPixelData(SAMPLE_DATA)
    setJsonText('')
    setJsonError(null)
    setSourceLabel('內建範例')
  }, [])

  /* Paste apply */
  const applyPasted = useCallback(() => {
    applyJson(jsonText, '貼上 JSON')
  }, [jsonText, applyJson])

  /* Current overlay text */
  const preset = OVERLAY_PRESETS[overlayIdx]
  const bannerTitle = overlayIdx === OVERLAY_PRESETS.length - 1 ? customTitle || 'Your Banner' : preset.title
  const bannerSubtitle = overlayIdx === OVERLAY_PRESETS.length - 1 ? customSubtitle || 'Custom subtitle here' : preset.subtitle

  return (
    <div className="min-h-screen bg-[#070710] text-white flex flex-col">
      {/* ── Nav ── */}
      <header className="border-b border-white/[0.06] flex-shrink-0">
        <div className="max-w-6xl mx-auto px-5 sm:px-10 h-14 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors text-sm"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            返回首頁
          </Link>
          <span className="text-[11px] font-semibold uppercase tracking-widest text-white/25 border border-white/10 rounded-full px-2.5 py-0.5">
            Demo 0003
          </span>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex-1 flex flex-col max-w-6xl mx-auto w-full px-5 sm:px-10 py-8 sm:py-12 gap-6">
        {/* Title */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white/85 mb-1">
            JSON Banner 背景
          </h1>
          <p className="text-sm text-white/35">
            匯入像素轉化器匯出的 JSON → Phaser 渲染為動態 Banner 背景 → 自訂覆蓋文字
          </p>
        </div>

        {/* ── Banner Preview (Leonardo.ai style: title corner + clip reveal) ── */}
        <div className="relative rounded-2xl overflow-hidden border border-white/[0.07] bg-black"
          style={{ height: '50vh', minHeight: '360px' }}>

          {/* Pixel art canvas — clip-path animates between clipped & full rect */}
          <div
            className="absolute inset-0 z-0"
            style={{
              clipPath: phase === 'title'
                ? 'polygon(50% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 100%)'
                : 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%)',
              transition: 'clip-path 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <div ref={containerRef} className="absolute inset-0" />

            {/* Subtle gradient overlay on the image edge */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: phase === 'title'
                  ? 'linear-gradient(135deg, rgba(0,0,0,0.4) 0%, transparent 40%)'
                  : 'none',
                transition: 'background 1.2s ease',
              }}
            />
          </div>

          {/* Title block — occupies the left half of the banner */}
          <div
            className="absolute z-10 flex flex-col justify-center pointer-events-none select-none"
            style={{
              left: 0,
              top: 0,
              width: '50%',
              height: '100%',
              padding: 'clamp(1.5rem, 4vw, 3.5rem)' ,
              opacity: phase === 'title' ? 1 : 0,
              transform: phase === 'title' ? 'translate(0, 0)' : 'translate(-8%, -8%)',
              transition: 'opacity 0.8s ease, transform 1s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <h2
              className="text-4xl sm:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tighter text-white leading-[0.9] uppercase"
              style={{ textShadow: '0 2px 30px rgba(0,0,0,0.4)' }}
            >
              {bannerTitle}
            </h2>
            {bannerSubtitle && (
              <p className="mt-3 sm:mt-4 text-xs sm:text-sm lg:text-base text-white/60 max-w-md leading-relaxed tracking-wide">
                {bannerSubtitle}
              </p>
            )}
          </div>

          {/* Diagonal line accent — the edge between title and image */}
          <div
            className="absolute z-10 pointer-events-none"
            style={{
              left: 0,
              top: 0,
              width: '100%',
              height: '100%',
              opacity: phase === 'title' ? 0.3 : 0,
              transition: 'opacity 0.8s ease',
              background: 'linear-gradient(to bottom right, transparent 49.5%, rgba(255,255,255,0.12) 49.5%, rgba(255,255,255,0.12) 50.5%, transparent 50.5%)',
              clipPath: 'polygon(0% 0%, 55% 0%, 0% 105%)',
            }}
          />

          {/* Source badge */}
          <span className="absolute top-3 left-3 z-20 text-[10px] font-semibold uppercase tracking-widest text-white/30 bg-black/40 rounded px-2 py-0.5"
            style={{
              opacity: phase === 'title' ? 0 : 0.6,
              transition: 'opacity 0.5s ease 0.5s',
            }}>
            {sourceLabel}
          </span>

          {/* Stats badge */}
          <span className="absolute top-3 right-3 z-20 text-[10px] font-mono text-white/25 bg-black/40 rounded px-2 py-0.5">
            {pixelData.cols}×{pixelData.rows} · {pixelData.palette.length} 色
          </span>

          {/* Repeat indicator */}
          <button
            onClick={() => setAnimEnabled(!animEnabled)}
            className="absolute bottom-4 right-4 z-20 text-[11px] font-medium text-white/50 bg-black/50 hover:bg-black/70 rounded-full px-3 py-1.5 transition-colors cursor-pointer"
          >
            {animEnabled ? '⏸ Pause' : '▶ Play'}
          </button>
        </div>

        {/* ── Controls Row ── */}
        <div className="flex flex-wrap items-end gap-4">
          {/* Upload JSON file */}
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-white/30 uppercase tracking-wider">匯入 JSON</span>
            <input
              ref={fileRef}
              type="file"
              accept=".json,application/json"
              onChange={onFileChange}
              className="text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border file:border-white/10 file:bg-white/5 file:text-white/70 file:text-sm file:font-medium file:cursor-pointer hover:file:bg-white/10 transition-colors bg-transparent text-white/40"
            />
          </label>

          {/* Use sample */}
          <button
            onClick={useSample}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-white/10 bg-white/5 text-white/60 hover:bg-white/10 transition-colors"
          >
            使用內建範例
          </button>

          {/* Toggle JSON panel */}
          <button
            onClick={() => setShowJsonPanel(!showJsonPanel)}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-white/10 bg-white/5 text-white/60 hover:bg-white/10 transition-colors"
          >
            {showJsonPanel ? '隱藏' : '貼上'} JSON
          </button>
        </div>

        {/* ── JSON Paste Panel (collapsible) ── */}
        {showJsonPanel && (
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 sm:p-5 flex flex-col gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-white/25">
              貼上 JSON（像素轉化器格式）
            </p>
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder='{"cols":64,"rows":36,"palette":["#0a0e2a",...],"pixels":[[0,1,...],...]}'
              className="w-full h-36 sm:h-44 bg-black/30 border border-white/10 rounded-lg p-3 text-xs font-mono text-white/60 placeholder:text-white/15 focus:outline-none focus:border-emerald-500/40 resize-none"
            />
            {jsonError && (
              <p className="text-xs text-red-400/80">{jsonError}</p>
            )}
            <button
              onClick={applyPasted}
              disabled={!jsonText.trim()}
              className="self-start px-4 py-2 rounded-lg text-sm font-medium border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              套用
            </button>
          </div>
        )}

        {/* ── Overlay Text Editor ── */}
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 sm:p-5 flex flex-col gap-4">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-white/25">
            Banner 覆蓋文字
          </p>
          {/* Preset pills */}
          <div className="flex flex-wrap gap-2">
            {OVERLAY_PRESETS.map((p, i) => (
              <button
                key={i}
                onClick={() => setOverlayIdx(i)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  overlayIdx === i
                    ? 'border-indigo-500/40 bg-indigo-500/15 text-indigo-300'
                    : 'border-white/10 bg-white/5 text-white/40 hover:bg-white/10'
                }`}
              >
                {p.title}
              </button>
            ))}
          </div>
          {/* Custom inputs */}
          {overlayIdx === OVERLAY_PRESETS.length - 1 && (
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="標題 ..."
                className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 placeholder:text-white/20 focus:outline-none focus:border-indigo-500/40"
              />
              <input
                value={customSubtitle}
                onChange={(e) => setCustomSubtitle(e.target.value)}
                placeholder="副標題 ..."
                className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 placeholder:text-white/20 focus:outline-none focus:border-indigo-500/40"
              />
            </div>
          )}
        </div>

        {/* Palette preview */}
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 sm:p-5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-white/25 mb-3">
            調色盤 — {pixelData.palette.length} 色
          </p>
          <div className="flex flex-wrap gap-1.5">
            {pixelData.palette.map((hex, i) => (
              <div
                key={i}
                className="w-7 h-7 rounded-md border border-white/10"
                style={{ backgroundColor: hex }}
                title={hex}
              />
            ))}
          </div>
        </div>

        {/* Implementation notes */}
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 sm:p-5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-white/25 mb-3">
            實作重點
          </p>
          <ul className="flex flex-col gap-1.5">
            {[
              '載入 Demo 0002 匯出的 JSON 格式：{ cols, rows, palette[], pixels[][] }',
              'Phaser 將像素資料渲染為全幅 Banner 背景（fillRect 繪製）',
              '動態 shimmer 效果 — 隨機像素短暫提亮，模擬閃爍質感',
              '水平 parallax 位移 + 電影級暗角（vignette）疊加',
              '覆蓋文字預設 / 自訂，展示 Banner 的真實使用場景',
              '支援匯入 JSON 檔案或直接貼上 JSON 文字',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-white/40">
                <span className="text-indigo-500/60 mt-0.5 flex-shrink-0">·</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
