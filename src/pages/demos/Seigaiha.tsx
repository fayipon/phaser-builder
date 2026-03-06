import { Link } from 'react-router-dom'
import PhaserCanvas from '../../game/PhaserCanvas'
import { ForestScene } from '../../game/demos/demo-0001/ForestScene'

export default function Seigaiha() {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#0a0a0a]">
      {/* Phaser scene — fills viewport */}
      <div className="absolute inset-0 z-0">
        <PhaserCanvas sceneClass={ForestScene} />
      </div>

      {/* Top bar */}
      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 sm:px-10 h-14">
        <Link
          to="/demo-0001"
          className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors text-sm"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          返回列表
        </Link>
        <span className="text-[11px] font-semibold uppercase tracking-widest text-white/25 border border-white/10 rounded-full px-2.5 py-0.5">
          03 / 03
        </span>
      </header>

      {/* Bottom overlay */}
      <div className="absolute inset-x-0 bottom-0 z-20 pointer-events-none">
        <div className="bg-gradient-to-t from-black/60 via-black/30 to-transparent px-6 sm:px-10 pb-8 pt-24">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest border rounded-full px-2.5 py-0.5 mb-3 bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
            Maki-e Canvas
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-[1.05] text-white whitespace-pre-line mb-2">
            {'金蒔繪\nGold Lacquer'}
          </h1>
          <p className="text-sm sm:text-base text-white/50 max-w-lg leading-relaxed">
            全畫面青海波（Seigaiha）— 金色同心弧鋪滿黑底，對角線方向 sin 波控制明暗波紋動畫。純 Phaser Graphics 即時運算。
          </p>
        </div>
      </div>
    </div>
  )
}
