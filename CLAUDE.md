# MSUCP — Claude Code 專案指引

著重「資料模型」與「不變的慣例」。細節實作請直接讀 code。

## 專案總覽

**MapleStory Universe (MSU)** 輔助工具:角色 + 聯盟戰地 + 圖鑑 + Hyper Stat / 裝備管理 / 戰鬥力計算 / 戰鬥模擬。

- Stack: **Vue 3 (Composition API, `<script setup>`) + Vite + vue-router + vue-i18n**
- SPA,`createWebHistory`(無 `#`)
- 資料持久化:**瀏覽器 localStorage**(每子系統一個 key)

啟動 `npm install && npm run dev`;驗證 `npx vite build`。

## 路由

| path | page | 說明 |
|---|---|---|
| `/character` | `CharacterPage.vue` | 角色 + Link Skill + 聯盟戰地 + 圖鑑 + Hyper Stat + ARC + 寵物 + 內潛 + V 矩陣 |
| `/equipment` | `EquipmentPage.vue` | 裝備 + 背包 + 匯入/匯出 |
| `/cp` | `CpCalculatorPage.vue` | 戰鬥力計算(主要工作面板) |
| `/battle` | `BattlePage.vue` | 戰鬥模擬 |

## 核心資料模型

### `items.json` — 裝備模板 (`src/data/items.json`)

僅存**基礎數值**,使用者強化狀態放 entry 實例。

```jsonc
{
  "id", "apiItemId",
  "name", "nameEn?",
  "type": "weapon | hat | top | bottom | shoes | glove | cape | shoulder | belt | pocket | ring | pendant | earring | eye | face | emblem | badge | medal | secondary | overall",
  "subType", "level", "req?", "classes", "maxStars?", "attackSpeed",
  "stats": { "atk?", "matk?", "str?", "moveSpeed?", "jump?", "hpPct?", "mpPct?", ... },
  "dayBonus?": { "day": 0-6, "stats": { "ignoreDef": 10 } },
  "imageUrl"
}
```

- `apiItemId`: MSU Open API 的數字 item ID,用於 API 查詢與套裝比對
- `classes`: 對應 `combatClass`(warrior/magician/bowman/thief/pirate),跨大類共用
- `dayBonus`: 七日勳章專用,`day` = `Date.getDay()`(0=Sun),當天才生效
- `maxStars` 用 `common.maxStarforce` 判斷(不用 `enableStarforce`)
- **禁用** `rarity` 欄位

### Entry (`useEquipment.js`)

```js
state.entries[uid] = { itemId, stars, bonusStats?, potential?, bonusPotential? }
state.inventory = [uid, ...]
state.equipped  = { [slotKey]: uid | null }
```

- `importEntries(entries, inventory)`:將裝備加到當前角色背包(不建新角色)
- 儲存 key:`msucp.char.<charId>.equipment.v3`

## 職業系統 (`src/constants/jobs.js`)

三層架構:

- **classGroup**: 大類(explorer / cygnus / resistance / heroes / flora)
- **combatClass**: 職業分類(warrior / magician / bowman / thief / pirate)
- **job key**: 具體職業(archmageFP / shadower / nightwalker / buccaneer ...)

```js
{ key: 'cygnus', classGroup: 'cygnus', jobs: [
  { key: 'nightwalker', primary: 'luk', combatClass: 'thief', linkSkill: 'cygnus_blessing' },
]}
```

- 裝備 `classes` 和 CatalogPicker 過濾皆使用 `combatClass`
- `combatClassOf(jobKey)` 取得職業分類

## 星力 (`starForce.js`)

等級級距 × 部位類別;`STAR_SETTABLE_CAP=23`。

| 等級段 | 武器 | 防具/手套/飾品 |
|---|---|---|
| Lv100 | 全屬 +2/+3 | 同 |
| Lv130 | 16-20★ 完整 | 同 |
| Lv140 | 16-22★ 完整(全屬+9/星, ATT: 8/8/9/10/10/11/12) | 16-23★ 完整 |
| Lv150 | 16-23★ 完整 | 同 |
| Lv160 | 16-23★ 完整 | 16-25★ 完整 |
| Lv200 | 武器完整;防具/手套/飾品暫用 Lv160 | 同 |

## 星火 (`bonusStatsTiers.js`)

武器 ATT/MATK 星火公式(Lv120-159 Normal Weapons):
```
ceil(base × %)  百分比 = [4%, 8%, 12%, 17.6%, 24.2%, 31.944%, 40.9948%]
```

- 已建表:Lv140 / Lv150 / Lv200
- 表中找不到的 base 值 → `computeFlameByFormula()` 自動計算
- `weaponBonusTiersFor(item, statKey)`:查表優先,fallback 公式

## 套裝 (`itemSets.js`)

- 成員可預先寫入(items.json 尚未新增的裝備),未來加入時自動配對
- `fetch-items.mjs --append` 新增裝備時自動查 API set → 比對 itemSets.js → 插入成員
- 若 set 不存在,輸出完整 set 資訊(成員、效果)供手動新增

## 子系統

每子系統自有 `src/constants/<name>.js`(資料)+ `src/composables/use<Name>.js`(狀態):

| 子系統 | 資料 | composable | 儲存 key |
|---|---|---|---|
| 星力 | `starForce.js` | — | — |
| 潛能 | `potentials.js` | — | — |
| 附加潛能 | `bonusPotentials.js` | — | — |
| 星火 | `bonusStatsTiers.js` | `useEquipment.js` | — |
| 套裝 | `itemSets.js` | — | — |
| Link Skill | `data/linkSkills.js` | `useLinkSkills.js` | `msucp.linkSkills.applied.v3` |
| NFT 圖鑑 | `collection.js` | `useCollection.js` | `msucp.collection.v1` |
| 聯盟戰地 | `legion.js` + `puzzle.js` | — | `msucp.legion.v1` / `msucp.puzzle.v1` |
| 超技能 | `hyperSkills.js` | `useHyperSkills.js` | `msucp.hyperSkills.v1` |
| Hyper Stat | `hyperStat.js` | `useHyperStat.js` | `msucp.hyperStat.v1` |
| 秘法符文 | `arcaneSymbols.js` | `useArcane.js` | `msucp.arcane.v1` |
| 寵物 | `pets.js` | `usePet.js` | `msucp.pet.v1` |
| 內潛 | `innerPotential.js` | `useInnerPotential.js` | `msucp.innerPotential.v1` |
| V 矩陣 | `vmatrix.js` | `useVMatrix.js` | `msucp.vmatrix.v1` |
| 戰鬥記錄 | — | `useBattleRecord.js` | `msucp.char.<id>.battleRecord.v1` |

## CP 計算 (`CpCalculatorPage.vue`)

### Breakdown 管線

所有來源收斂到每個 stat key 的 `{ flat: [], pct: [] }`,順序:

1. 角色 base(主屬 Lv 公式、HP/MP、critRate 保底 5%)
2. 已裝備裝備(base + star + bonusStats + potentials + bonusPotentials + dayBonus)
3. 套裝加成
4. 稱號(TITLE,互斥)
5. 技能 SKILL / Buff / 圖鑑 / 聯盟 / Hyper Stat / 秘法 / 內潛 / V 矩陣 / Link Skill / 寵物

### MULTIPLICATIVE_KEYS

`ignoreDef / damageTaken` 走 `1 − Π(1 − x/100)`

### ATT STATS 公式

```
base = (4 × 主屬 + 副屬) × ATT/100 × 武器常數
fm   = 1 + Final Damage% / 100
basic = base × (1 + Damage%/100) × fm
boss  = base × (1 + (Damage% + Boss Dmg%)/100) × fm
```

### CP 公式(6 個乘區)

```
Zone 1 = (4 × 主屬 + 副屬) / 100
Zone 2 = ATT (僅 flat)
Zone 3 = 1 + ATT% / 100
Zone 4 = (135 + 爆擊傷害%) / 100
Zone 5 = (100 + Damage% + Boss Damage%) / 100
Zone 6 = 終傷乘區 (未實作) → 1
CP = floor(Zone1 × (Zone2 × Zone3 − 差值) × Zone4 × Zone5 × Zone6)
```

### 戰鬥記錄 (`useBattleRecord.js`)

- 「開始測量並記錄」每秒快照 buff 帶來的屬性變化量
- 記錄 key: `str/dex/int/luk/atk/matk/dmgPct/bossDmg/finalDmgPct/ignoreDef/critRate/critDmg`
- CP 面板開關(僅 archmageFP):用平均值重算 ATT STATS 顯示差異,不影響 CP
- `ignoreDef` 使用 `combineIgnorePct` 相乘合併

## 戰鬥模擬 (`BattlePage.vue`)

`requestAnimationFrame` 逐 frame 推進。

| composable | 職責 |
|---|---|
| `useCpDamage` | breakdowns / statTotal / attStatsInfo / cpZones,CP 頁與戰鬥頁共用 |
| `useBattleSim` | 模擬主控;`setCallbacks(onTick, onStop)` 供戰鬥記錄 hook |
| `useBattleBuffs` | 實戰 buff 層數(session-only);`currentBonuses()` 回傳 dmgPct/ignoreDefPct/finalDmgMult |
| `useDotTracker` | 場上 DoT 數 |
| `useEnemySettings` | ENEMY SETTINGS(持久化) |

### 主擊傷害

```
hit = bossBase × (技能%/100) × elemMult × arcMult × skillFinalMult × buffFinalDmgMult
      × defMult × explosionMult × bmMult × levelDiffMult
```

### DoT 傷害(獨立管線)

```
dot = baseRaw × (DoT%/100) × skillFinalMult × dotSpecialMult × dotEnemyMult × arcMult × 1.5
```

DoT **不吃**:fm / Damage% / Boss Damage% / buff 終傷 / 怪物 DEF / 爆擊
DoT **有吃**:arcMult / skillFinalMult / dotSpecialMult / dotEnemyMult / DOT_COEFFICIENT(1.5)

### 數值精度 (`numerics.js`)

核心計算一律走 `clean/add/sub/mul/div/combineIgnorePct`。**不用原生 `+` `*`**。

## 技能資料架構

```
skills/jobs/<job-name>/
  0th.js ~ 6th.js + hyper.js + index.js
```

- 每職業註冊到 `jobs/index.js` 的 `JOB_SKILL_REGISTRY`
- 被動技能只收錄影響 CP 的屬性(排除:熟練度、狀態抗性、屬性抗性、damage taken、攻速、HP/MP)
- 技能提升其他技能傷害的被動(如 Raging Serpent Assault +100%)暫不收錄,待戰鬥模擬時加入
- 已建立:archmage-fp / bishop / shadower / buccaneer / night-walker

## MSU Open API 工具 (`scripts/`)

`scripts/` 在 `.gitignore`,不進版控。

### API 設定
- Key 存 `.env.local`(`MSU_API_KEY=gw_xxx`),已被 `.gitignore` 排除
- **絕對不讀取 `.env.local`**,只透過腳本間接使用
- 限速:每 2 秒一次請求

### 快取
- `scripts/cache/` 依 API 路徑自動快取(如 `gamemeta/items/1132308.json`)
- `api()` 自動讀寫快取;`apiNoCache()` 不快取(角色即時資料)
- `--refresh` 強制重新請求

### 腳本

| 腳本 | 用途 |
|---|---|
| `msu-api.mjs` | API 呼叫工具(含快取 + 限速) |
| `fetch-items.mjs` | 批次新增裝備到 items.json + 圖片 + 套裝配對 |
| `fetch-character-items.mjs` | 從角色 API 取裝備,比對後新增缺少的 |
| `export-character-equip.mjs` | 取角色裝備強化狀態,生成匯入用 JSON |
| `build-skill-db.mjs` | 建立職業技能資料庫(分轉職存放) |

### 新增裝備流程
1. `fetch-items.mjs --append <itemId>` 或 `fetch-character-items.mjs --append <assetKey>`
2. 自動:轉換 API 格式 → 寫入 items.json(含 `apiItemId`) → 下載圖片 → 套裝配對
3. API category 對應:`tier1=Weapon` + `tier2=Secondary Weapon` → secondary;`Outfit` → overall;`Shoulder Accessory` → shoulder

### 技能資料庫 (`scripts/skill-db/<job>/`)
- `_character.json` + `0th~5th.json` + `hyper.json` + `vmatrix.json`
- 技能 metadata 走快取;角色端點走 `apiNoCache`

## 裝備匯入/匯出

- **匯入裝備**(EquipmentPage):加到當前角色背包,不建新角色
- **匯出裝備**(EquipmentPage):背包 + 裝備欄全部匯出
- **匯入角色**(`importData`):建立新角色,獨立功能
- 背包有**複製按鈕**:確認後複製完整屬性(星力/星火/潛能/附加潛能)

## localStorage key 清單

per-character key 格式:`msucp.char.<charId>.<suffix>`

| suffix | 用途 |
|---|---|
| `equipment.v3` | 裝備 entries + inventory + equipped |
| `character.v1` | 角色等級 / 職業 |
| `collection.v1` | 圖鑑等級 |
| `legion.v1` / `puzzle.v1` | 戰地 / 拼圖 |
| `hyperStat.v1` | Hyper Stat 配點 |
| `arcane.v1` | 秘法符文 |
| `pet.v1` | 寵物 |
| `innerPotential.v1` | 內潛 3 排 |
| `vmatrix.v1` | V 矩陣等級 |
| `linkSkills.applied.v3` | 已連結 link skill |
| `cpBuffs.v1` / `cpSkills.v1` / `cpTitles.v1` | CP 開關 |
| `cpCompare.v1` | CP 比較快照 |
| `hyperSkills.v1` | 超技能配點 |
| `battleRecord.v1` | 戰鬥模擬記錄 |

全域 key:`msucp.characters.v1`(角色名單)、`msucp.activeCharId.v1`、`msucp.enemy.v1`

**未持久化(session only)**:`useBattleSim`、`useBattleBuffs`、`useDotTracker`

匯出/匯入:`useDataIO.js`;`EXPORT_VERSION = 2`

## 工作慣例

- **i18n**:所有字串放 `src/i18n/locales/zh-TW.json + en.json`
- 新增或變更資料模型,`loadState()` 要 sanitize(向後相容)
- 驗證:`npx vite build` 需過
- 不在 UI 層做重計算 — 衍生值放 composable 的 computed

## Git / 部署

- 原始碼:`https://github.com/jbjouo/MSUCP.git`(`origin`),main 為主分支
- 正式站:`https://github.com/wasaizanla/msucp.git`(GitHub Pages)
- **只有使用者明確說「部署」時才 push 正式站**
- 部署流程(**一律用 `git -C` 操作 dist,不要 `cd dist`**):
  1. `npx vite build` → `cp dist/index.html dist/404.html`
  2. `git -C dist init -b main -q` → add → commit → push -f → `rm -rf dist/.git`
- 必須維持:`vite.config.js` 的 `base: '/msucp/'`、`public/.nojekyll`
