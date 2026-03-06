import { Link } from 'react-router-dom'
import PhaserCanvas from '../../game/PhaserCanvas'
import { GreatWaveScene } from '../../game/demos/demo-0001/GreatWaveScene'

export default function GreatWave() {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#06111f]">
      {/* Phaser scene — fills viewport */}
      <div className="absolute inset-0 z-0">
        <PhaserCanvas sceneClass={GreatWaveScene} />
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
          01 / 03
        </span>
      </header>

      {/* Bottom overlay */}
      <div className="absolute inset-x-0 bottom-0 z-20 pointer-events-none">
        <div className="bg-gradient-to-t from-black/60 via-black/30 to-transparent px-6 sm:px-10 pb-8 pt-24">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest border rounded-full px-2.5 py-0.5 mb-3 bg-sky-500/20 text-sky-300 border-sky-500/30">
            Phaser 3 Canvas
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-[1.05] text-white whitespace-pre-line mb-2">
            {'神奈川沖浪裏\nThe Great Wave'}
          </h1>
          <p className="text-sm sm:text-base text-white/50 max-w-lg leading-relaxed">
            以 Phaser 3 Graphics API 逐幀繪製葛飾北齋名畫。海浪、富士山與船隻均以普魯士藍調色盤動態演算，非靜態圖片。
          </p>
        </div>
      </div>
    </div>
  )
}
