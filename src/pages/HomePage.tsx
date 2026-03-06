/* ─────────────────────────────────────────────
   HomePage — React + Phaser showcase landing
───────────────────────────────────────────── */
import { Link } from 'react-router-dom'

const DEMOS: DemoCardProps[] = [
  {
    title: 'Banner 輪播',
    description: '純 React 實現的 3 張 banner 自動輪播，涵蓋 useState、useEffect、useCallback。',
    href: '/demo-0001',
    tag: 'React',
  },
  {
    title: '像素轉化器',
    description: '上傳圖片即時像素化 — 前端 Median-Cut 減色演算法 + Phaser 渲染像素方塊，可匯出 JSON。',
    href: '/demo-0002',
    tag: 'Phaser',
  },
  {
    title: 'JSON Banner 背景',
    description: '匯入像素 JSON 資料，Phaser 渲染為動態 Banner 背景，含 shimmer 動畫與覆蓋文字。',
    href: '/demo-0003',
    tag: 'Phaser',
  },
  {
    title: 'Ocean Day Banner',
    description: '左文右圖分割式海洋節 Banner — 鯨魚、魚群、珊瑚、泡泡全部以 Phaser Graphics API 程式生成。',
    href: '/demo-0004',
    tag: 'Phaser',
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#070710] text-white">
      {/* ── Background ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* top-center glow */}
        <div
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[500px] opacity-30"
          style={{
            background:
              'radial-gradient(ellipse at center, #4f46e5 0%, transparent 70%)',
          }}
        />
        {/* bottom-right accent */}
        <div
          className="absolute -bottom-32 -right-32 w-[500px] h-[500px] opacity-20"
          style={{
            background:
              'radial-gradient(ellipse at center, #7c3aed 0%, transparent 65%)',
          }}
        />
        {/* dot grid */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      {/* ── Nav ── */}
      <header className="relative z-20 border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-5 sm:px-10 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-400 to-violet-600 flex-shrink-0" />
            <span className="text-sm font-bold tracking-tight text-white/80">
              Phaser Builder
            </span>
          </div>
          <nav className="flex items-center gap-6">
            <a
              href="https://phaser.io"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-white/35 hover:text-white/70 transition-colors duration-150"
            >
              Phaser 3
            </a>
            <a
              href="https://github.com/fayipon/phaser-builder"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-white/35 hover:text-white/70 transition-colors duration-150"
            >
              GitHub
            </a>
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative z-10">
        <div className="max-w-6xl mx-auto px-5 sm:px-10 pt-20 sm:pt-28 lg:pt-36 pb-16 sm:pb-20">
          {/* badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/25 bg-indigo-500/8 px-3.5 py-1 mb-7 sm:mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-[11px] font-semibold tracking-widest uppercase text-indigo-300/80">
              互動遊戲展示平台
            </span>
          </div>

          {/* headline */}
          <h1 className="text-[clamp(2.6rem,7vw,5.5rem)] font-black tracking-[-0.03em] leading-[1.02] mb-6 sm:mb-7 max-w-3xl">
            Build &amp; showcase
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  'linear-gradient(90deg, #818cf8 0%, #c084fc 50%, #a78bfa 100%)',
              }}
            >
              Phaser demos
            </span>
          </h1>

          {/* sub */}
          <p className="text-white/45 text-base sm:text-lg leading-relaxed max-w-xl mb-10 sm:mb-12">
            以 React + Phaser 3 打造的互動遊戲場景展示站。
            每個 demo 直接在瀏覽器中即時體驗，無需安裝。
          </p>

          {/* stats row */}
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            {[
              { label: 'Demos', value: String(DEMOS.filter((d) => !d.disabled).length) },
              { label: 'Phaser', value: '3.90' },
              { label: 'React', value: '19' },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col">
                <span className="text-2xl font-bold text-white/90 leading-none">
                  {value}
                </span>
                <span className="text-[11px] text-white/30 mt-1 uppercase tracking-widest">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Divider ── */}
      <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-10">
        <div className="border-t border-white/[0.06]" />
      </div>

      {/* ── Demos Grid ── */}
      <section className="relative z-10 max-w-6xl mx-auto px-5 sm:px-10 pt-10 sm:pt-14 pb-20 sm:pb-28">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <h2 className="text-sm font-semibold text-white/40 uppercase tracking-widest">
            All Demos
          </h2>
          <span className="text-xs text-white/20 tabular-nums">
            {DEMOS.filter((d) => !d.disabled).length} / {DEMOS.length}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {DEMOS.map((demo) => (
            <DemoCard key={demo.title} {...demo} />
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-5 sm:px-10 h-12 flex items-center">
          <span className="text-[11px] text-white/20">
            Built with React + Phaser 3
          </span>
        </div>
      </footer>
    </div>
  )
}

/* ── DemoCard ── */

interface DemoCardProps {
  title: string
  description: string
  href: string
  tag?: string
  disabled?: boolean
}

function DemoCard({ title, description, href, tag, disabled }: DemoCardProps) {
  const cls = [
    'group relative flex flex-col gap-3 rounded-xl border p-5 sm:p-6 transition-all duration-200',
    disabled
      ? 'border-white/5 bg-white/[0.02] cursor-not-allowed'
      : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-indigo-500/40 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/5 cursor-pointer',
  ].join(' ')

  const inner = (
    <>
      {/* top row */}
      <div className="flex items-start justify-between gap-3">
        <div
          className={[
            'w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center text-lg',
            disabled ? 'bg-white/5' : 'bg-indigo-500/15',
          ].join(' ')}
        >
          {disabled ? (
            <span className="text-white/15 text-base">⏳</span>
          ) : (
            <span className="text-base">🎮</span>
          )}
        </div>
        {tag && (
          <span className="text-[10px] font-semibold uppercase tracking-widest text-indigo-400/70 border border-indigo-500/20 rounded-full px-2 py-0.5">
            {tag}
          </span>
        )}
        {disabled && (
          <span className="text-[10px] font-medium uppercase tracking-wider text-white/20 border border-white/8 rounded-full px-2 py-0.5 ml-auto">
            Soon
          </span>
        )}
      </div>
      {/* content */}
      <div className="flex flex-col gap-1.5 flex-1">
        <h3 className={`text-[15px] font-semibold leading-snug ${
          disabled ? 'text-white/25' : 'text-white/85'
        }`}>
          {title}
        </h3>
        <p className={`text-sm leading-relaxed ${
          disabled ? 'text-white/18' : 'text-white/40'
        }`}>
          {description}
        </p>
      </div>
      {/* footer */}
      {!disabled && (
        <div className="flex items-center gap-1 text-xs font-medium text-indigo-400/70 group-hover:text-indigo-300 transition-colors">
          開始體驗
          <span className="transition-transform group-hover:translate-x-0.5">→</span>
        </div>
      )}
    </>
  )

  if (disabled) return <div className={cls}>{inner}</div>
  return <Link to={href} className={cls}>{inner}</Link>
}
