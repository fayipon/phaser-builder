import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import PhaserCanvas from '../../game/PhaserCanvas'
import { GreatWaveScene } from '../../game/demos/demo-0001/GreatWaveScene'
import { StarryNightScene } from '../../game/demos/demo-0001/StarryNightScene'
import { ForestScene } from '../../game/demos/demo-0001/ForestScene'

/* ── Banner data ── */
const BANNERS = [
  {
    id: 0,
    label: '01',
    eyebrow: 'Phaser 3 Canvas',
    title: '神奈川沖浪裏\nThe Great Wave',
    sub: '以 Phaser 3 Graphics API 逐幀繪製葛飾北齋名畫。海浪、富士山與船隻均以普魯士藍調色盤動態演算，非靜態圖片。',
    cta: '欣賞動態',
    accent: '#5b9ab8',
    from: '#06111f',
    to: '#0e2540',
    tag: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  },
  {
    id: 1,
    label: '02',
    eyebrow: 'Painterly Canvas',
    title: '星月夜\nThe Starry Night',
    sub: '以 Canvas 2D 繪製梵谷名畫的寫實詮釋。流動筆觸、漩渦光帶與星光暈染均由程序即時運算，非靜態圖片。',
    cta: '欣賞動態',
    accent: '#a855f7',
    from: '#0a0e2a',
    to: '#1e3068',
    tag: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  },
  {
    id: 2,
    label: '03',
    eyebrow: 'Maki-e Canvas',
    title: '金蒔繪\nGold Lacquer',
    sub: '以 Canvas 2D 再現日本蒔繪工藝 — 純黑底上繪製金色青海波、祥雲、滿月與梅花枝。金粉粒子與月暈呼吸動畫均由程式即時運算。',
    cta: '欣賞動態',
    accent: '#c8a850',
    from: '#0a0a0a',
    to: '#1a1508',
    tag: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  },
]

const INTERVAL = 4500

export default function Demo0001() {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)
  const [direction, setDirection] = useState<'left' | 'right'>('left')
  const [animating, setAnimating] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const goTo = useCallback(
    (index: number, dir: 'left' | 'right' = 'left') => {
      if (animating) return
      setDirection(dir)
      setAnimating(true)
      setTimeout(() => {
        setCurrent(index)
        setAnimating(false)
      }, 350)
    },
    [animating],
  )

  const prev = useCallback(() => {
    goTo((current - 1 + BANNERS.length) % BANNERS.length, 'right')
  }, [current, goTo])

  const next = useCallback(() => {
    goTo((current + 1) % BANNERS.length, 'left')
  }, [current, goTo])

  /* auto-play */
  useEffect(() => {
    if (paused) return
    timerRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % BANNERS.length)
    }, INTERVAL)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [paused, current])

  const banner = BANNERS[current]

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
              <path
                d="M10 12L6 8l4-4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            返回首頁
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-white/25 border border-white/10 rounded-full px-2.5 py-0.5">
              Demo 0001
            </span>
          </div>
        </div>
      </header>

      {/* ── Page body ── */}
      <div className="flex-1 flex flex-col max-w-6xl mx-auto w-full px-5 sm:px-10 py-8 sm:py-12 gap-8">
        {/* title */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white/85 mb-1">
            Banner 輪播
          </h1>
          <p className="text-sm text-white/35">
            純 React 實現的 3 張 banner 自動輪播 — useState / useEffect / useCallback
          </p>
        </div>

        {/* ── Carousel ── */}
        <div
          className="relative rounded-2xl overflow-hidden flex-1 min-h-[320px] sm:min-h-[420px] select-none"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          style={{
            background: current === 0
              ? '#06111f'
              : current === 1
                ? '#0a0e2a'
                : current === 2
                  ? '#0a0a0a'
                  : `linear-gradient(135deg, ${banner.from} 0%, ${banner.to} 100%)`,

            transition: 'background 0.5s ease',
          }}
        >
          {/* Phaser canvases — always mounted, toggled by opacity */}
          <div
            className="absolute inset-0 z-0 transition-opacity duration-500"
            style={{ opacity: current === 0 ? 1 : 0, pointerEvents: 'none' }}
          >
            <PhaserCanvas sceneClass={GreatWaveScene} />
          </div>
          <div
            className="absolute inset-0 z-0 transition-opacity duration-500"
            style={{ opacity: current === 1 ? 1 : 0, pointerEvents: 'none' }}
          >
            <PhaserCanvas sceneClass={StarryNightScene} />
          </div>
          <div
            className="absolute inset-0 z-0 transition-opacity duration-500"
            style={{ opacity: current === 2 ? 1 : 0, pointerEvents: 'none' }}
          >
            <PhaserCanvas sceneClass={ForestScene} />
          </div>

          {/* Decorative circles — hidden when Phaser handles bg */}
          {current !== 0 && current !== 1 && current !== 2 && (
            <>
              <div
                className="absolute -right-24 -top-24 w-72 sm:w-96 h-72 sm:h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
                style={{ backgroundColor: banner.accent, transition: 'background-color 0.5s ease' }}
              />
              <div
                className="absolute -left-16 -bottom-16 w-48 h-48 rounded-full opacity-10 blur-2xl pointer-events-none"
                style={{ backgroundColor: banner.accent, transition: 'background-color 0.5s ease' }}
              />
            </>
          )}

          {/* Content */}
          <div
            className="relative z-10 flex flex-col justify-between h-full min-h-[320px] sm:min-h-[420px] p-6 sm:p-10"
            style={{
              opacity: animating ? 0 : 1,
              transform: animating
                ? `translateX(${direction === 'left' ? '-24px' : '24px'})`
                : 'translateX(0)',
              transition: 'opacity 0.3s ease, transform 0.3s ease',
            }}
          >
            {/* top */}
            <div className="flex items-start justify-between">
              <span
                className={`inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest border rounded-full px-2.5 py-0.5 ${banner.tag}`}
              >
                {banner.eyebrow}
              </span>
              <span className="text-[11px] font-mono text-white/20">{banner.label} / 0{BANNERS.length}</span>
            </div>

            {/* center */}
            <div className="flex flex-col gap-4">
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-[1.05] whitespace-pre-line">
                {banner.title}
              </h2>
              <p className="text-sm sm:text-base text-white/50 max-w-md leading-relaxed">
                {banner.sub}
              </p>
              <button
                className="self-start mt-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150"
                style={{
                  backgroundColor: `${banner.accent}22`,
                  border: `1px solid ${banner.accent}44`,
                  color: banner.accent,
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    `${banner.accent}33`
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    `${banner.accent}22`
                }}
              >
                {banner.cta}
              </button>
            </div>

            {/* bottom controls */}
            <div className="flex items-center justify-between">
              {/* dots */}
              <div className="flex items-center gap-2">
                {BANNERS.map((b, i) => (
                  <button
                    key={b.id}
                    onClick={() => goTo(i, i > current ? 'left' : 'right')}
                    className="rounded-full transition-all duration-300 focus:outline-none"
                    style={{
                      width: i === current ? '24px' : '6px',
                      height: '6px',
                      backgroundColor:
                        i === current ? banner.accent : 'rgba(255,255,255,0.25)',
                    }}
                    aria-label={`前往第 ${i + 1} 張`}
                  />
                ))}
              </div>

              {/* prev / next */}
              <div className="flex items-center gap-2">
                <button
                  onClick={prev}
                  className="w-9 h-9 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                  aria-label="上一張"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M8.5 11L4.5 7l4-4"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <button
                  onClick={next}
                  className="w-9 h-9 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                  aria-label="下一張"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M5.5 11L9.5 7l-4-4"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          {!paused && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/5">
              <div
                key={`${current}-${paused}`}
                className="h-full"
                style={{
                  backgroundColor: banner.accent,
                  animation: `progress ${INTERVAL}ms linear`,
                }}
              />
            </div>
          )}
        </div>

        {/* ── Code note ── */}
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 sm:p-5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-white/25 mb-3">
            實作重點
          </p>
          <ul className="flex flex-col gap-1.5">
            {[
              '以 useState 追蹤當前 index 與暫停狀態',
              '以 useEffect + setInterval 自動輪播，hover 暫停',
              '以 useCallback 穩定 goTo / prev / next 參考，避免閉包過期',
              'CSS transition 實現滑入方向感（direction state）',
              '底部進度條使用 CSS @keyframes 動畫，key 強制重置',
              'Banner 1 背景：Phaser 3 Graphics 逐幀繪製神奈川沖浪裏，含貝茲曲線波浪、富士山、浪花手指動畫',
              'Banner 2 背景：Canvas 2D 繪製星夜 — 9 條水平波帶＋8000 短筆觸、漩渦雲（弧線疊加非幾何螺旋）、11 顆光暈星、絲柏、村莊教堂',
              'Banner 3 背景：全畫面青海波（Seigaiha）— 金色同心弧鋪滿黑底，對角線方向 sin 波控制明暗波紋動畫',
              'PhaserCanvas 以 useLayoutEffect 掛載，always-mounted 避免重複建立 WebGL context',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-white/40">
                <span className="text-indigo-500/60 mt-0.5 flex-shrink-0">·</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* progress keyframe */}
      <style>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  )
}
