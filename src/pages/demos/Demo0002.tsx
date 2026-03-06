import { useState, useRef, useCallback, useLayoutEffect, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Phaser from 'phaser'
import { PixelArtScene } from '../../game/demos/demo-0002/PixelArtScene'
import type { PixelData } from '../../game/demos/demo-0002/PixelArtScene'

/* ── Config ── */
const DEFAULT_GRID = 128   // default cols
const DEFAULT_COLORS = 32  // palette size
const GRID_OPTIONS = [64, 96, 128, 192, 256]
const COLOR_OPTIONS = [8, 16, 32, 48, 64]

/* ── Pixelate an image in pure JS ── */
function pixelate(
  img: HTMLImageElement,
  gridSize: number,
  colorCount: number,
): PixelData {
  const { naturalWidth: w, naturalHeight: h } = img

  // 1. Downsample to small grid
  const cols = gridSize
  const rows = Math.round((h / w) * cols)
  const cvs = document.createElement('canvas')
  cvs.width = cols
  cvs.height = rows
  const ctx = cvs.getContext('2d')!
  ctx.imageSmoothingEnabled = true
  ctx.drawImage(img, 0, 0, cols, rows)
  const raw = ctx.getImageData(0, 0, cols, rows).data

  // 2. Collect all pixels
  const allColors: [number, number, number][] = []
  for (let i = 0; i < raw.length; i += 4) {
    allColors.push([raw[i], raw[i + 1], raw[i + 2]])
  }

  // 3. Median-cut quantization (simplified)
  const palette = medianCut(allColors, colorCount)

  // 4. Map each pixel to nearest palette colour
  const pixels: number[][] = []
  let idx = 0
  for (let r = 0; r < rows; r++) {
    const row: number[] = []
    for (let c = 0; c < cols; c++) {
      const [pr, pg, pb] = allColors[idx++]
      row.push(nearest(pr, pg, pb, palette))
    }
    pixels.push(row)
  }

  const hexPalette = palette.map(
    ([r, g, b]) => `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`,
  )

  return { cols, rows, palette: hexPalette, pixels }
}

/* ── Median-cut colour quantization ── */
function medianCut(
  colors: [number, number, number][],
  target: number,
): [number, number, number][] {
  if (colors.length === 0) return [[0, 0, 0]]

  type Bucket = [number, number, number][]
  // IMPORTANT: deep-copy so sorting doesn't scramble the caller's pixel array
  let buckets: Bucket[] = [colors.map((c) => [...c] as [number, number, number])]

  while (buckets.length < target) {
    // Pick the bucket with the widest channel range
    let bestIdx = 0
    let bestRange = -1
    let bestCh = 0
    for (let i = 0; i < buckets.length; i++) {
      for (let ch = 0; ch < 3; ch++) {
        const vals = buckets[i].map((c) => c[ch])
        const range = Math.max(...vals) - Math.min(...vals)
        if (range > bestRange) {
          bestRange = range
          bestIdx = i
          bestCh = ch
        }
      }
    }
    if (bestRange <= 0) break

    const bucket = buckets.splice(bestIdx, 1)[0]
    bucket.sort((a, b) => a[bestCh] - b[bestCh])
    const mid = Math.floor(bucket.length / 2)
    buckets.push(bucket.slice(0, mid), bucket.slice(mid))
  }

  // Average each bucket
  return buckets.map((b) => {
    const len = b.length || 1
    const sum = b.reduce((a, c) => [a[0] + c[0], a[1] + c[1], a[2] + c[2]], [0, 0, 0])
    return [Math.round(sum[0] / len), Math.round(sum[1] / len), Math.round(sum[2] / len)] as [number, number, number]
  })
}

function nearest(r: number, g: number, b: number, pal: [number, number, number][]): number {
  let best = 0
  let bestD = Infinity
  for (let i = 0; i < pal.length; i++) {
    const dr = r - pal[i][0]
    const dg = g - pal[i][1]
    const db = b - pal[i][2]
    const d = dr * dr + dg * dg + db * db
    if (d < bestD) { bestD = d; best = i }
  }
  return best
}

/* ══════════════════════════════════════════════
   Component
   ══════════════════════════════════════════════ */

export default function Demo0002() {
  const [gridSize, setGridSize] = useState(DEFAULT_GRID)
  const [colorCount, setColorCount] = useState(DEFAULT_COLORS)
  const [pixelData, setPixelData] = useState<PixelData | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [originalUrl, setOriginalUrl] = useState<string | null>(null)
  const [aspectRatio, setAspectRatio] = useState(16 / 9)
  const [jsonCopied, setJsonCopied] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<Phaser.Game | null>(null)
  const sceneRef = useRef<PixelArtScene | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  /* Mount Phaser once */
  useLayoutEffect(() => {
    if (!containerRef.current) return
    const el = containerRef.current

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: el,
      width: el.offsetWidth || 800,
      height: el.offsetHeight || 500,
      backgroundColor: '#111111',
      scene: [PixelArtScene],
      scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
      render: { antialias: false, pixelArt: true },
      fps: { target: 30, limit: 30 },
      audio: { noAudio: true },
      banner: false,
    })
    gameRef.current = game

    // Get scene ref once it's ready
    game.events.once('ready', () => {
      sceneRef.current = game.scene.getScene('PixelArtScene') as unknown as PixelArtScene
    })

    return () => {
      gameRef.current = null
      sceneRef.current = null
      game.destroy(true)
    }
  }, [])

  /* Push pixel data to scene whenever it changes */
  useEffect(() => {
    if (!pixelData || !sceneRef.current) return
    sceneRef.current.events.emit('pixel-data', pixelData)
  }, [pixelData])

  /* Handle image upload */
  const handleFile = useCallback(
    (file: File) => {
      // Keep a preview URL for the original image
      if (originalUrl) URL.revokeObjectURL(originalUrl)
      const previewUrl = URL.createObjectURL(file)
      setOriginalUrl(previewUrl)

      const img = new Image()
      img.onload = () => {
        setAspectRatio(img.naturalWidth / img.naturalHeight)
        const data = pixelate(img, gridSize, colorCount)
        setPixelData(data)
        setFileName(file.name)

        // Push to scene
        if (sceneRef.current) {
          sceneRef.current.events.emit('pixel-data', data)
        }
      }
      img.src = previewUrl
    },
    [gridSize, colorCount, originalUrl],
  )

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0]
      if (f) handleFile(f)
    },
    [handleFile],
  )

  /* Re-pixelate when settings change (if there's already a file) */
  const reprocess = useCallback(() => {
    if (!fileRef.current?.files?.[0]) return
    handleFile(fileRef.current.files[0])
  }, [handleFile])

  /* Copy JSON */
  const copyJson = useCallback(() => {
    if (!pixelData) return
    navigator.clipboard.writeText(JSON.stringify(pixelData, null, 2))
    setJsonCopied(true)
    setTimeout(() => setJsonCopied(false), 2000)
  }, [pixelData])

  /* Download JSON */
  const downloadJson = useCallback(() => {
    if (!pixelData) return
    const blob = new Blob([JSON.stringify(pixelData, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = (fileName?.replace(/\.[^.]+$/, '') ?? 'pixel') + '.json'
    a.click()
    URL.revokeObjectURL(a.href)
  }, [pixelData, fileName])

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
            Demo 0002
          </span>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex-1 flex flex-col max-w-6xl mx-auto w-full px-5 sm:px-10 py-8 sm:py-12 gap-6">
        {/* Title */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white/85 mb-1">
            像素轉化器
          </h1>
          <p className="text-sm text-white/35">
            上傳圖片 → 前端即時像素化 → Phaser 渲染像素方塊 → 匯出 JSON
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-end gap-4">
          {/* Upload */}
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-white/30 uppercase tracking-wider">上傳圖片</span>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={onFileChange}
              className="text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border file:border-white/10 file:bg-white/5 file:text-white/70 file:text-sm file:font-medium file:cursor-pointer hover:file:bg-white/10 transition-colors bg-transparent text-white/40"
            />
          </label>

          {/* Grid size */}
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-white/30 uppercase tracking-wider">解析度</span>
            <select
              value={gridSize}
              onChange={(e) => { setGridSize(Number(e.target.value)); }}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 focus:outline-none focus:border-emerald-500/40 cursor-pointer"
            >
              {GRID_OPTIONS.map((v) => (
                <option key={v} value={v} className="bg-[#0e0e1a]">
                  {v} × {v}
                </option>
              ))}
            </select>
          </label>

          {/* Colour count */}
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-white/30 uppercase tracking-wider">色數</span>
            <select
              value={colorCount}
              onChange={(e) => { setColorCount(Number(e.target.value)); }}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 focus:outline-none focus:border-emerald-500/40 cursor-pointer"
            >
              {COLOR_OPTIONS.map((v) => (
                <option key={v} value={v} className="bg-[#0e0e1a]">
                  {v} 色
                </option>
              ))}
            </select>
          </label>

          {/* Reprocess button */}
          <button
            onClick={reprocess}
            disabled={!fileName}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            重新轉換
          </button>
        </div>

        {/* ── Preview: Original + Pixel side by side ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Original image */}
          <div
            className="relative rounded-2xl overflow-hidden border border-white/[0.07] bg-[#111] flex items-center justify-center"
            style={{ aspectRatio: String(aspectRatio) }}
          >
            {originalUrl ? (
              <>
                <span className="absolute top-3 left-3 z-10 text-[10px] font-semibold uppercase tracking-widest text-white/30 bg-black/40 rounded px-2 py-0.5">原圖</span>
                <img src={originalUrl} alt="original" className="w-full h-full object-contain" />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center text-white/20 gap-3 pointer-events-none py-20">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="opacity-30">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                <span className="text-sm">上傳一張圖片開始轉換</span>
              </div>
            )}
          </div>

          {/* Pixel art (Phaser) */}
          <div
            className="relative rounded-2xl overflow-hidden border border-white/[0.07]"
            style={{ aspectRatio: String(aspectRatio) }}
          >
            {pixelData && (
              <span className="absolute top-3 left-3 z-10 text-[10px] font-semibold uppercase tracking-widest text-emerald-400/50 bg-black/40 rounded px-2 py-0.5">像素化</span>
            )}
            {!pixelData && !originalUrl && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-white/20 gap-3 pointer-events-none">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="opacity-30">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                <span className="text-sm">像素化結果</span>
              </div>
            )}
            <div ref={containerRef} className="w-full h-full" />
          </div>
        </div>

        {/* Stats + Actions */}
        {pixelData && (
          <div className="flex flex-wrap items-center gap-4">
            {/* Stats */}
            <div className="flex gap-6 text-sm text-white/40">
              <span>
                <span className="text-white/70 font-semibold">{pixelData.cols}×{pixelData.rows}</span> 格
              </span>
              <span>
                <span className="text-white/70 font-semibold">{pixelData.palette.length}</span> 色
              </span>
              <span>
                <span className="text-white/70 font-semibold">{(JSON.stringify(pixelData).length / 1024).toFixed(1)}</span> KB
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-2 ml-auto">
              <button
                onClick={copyJson}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-white/10 bg-white/5 text-white/60 hover:bg-white/10 transition-colors"
              >
                {jsonCopied ? '✓ 已複製' : '複製 JSON'}
              </button>
              <button
                onClick={downloadJson}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
              >
                下載 JSON
              </button>
            </div>
          </div>
        )}

        {/* Palette preview */}
        {pixelData && (
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
        )}

        {/* Code note */}
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 sm:p-5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-white/25 mb-3">
            實作重點
          </p>
          <ul className="flex flex-col gap-1.5">
            {[
              '前端 Canvas 2D 縮圖 + Median-Cut 量化演算法即時減色',
              '輸出 JSON 格式：{ cols, rows, palette[], pixels[][] }',
              'Phaser 場景接收 event 後以 fillRect 繪製像素方塊',
              '支援調整解析度（32-128）和色數（8-64）即時重新轉換',
              '可複製 / 下載 JSON，方便匯入其他 Phaser 場景使用',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-white/40">
                <span className="text-emerald-500/60 mt-0.5 flex-shrink-0">·</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
