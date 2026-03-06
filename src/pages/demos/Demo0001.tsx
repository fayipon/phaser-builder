import { Link } from 'react-router-dom'

/* ── Banner data ── */
const BANNERS = [
  {
    id: 0,
    label: '01',
    eyebrow: 'Phaser 3 Canvas',
    title: '神奈川沖浪裏',
    titleEn: 'The Great Wave',
    sub: '以 Phaser 3 Graphics API 逐幀繪製葛飾北齋名畫。海浪、富士山與船隻均以普魯士藍調色盤動態演算。',
    accent: '#5b9ab8',
    bg: '#06111f',
    tag: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    href: '/demo-0001/great-wave',
  },
  {
    id: 1,
    label: '02',
    eyebrow: 'Painterly Canvas',
    title: '星月夜',
    titleEn: 'The Starry Night',
    sub: '以 Canvas 2D 繪製梵谷名畫 — 流動筆觸、漩渦光帶與星光暈染均由程序即時運算。',
    accent: '#a855f7',
    bg: '#0a0e2a',
    tag: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    href: '/demo-0001/starry-night',
  },
  {
    id: 2,
    label: '03',
    eyebrow: 'Maki-e Canvas',
    title: '金蒔繪',
    titleEn: 'Gold Lacquer',
    sub: '全畫面青海波 — 金色同心弧鋪滿黑底，對角線方向 sin 波控制明暗波紋動畫。',
    accent: '#c8a850',
    bg: '#0a0a0a',
    tag: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    href: '/demo-0001/seigaiha',
  },
]

export default function Demo0001() {
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
            Phaser Canvas Banners
          </h1>
          <p className="text-sm text-white/35">
            3 張以 Phaser 3 + Canvas 2D 即時繪製的名畫場景
          </p>
        </div>

        {/* ── Banner cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {BANNERS.map((b) => (
            <Link
              key={b.id}
              to={b.href}
              className="group relative flex flex-col gap-4 rounded-2xl border border-white/10 overflow-hidden transition-all duration-200 hover:border-white/20 hover:-translate-y-0.5 hover:shadow-xl"
              style={{ backgroundColor: b.bg }}
            >
              {/* Colour accent glow */}
              <div
                className="absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-15 blur-3xl pointer-events-none transition-opacity group-hover:opacity-25"
                style={{ backgroundColor: b.accent }}
              />

              <div className="relative z-10 flex flex-col gap-3 p-5 sm:p-6 flex-1">
                {/* tag */}
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center text-[10px] font-semibold uppercase tracking-widest border rounded-full px-2 py-0.5 ${b.tag}`}
                  >
                    {b.eyebrow}
                  </span>
                  <span className="text-[11px] font-mono text-white/20">{b.label}</span>
                </div>

                {/* title */}
                <div>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight text-white/90">
                    {b.title}
                  </h2>
                  <p className="text-sm text-white/30 mt-0.5">{b.titleEn}</p>
                </div>

                {/* description */}
                <p className="text-xs sm:text-sm text-white/40 leading-relaxed flex-1">
                  {b.sub}
                </p>

                {/* CTA */}
                <div className="flex items-center gap-1 text-xs font-medium transition-colors" style={{ color: b.accent }}>
                  進入體驗
                  <span className="transition-transform group-hover:translate-x-0.5">→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* ── Code note ── */}
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 sm:p-5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-white/25 mb-3">
            實作重點
          </p>
          <ul className="flex flex-col gap-1.5">
            {[
              'Banner 1：Phaser 3 Graphics 逐幀繪製神奈川沖浪裏 — 貝茲曲線波浪、富士山、浪花、船隻',
              'Banner 2：Canvas 2D 繪製星夜 — 9 條水平波帶＋短筆觸、漩渦雲、光暈星、絲柏、村莊',
              'Banner 3：全畫面青海波 — 金色同心弧靜態貼圖＋格子明暗波紋動畫覆蓋層',
              'PhaserCanvas 以 useLayoutEffect 掛載，active prop 控制 game.loop.sleep/wake',
              'fps 限制 30（fps: { target: 30, limit: 30 }）降低手機發熱',
              '每個場景獨立 route，進入時才啟動 Phaser Game',
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
