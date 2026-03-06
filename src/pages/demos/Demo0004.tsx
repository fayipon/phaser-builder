import { Link } from 'react-router-dom'
import PhaserCanvas from '../../game/PhaserCanvas'
import { OceanDayScene } from '../../game/demos/demo-0004/OceanDayScene'

export default function Demo0004() {
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
            Demo 0004
          </span>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex-1 flex flex-col max-w-6xl mx-auto w-full px-5 sm:px-10 py-8 sm:py-12 gap-6">
        {/* Title */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white/85 mb-1">
            World Oceans Day Banner
          </h1>
          <p className="text-sm text-white/35">
            以 Phaser 3 Graphics API 繪製左文右圖的分割式 Banner — 鯨魚、魚群、珊瑚、泡泡全部程式生成
          </p>
        </div>

        {/* ── Banner ── */}
        <div className="relative rounded-2xl overflow-hidden border border-white/[0.07]"
          style={{ aspectRatio: '16/7' }}>
          <PhaserCanvas sceneClass={OceanDayScene} />
        </div>

        {/* Implementation notes */}
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 sm:p-5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-white/25 mb-3">
            實作重點
          </p>
          <ul className="flex flex-col gap-1.5">
            {[
              '左白右藍分割佈局 — 有機曲線邊框（organic wave divider）以 fillPoints 繪製',
              '海洋漸層：多段色帶從淺藍（#5dc8e8）至深海藍（#032a50）',
              '光線（light rays）— 半透明三角形 + sin 脈衝動畫模擬陽光折射',
              '鯨魚以橢圓 + 三角形幾何組合而成，含上下輕微搖擺',
              '魚群各自獨立速度 / 方向，左右循環游動',
              '泡泡持續向上升起，到頂後重置至海底',
              '珊瑚 / 岩石 — 三角樹枝狀幾何圖形構成海床',
              '標題字母以自訂像素字形（矩形組合）繪製，不依賴 Canvas text',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-white/40">
                <span className="text-sky-500/60 mt-0.5 flex-shrink-0">·</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
