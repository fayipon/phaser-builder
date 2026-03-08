# Phaser Builder — 互動遊戲展示平台

基於 **React 18 + Phaser 3 + TypeScript** 的互動遊戲展示平台，包含 Banner 輪播展示與可視化 Banner 編輯器（Banner Studio）。

## 技術棧

| 技術 | 版本 | 用途 |
|------|------|------|
| React | 18.3 | UI / 路由 / 狀態管理 |
| Phaser | 3.87 | 遊戲畫布渲染 / 動畫引擎 |
| TypeScript | 5.6 | 類型安全 |
| Vite | 6.x | 開發伺服器 / 生產打包 |
| Zustand | 5.x | Studio 編輯器狀態管理 |
| React Router | 6.28 | SPA 路由 |

## 快速開始

```bash
# 安裝依賴
npm install

# 啟動開發伺服器 (HMR)
npm run dev

# 生產建置
npm run build

# 預覽生產版本
npm run preview
```

## 專案結構

```
src/
├── routesMeta.ts          # 路由元資料 (新增頁面只需編輯此檔)
├── routes.tsx             # 路由 → 懶載入頁面映射
├── App.tsx                # BrowserRouter + Routes
├── main.tsx               # React createRoot 入口
│
├── bridge/
│   └── EventBus.ts        # React ↔ Phaser 雙向事件匯流排
│
├── game/
│   ├── config.ts          # Phaser.Game 基礎設定
│   ├── assets.ts          # 資源 key 常數
│   └── scenes/
│       └── BannerScene.ts # Banner 輪播場景 (3 張自訂幻燈片)
│
├── ui/
│   ├── layout/            # Layout.tsx + NavBar.tsx (共用外殼)
│   ├── pages/             # 各路由頁面
│   │   ├── HomePage.tsx
│   │   ├── BannerDemoPage.tsx
│   │   ├── BannerPage.tsx
│   │   └── NotFoundPage.tsx
│   └── components/        # 共用元件 (DemoCard 等)
│
├── data/
│   └── bannerSlides.ts    # Banner 幻燈片共用資料
│
└── studio/                # ★ Banner AI Studio
    ├── dsl/
    │   └── types.ts       # BannerDSL JSON schema 定義
    ├── store/
    │   └── editorStore.ts # Zustand 編輯器狀態 (物件/時間軸/選取)
    ├── engine/
    │   ├── EditorScene.ts # Phaser 編輯場景 (拖曳/選取/即時同步)
    │   └── particles.ts   # 粒子效果預設組態
    ├── ui/
    │   ├── StudioPage.tsx # 編輯器主頁面佈局
    │   ├── toolbar/       # 工具列 (尺寸/播放/匯出/匯入/重置)
    │   ├── assets/        # 資源面板 (快速新增 + 圖層列表)
    │   ├── canvas/        # Phaser 畫布容器
    │   ├── properties/    # 屬性面板 (位置/縮放/旋轉/文字/顏色)
    │   └── timeline/      # 時間軸面板 (新增/移除動畫)
    ├── templates/
    │   ├── index.ts       # applyTemplate() 佔位符引擎
    │   └── presets.ts     # 3 個內建模板 (slot_jackpot / free_spin / big_win)
    ├── ai/
    │   └── generator.ts   # AI 橫幅產生器 (模板匹配 + 佔位符填充)
    ├── runtime/
    │   └── BannerPlayer.ts # 輕量 Phaser 播放器 (載入 JSON 即渲染)
    └── examples/
        ├── slot_jackpot.json   # 老虎機 Jackpot (728×90)
        ├── promo_banner.json   # Free Spin 促銷 (300×250)
        └── bigwin_banner.json  # Big Win 慶祝 (1080×1080)
```

## 頁面路由

| 路徑 | 頁面 | 說明 |
|------|------|------|
| `/` | Home | 首頁，展示所有 Demo 卡片 |
| `/banner-demo` | Banner Demo | Banner 選擇頁面（3 張可選） |
| `/banner-demo/:slug` | Banner Page | 單一 Banner 獨立展示 |
| `/studio` | Banner Studio | 可視化 Banner 編輯器 |

## Banner Studio 使用說明

### 介面區域

```
┌─────────────────── Toolbar ───────────────────┐
│  尺寸選擇  │  ▶ Play  ■ Stop  │  Export  Import  Reset  │
├──────────┬────────────────────┬────────────┤
│  Assets  │                    │ Properties │
│  面板    │      Canvas        │   面板     │
│  (左側)  │    (Phaser 畫布)   │   (右側)   │
├──────────┴────────────────────┴────────────┤
│              Timeline 時間軸                │
└─────────────────────────────────────────────┘
```

### 操作流程

#### 1. 新增物件
左側 Assets 面板 → 點擊快速新增按鈕：

| 按鈕 | 類型 | 說明 |
|------|------|------|
| **T** | Text | 文字物件 |
| **🖼** | Image | 圖片佔位 |
| **🎞** | Sprite | 精靈動畫佔位 |
| **🪙** | Coin Rain | 金幣雨粒子 |
| **✨** | Sparkles | 閃光粒子 |
| **🎊** | Confetti | 彩紙粒子 |
| **💥** | Jackpot | 爆炸粒子 |

#### 2. 編輯屬性
點擊畫布上的物件 → 右側面板即時編輯：
- **位置** — X / Y
- **變換** — Scale / Rotation / Alpha / Depth
- **文字專屬** — 內容、字體大小、顏色
- **圖片專屬** — 資源檔名

#### 3. 新增動畫
底部 Timeline → 選擇目標物件 → 選擇屬性（x / y / scale / rotation / alpha）→ 填入目標值與時長 → 按「+ Add」

#### 4. 預覽
工具列按 **▶ Play** 播放所有時間軸動畫，按 **■ Stop** 停止並還原。

#### 5. 匯出 / 匯入
- **Export** — 下載 `banner.json`（符合 BannerDSL 格式）
- **Import** — 載入任意 `.json` 檔案到編輯器

### 匯入內建範例

專案包含 3 個可直接匯入的範例：

```
src/studio/examples/
├── slot_jackpot.json   → 老虎機 Jackpot 橫幅 (728×90) + 金幣雨
├── promo_banner.json   → Free Spin 促銷 (300×250) + 閃光粒子
└── bigwin_banner.json  → Big Win 慶祝 (1080×1080) + 彩紙
```

在 Studio 頁面按 **Import** → 選擇上述任一 JSON → 自動載入。

## 程式碼使用範例

### AI Banner 產生器

```typescript
import { generateBanner } from '@/studio/ai'

const dsl = generateBanner({
  game_name: 'Fortune Tiger',
  jackpot_amount: '$88,888',
  promotion_text: '50 FREE SPINS',
  cta_text: 'PLAY NOW →',
  banner_size: '300x250',   // 728x90 | 300x250 | 160x600 | 1080x1080 | 1920x1080
})
```

### Runtime Player（嵌入任意頁面）

```typescript
import { createBannerPlayer } from '@/studio/runtime'
import dsl from '@/studio/examples/slot_jackpot.json'

const container = document.getElementById('banner-mount')!
const { destroy } = createBannerPlayer(container, dsl)

// 元件卸載時清理
destroy()
```

### 模板系統

```typescript
import { applyTemplate } from '@/studio/templates'
import { slotJackpot } from '@/studio/templates/presets'

const dsl = applyTemplate(slotJackpot, {
  game_name: 'Sweet Bonanza',
  jackpot_amount: '$100,000',
  cta_text: 'SPIN NOW',
})
```

## BannerDSL 格式

所有 Banner 以統一的 JSON 格式描述：

```jsonc
{
  "size": { "width": 728, "height": 90 },
  "assets": [],
  "objects": [
    {
      "id": "title",
      "type": "text",           // text | image | sprite | particle | container
      "x": 200, "y": 26,
      "text": "🎰 JACKPOT",
      "style": { "fontSize": 22, "color": "#FFD700", "fontStyle": "bold" },
      "depth": 2
    }
  ],
  "timeline": [
    {
      "target": "title",        // 對應 objects[].id
      "type": "scale",          // x | y | scale | scaleX | scaleY | rotation | alpha
      "value": 1.1,
      "duration": 600,
      "ease": "Sine.easeInOut",
      "repeat": -1,             // -1 = 無限循環
      "yoyo": true
    }
  ]
}
```

## 新增頁面（3 步驟）

1. 建立 `src/ui/pages/MyPage.tsx`
2. 在 `src/routesMeta.ts` 加一筆 → 自動顯示在 NavBar + 首頁卡片
3. 在 `src/routes.tsx` 的 `elementMap` 加對應的懶載入元件

## 開發規範

- TypeScript strict mode（`"strict": true`）
- Phaser 檔案：class-based（`class FooScene extends Phaser.Scene`）
- React 檔案：functional components + hooks only
- 檔案命名：`PascalCase`（類別/元件），`camelCase`（工具函式）
- React 元件不得直接 import `game/` 下的模組（僅透過 `bridge/EventBus`）
- 資源 key 統一定義在 `game/assets.ts`，場景代碼禁止使用原始字串

## License

Private project.
