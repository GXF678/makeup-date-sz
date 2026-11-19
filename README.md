# MAKEUP DATE · 網站原型說明

COM5501 Internet Communication — Final Project（Website Design 30%）
本地妝造服務預約平台原型，共 18 個獨立頁面，純 HTML / CSS / JavaScript，無需編譯、無外部依賴（字體走 Google Fonts CDN，離線時自動回退到系統字體）。

---

## 1. 如何打開

直接雙擊 `index.html` 即可瀏覽，所有頁面互相連結。

若要用本機伺服器（推薦，`file://` 下部分瀏覽器會限制 localStorage）：

```bash
cd makeup-date
python -m http.server 8765
# 瀏覽器打開 http://127.0.0.1:8765/
```

---

## 2. 品牌標誌 Logo

原創標誌「**山茶冠 / Camellia Crown**」：五片長短略異的花瓣從同一個中心向外張開，白色負形落在玫瑰色圓角塊上。花瓣的節奏對應「約會前的那個早晨」，留白則是妝台上那面鏡子裡的一小塊光。

- **圖形**：96×96 網格、圓角 18.8 的方形底；五片花瓣繞中心每 72° 一片，最長 36.8，長度依次 1.00 / 0.90 / 0.98 / 0.88 / 0.95，刻意保留一點手繪的不對稱；花瓣根部收束於同點，中心不留孔洞。
- **色彩**：玫瑰陶土 `#D390A4` 到深玫瑰 `#AC6380` 的 45° 漸層，花瓣用乳白 `#FFFDFB`；單色場景統一用 `#C77991`。
- **字標**：Playfair Display 襯線、全大寫、字距 0.16em；中文副標用 Noto Sans SC、字距 0.2em。
- **辨識度**：32px 以上花瓣層次清楚，16px 仍可讀作一朵花；橫式組合的最小淨空等於色塊邊長的 1/4。
- **避免**：不使用高飽和洋紅、純紅白配色與粗黑無襯線字標（該組合為同類零售商標誌的既有語彙），改以低飽和暖粉＋襯線字建立區隔。

| 檔案 | 用途 | 說明 |
|---|---|---|
| `assets/img/logo-mark.svg` | 主標記（含玫瑰底） | 向量母版，可直接換色 |
| `assets/img/logo-mark-mono.svg` | 反白標記 | 深色底、圖片浮水印用 |
| `assets/img/logo-mark-flat.svg` | 無底色版 | 只有花冠，用於淺色或其他底色 |
| `assets/img/favicon.svg` | 瀏覽器圖示 | 針對 16–32px 加大線寬 |
| `assets/img/app-icon-512.png` | 應用圖示／社交頭像 | 512×512 |
| `assets/img/apple-touch-icon.png` | iOS 主畫面圖示 | 180×180，滿版無圓角 |
| `assets/img/avatar-512.png` | 社交媒體頭像 | 512×512 |
| `assets/img/og-image.png` | 分享預覽卡 | 1200×630 |

標誌已應用於：桌面導覽列、手機抽屜選單、頁尾、`favicon`、`apple-touch-icon`、`og:image`（分享卡），以及關於我們頁的「品牌識別」展示區。

---

## 3. 目錄結構

```
makeup-date/
├── index.html            01 Home 首頁
├── artists.html          02 Find Artists 找妝娘
├── styles.html           03 Styles 風格分類
├── locations.html        04 Locations 地區推薦
├── artist.html           05 Artist Profile 妝娘詳情（artist.html?id=a1）
├── portfolio.html        06 Portfolio 作品集
├── services.html         07 Services & Pricing 服務價格
├── calendar.html         08 Availability 檔期日曆
├── booking.html          09 Booking 預約
├── confirmation.html     10 Confirmation 預約確認
├── my-bookings.html      11 My Bookings 我的預約
├── favorites.html        12 Favorites 收藏夾
├── community.html        13 Community 妝造社區
├── reviews.html          14 Reviews 用戶評價
├── guide.html            15 Beginner Guide 新手指南
├── join.html             16 Join Us 妝娘入駐
├── dashboard.html        17 Artist Dashboard 妝娘工作台
├── about.html            18 About Us 關於我們
└── assets/
    ├── css/style.css     全站設計系統（色彩、字體、元件、響應式）
    ├── js/data.js        示範資料（妝娘、風格、作品、評價、帖子）
    ├── js/app.js         互動邏輯（篩選、收藏、日曆、預約流程…）
    └── img/              27 張妝造圖片 + 7 個 logo/圖示檔案
```

設計規範：主色 `#C77991`、背景 `#F8E9EE` / `#F7F4F1`、文字 `#57474C`；
標題 Playfair Display（襯線），正文 Inter + Noto Sans SC（無襯線），全站僅兩種字體。

---

## 4. 圖片素材與替換方式

所有妝造圖片集中在 `assets/img/`，**檔名即用途**（logo 檔案見第 2 節），替換時保持同名同比例即可，不需改任何程式碼。

| 檔名 | 用在哪裡 | 建議尺寸 / 比例 |
|---|---|---|
| `hero.jpg` | 首頁 Hero 主視覺 | 1400×844，橫圖 4:3 |
| `style-korean.jpg` | 風格卡／地區頁／作品集（韓系） | 900×814，接近正方形 |
| `style-japanese.jpg` | 日系風格卡 | 900×814 |
| `style-hanfu.jpg` | 古風漢服風格卡 | 900×814 |
| `style-cosplay.jpg` | Cosplay 風格卡 | 900×814 |
| `style-thai.jpg` | 泰妝風格卡 | 900×814 |
| `style-daily.jpg` | 日常妝風格卡 | 900×814 |
| `artist-1.jpg` … `artist-9.jpg` | 妝娘頭像／妝娘卡／詳情頁主圖 | 800×1086，4:5 直圖 |
| `detail-eye.jpg` | 作品集眼妝特寫 | 900×814 |
| `detail-lip.jpg` | 作品集唇妝特寫 | 900×814 |
| `detail-hair.jpg` | 作品集髮型特寫 | 900×814 |
| `community.jpg` | 首頁口碑區／社區 | 1200×724 |
| `flatlay.jpg` | 關於我們 | 1200×724 |
| `favicon.svg` | 瀏覽器分頁圖示 | 向量，可直接改色 |

卡片圖片一律用 `object-fit: cover` 裁切，替換成 4:5（人像）或 1:1 的圖都不會破版。

> 目前圖片為 AI 生成之示意素材，僅供課程作業使用；若要換成真實作品，直接把同名檔案覆蓋即可。
> 圖片右下角的 AI 生成水印已在匯入時統一裁除。

---

## 5. 可以現場演示的互動

| 功能 | 位置 | 說明 |
|---|---|---|
| 條件搜尋 | 首頁搜尋卡 | 地區／風格／預算／服務方式 → 跳轉找妝娘並帶入篩選 |
| 多條件篩選＋排序 | `artists.html` | 風格、地區、預算三組 chip，價格／評價排序，即時結果數 |
| 收藏 | 任意妝娘卡右上愛心 | 寫入 localStorage，導覽列愛心顯示數量，`favorites.html` 同步 |
| 妝娘詳情 | `artist.html?id=a1` | 依網址參數載入不同妝娘；About／Portfolio／Pricing／Reviews 分頁 |
| 作品燈箱 | `portfolio.html`、妝娘作品頁 | 點圖放大，按 Esc 或點背景關閉 |
| 檔期日曆 | `calendar.html` | 月份切換、可約／已約／休息圖例、選日期→選時段→帶參數進預約 |
| 預約流程 | `booking.html` | 套餐與服務方式即時計算總額，送出後寫入 localStorage 並產生訂單編號 |
| 預約確認 | `confirmation.html` | 讀取剛送出的訂單，顯示 Pending 狀態，可列印 |
| 我的預約 | `my-bookings.html` | 顯示示範訂單＋你送出的訂單，可示範取消 |
| 社區點讚／彈窗 | `community.html` | 愛心計數寫入 localStorage，點卡片開全文彈窗 |
| 評價標籤篩選 | `reviews.html` | 依「妝感自然／準時／溝通清楚」等標籤過濾 |
| FAQ 手風琴 | `guide.html` | 一次只展開一題 |
| 入駐申請 | `join.html` | 送出後顯示感謝面板 |
| 響應式導覽 | 全站 | ≤1080px 收合為漢堡選單抽屜，抽屜內含全部 18 頁 |

---

## 6. 修改內容

- **改文案／價格／妝娘資料**：`assets/js/data.js`（`window.MD` 內的陣列）。靜態頁面上的卡片是產生時寫入的 HTML，若一次改動多筆，建議同步重新產生（見下）。
- **改樣式**：`assets/css/style.css` 開頭的 `:root` 變數（主色、圓角、字體、間距）即可全站換膚。
- **重新產生全部頁面**：`_build/` 內為產生器（`data.py` 為資料來源，`build_a/b/c.py` 產出 18 頁），執行
  `python _build/build_a.py && python _build/build_b.py && python _build/build_c.py`。
  交付時可整份刪除 `_build/`，網站仍可正常運作。

---

## 7. 聲明

本網站為 City University of Hong Kong COM5501 課程作業原型，所有妝娘、價格、評價與訂單均為示範資料，不提供真實服務、不涉及真實付款。圖片為 AI 生成示意圖，僅用於作業展示。
