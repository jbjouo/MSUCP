# MSUCP — Claude Code 專案指引

本檔案讓 Claude 在任何新 clone 的機器上能快速接續開發。不含會變動太快的 TODO,著重「資料模型」與「不變的慣例」。

## 專案總覽

**MapleStory Universe (MSU)** 輔助工具:角色管理 / 裝備管理 / (規劃中) 戰鬥力計算 / 聯盟戰地。

- Stack: **Vue 3 (Composition API, `<script setup>`) + Vite + vue-router + vue-i18n**
- 部署形式: Vite SPA,`createWebHistory` (無 `#`)
- 資料持久化: **瀏覽器 localStorage**,並呼叫 `navigator.storage.persist()` 要求長期儲存

啟動:`npm install && npm run dev`;驗證:`npx vite build`。

## 路由

| path | page | 說明 |
|---|---|---|
| `/character` | `CharacterPage.vue` | 角色資料 (等級/職業/伺服器/備註) |
| `/equipment` | `EquipmentPage.vue` | 裝備 + 背包 (主戰場) |
| `/cp` | `CpCalculatorPage.vue` | 戰鬥力計算 (建置中) |
| `/legion` | `LegionPage.vue` | 聯盟戰地 (建置中) |

`/` 重導到 `/character`。

## 核心資料模型

### 1. `items.json` — 裝備「模板」(`src/data/items.json`)
僅存**基礎數值**,不含使用者強化狀態。

```json
{
  "id": "唯一 ID",
  "name": "名稱",
  "nameEn": "英文名稱 (可選)",
  "type": "weapon | hat | top | bottom | shoes | glove | cape | shoulder | belt | pocket | ring | pendant | earring | eye | face | emblem | badge | medal | secondary | overall | android | heart",
  "subType": "sword | wand | bow | dagger | totem | ...",
  "level": "REQ LEV",
  "req": { "str?": 0, "dex?": 0, "int?": 0, "luk?": 0 },
  "classes": ["warrior" | "magician" | "bowman" | "thief" | "pirate"],
  "maxStars": 25,
  "attackSpeed": 4,
  "stats": { "atk?": 119, "matk?": 201, "str?": 40, "...": "..." },
  "imageUrl": "https://..."
}
```

- **沒有** `rarity` 欄位 (稀有度概念已整個移除)
- `stats` key 支援:`str / dex / int / luk / atk / matk / hp / mp / def`,及百分比類 `bossDmg / ignoreDef / allStatPct / atkPct / matkPct / strPct / ...`。% 類由 tooltip 的 `PCT_KEYS` 判定顯示

### 2. Entry (使用者實例,`useEquipment.js`)
每件使用者擁有的裝備都是一個 entry,有獨立 uid,與 template 分離。

```js
state.entries[uid] = {
  itemId,                 // 對應 items.json id
  stars,                  // 星數 (0..min(item.maxStars, 23))
  bonusStats?,            // { str, dex, int, luk, atk, matk, bossDmg, dmgPct, allStatPct }
  potential?,             // { tier: 'rare|epic|unique|legendary', lines: [l1, l2, l3] (label 字串 or null) }
  bonusPotential?,        // 同 potential 結構
}
state.inventory = [uid, ...]                      // 在背包中的 entry
state.equipped  = { [slotKey]: uid | null }       // 裝備在各槽位的 entry
```

- `resolveEntry(uid)` → `{ uid, stars, item, starStats, bonusStats, potential, bonusPotential }`
- 儲存 key:`msucp.equipment.v3` (v1/v2 會在首次載入時清掉,換語意不相容)
- 任何 setter 皆會 `persist()`

### 3. 裝備槽 (`src/constants/equipmentSlots.js`)
5 欄 × 6 列,仿 MS N 遊戲內排列。23 個槽位;**無 android / heart / medal** (使用者指示)。每個 slot 有 `accepts: ['ring' | 'weapon' | 'top' | 'overall' | ...]`。

## 強化規則

### 星力 (`src/constants/starForce.js`)
資料驅動、分 **部位** × **等級級距**。

- 目前僅實作 **Lv150** (包含以上)、**weapon / glove / other**
- 武器前 15 星:**逐星以「當下攻擊力」查表** (每 50 ATT 區間 +1 ATT/星),ATT 與 MATK 獨立計算
- 1-5 星每星主&副屬 +2,6-15 每星主&副屬 +3
- **16 星以上每星** (非一次性) +11 全屬 (weapon/other) 或 +11 主&副屬 (glove);累加到 `rangeTo: 23` 封頂
- 16-22 星 ATT 表 (weapon/other/glove 各不同) + 23 星獨立規則
- `STAR_SETTABLE_CAP = 23` — 24/25 星 UI 不可設定
- 擴充方式:在 `TABLES` 物件加新 level bucket

主/副屬對照 `JOB_MAIN_SUB`:warrior(str/dex)、magician(int/luk)、bowman(dex/str)、thief(luk/dex)、pirate(str/dex)。武器以 `item.classes[0]` 判斷。

### 潛能 (`src/constants/potentials.js`)
- 結構:`POTENTIAL_POOLS[cat][bucket][tier] = options[]`
- option: `{ label, weight, stats? }` — `stats` 給後續計算機用,某些狀態效果沒有 stats
- 階級:`rare → epic → unique → legendary`
- **疊加規則**:第 1 行只吃該階級池;第 2、3 行 (epic 以上) 包含**低一階**池
- 已有資料:**weapon.120** 全四階
- 新 stat keys:`critRate`、`atkPerLv10`、`matkPerLv10`、`strPerLv10`...

### 附加潛能 (`src/constants/bonusPotentials.js`)
- 與潛能相同結構、池分離
- 同樣疊加規則 (第 2/3 行含低一階)
- 已有資料:**weapon.120** 全四階
- 新 stat keys:`moveSpeed`、`jump`

### Bonus Stats (星火屬性)
欄位集中在 `useEquipment.js`:
- `BONUS_STATS_KEYS = [str, dex, int, luk, atk, matk, bossDmg, dmgPct, allStatPct]`
- `NO_BONUS_TYPES = { ring, shoulder, secondary, emblem, badge }` — 完全不支援
- `WEAPON_ONLY_KEYS = { bossDmg, dmgPct }` — 只有武器 type 能有
- `allowedBonusStatKeys(item)` / `supportsBonusStats(item)`

## UI 慣例

### Tooltip (`ItemTooltip.vue`)
- 浮動 `position: fixed`、`<Teleport to="body">`、跟隨滑鼠、邊緣自動翻轉
- 格式仿 MS 內遊戲:星力條 → 粉紅色名稱 → REQ (圖+需求值) → 職業列 (僅武器/副手) → 屬性列表 → L 徽章 Potential / Bonus Potential
- **屬性顏色規則**:
  - 純基礎無強化 → 全白
  - 有任何強化 (star/bonusStats) → 名稱 + 總值 + 冒號轉青 `#5cd1ea`
  - Breakdown 顯示順序 **(base + bonus + star)**:
    - base 段白色
    - bonus 段綠色 `#22c55e`
    - star 段青色
- **總值 `+N` 不跟著染綠** (使用者要求保留藍色)
- 名稱後面 `(N)` 星數後綴已移除 — 星圖本身就夠直觀
- 英文名與中文名相同時只顯示一行

### Star Bar (`StarBar.vue`)
- **每 5 顆一組、組間留白、每 3 組換行、不滿 3 組整列 `justify-content: center`**
- 用 CSS grid:每組 `grid-template-columns: repeat(5, 1em)` 強制等寬
- 三種大小 `compact` / `normal` / `large`
- `editableMax` prop 用來鎖超過上限的星 (顯示但不可點)

### Entry Editor (`EntryEditor.vue`)
- 四個分頁:Stars / Bonus Stats / Potential / Bonus Potential — 各分頁的 `ready` 由 item 動態決定,不支援則禁用 (同「建置中」樣式)
- 草稿模式:`draft` 物件,按「確定」才呼叫各 setter 寫回
- Bonus Stats / Potential 分頁下拉選項依 item 過濾
- 潛能下拉 **不顯示機率** (已移除)

### 背包格 (`InventoryGrid.vue`)
- 以圖為主、名稱為輔;左上角 `★N` 徽章僅在 `stars > 0` 時顯示
- Hover 顯示 ✎ 編輯 + × 移除
- 無星力條 (空間太小會跑版)
- Grid columns 用 `minmax(0, 1fr)` 防止長名稱撐大格子

### 裝備欄 (`EquipmentSlots.vue`)
- 與背包格相同:圖+名、左上角星數徽章
- 選中槽位 → 黃色外框 + 背包自動過濾為符合類型

## 工作慣例

- 所有 i18n 字串放 `src/i18n/locales/zh-TW.json` + `en.json`,Bonus Stats / Potential / 稀有度等術語統一使用英文 (Bonus Stats / Rare / Epic / Unique / Legendary)
- 新增或更動資料模型時,`loadState()` 內要 sanitize 確保向後相容
- 驗證:`npx vite build` 需過、之後 `rm -rf dist`
- 不要在 UI 層做重計算 — 純衍生值放 composable 的 computed,資料層儲存 raw

## Git

- remote: `https://github.com/jbjouo/MSUCP.git`
- `main` 為主分支
- 新功能建議走 `feat/xxx` 分支 + PR;bug 修小的直接 commit to main

## 未實作 / 下一步方向

1. **計算機** (`CpCalculatorPage.vue`):以 `useEquipment().totalStats` (已含 base + star + bonusStats) 為起點,再加入主屬性倍率、職業公式
2. **其他等級/部位的星力表**:`TABLES` 加 140 / 130 / ...,`categoryOf()` 也要對應
3. **其他部位/等級的潛能與附加潛能池**:目前只有 weapon.120
4. **Wallet 整合**:MSU Open API (v1rc1) GameMeta / Character & Item;拿 API key → Node 腳本轉 items.json;同時做 wallet connect 匯入玩家擁有的 NFT → 映射到 itemId

## 禁止事項 (使用者已拒絕的模式)

- 重新加入 `rarity` 欄位 — 已整個移除
- 在背包格內直接編輯星力 — 改用編輯 dialog
- Tooltip 背景卡片在頁面底部 — 改為浮動 tooltip
- 每格子顯示 `N/M` 計數 — 已移除,只留左上角 `★N` 徽章
