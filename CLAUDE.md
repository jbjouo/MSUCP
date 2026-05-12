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
| `/equipment` | `EquipmentPage.vue` | 裝備 + 背包 |
| `/cp` | `CpCalculatorPage.vue` | 戰鬥力計算(主要工作面板) |
| `/battle` | `BattlePage.vue` | 戰鬥模擬 |
| `/legion` → `/character`;`/` → `/character` | | |

## 全站風格

統一 **MapleStory 灰色面板**(CSS 變數在 `src/style.css`):

- `--ms-panel-bg` / `--ms-section-bg` / `--ms-head-bg`
- `--ms-accent` = `#ffc857`(金)、`--ms-accent-cyan` = `#5cd1ea`(青)
- 共用 class:`.ms-panel / .ms-panel__head / .ms-section / .ms-btn`

## 核心資料模型

### `items.json` — 裝備模板 (`src/data/items.json`)

僅存**基礎數值**,使用者強化狀態放 entry 實例。

```jsonc
{
  "id", "name", "nameEn?",
  "type": "weapon | hat | top | bottom | shoes | glove | cape | shoulder | belt | pocket | ring | pendant | earring | eye | face | emblem | badge | medal | secondary | overall | android | heart",
  "subType", "level", "req?", "classes", "maxStars?", "attackSpeed",
  "stats": { "atk?", "matk?", "str?", ... },
  "imageUrl"
}
```

- **禁用** `rarity` 欄位
- `stats` 支援 flat(`str / dex / int / luk / atk / matk / hp / mp / def`)與 %(`bossDmg / ignoreDef / allStatPct / atkPct / matkPct / hpPct / mpPct / strPct / ...`)
- `maxStars` 省略 → `maxStarsForLevel(level)` 自動推算

### Entry (`useEquipment.js`)

```js
state.entries[uid] = { itemId, stars, bonusStats?, potential?, bonusPotential? }
state.inventory = [uid, ...]
state.equipped  = { [slotKey]: uid | null }
```

- `resolveEntry(uid)` → `{ uid, stars, item, starStats, bonusStats, potential, bonusPotential }`
- 儲存 key:`msucp.equipment.v3`

### 裝備槽 (`src/constants/equipmentSlots.js`)

5×6 佈局,23 槽位;**無 android / heart / medal**。

## 子系統

每子系統自有 `src/constants/<name>.js`(資料)+ `src/composables/use<Name>.js`(狀態):

| 子系統 | 資料 | composable | 儲存 key | 重點 |
|---|---|---|---|---|
| 星力 | `starForce.js` | — | — | 資料驅動;等級級距 × 部位類別;`STAR_SETTABLE_CAP=23` |
| 潛能 | `potentials.js` | — | — | `POTENTIAL_POOLS[cat][lvBucket][tier]`;第 1 行只吃該階、2/3 行包含低一階 |
| 附加潛能 | `bonusPotentials.js` | — | — | 同潛能結構 |
| Bonus Stats | — | `useEquipment.js` | — | `NO_BONUS_TYPES` / `WEAPON_ONLY_KEYS` 定義在 composable |
| 套裝 | `itemSets.js` | — | — | 累加式階層(觸發 9 件 = 3/5/7/9 全部) |
| Link Skill | `data/linkSkills.js` | `useLinkSkills.js` | `msucp.linkSkills.applied.v3` | classGroup 內疊加等級不佔 slot;跨群佔 1 slot(cap 12) |
| NFT 圖鑑 | `collection.js` | `useCollection.js` | `msucp.collection.v1` | 16 項 × 各 0-25 等;`ignoreDef / critRate` 非線性 |
| 聯盟戰地 | `legion.js` + `puzzle.js` | — | `msucp.legion.v1` / `msucp.puzzle.v1` | 主屬 `fixed: true`(不吃 %);條件型 `specialEffect: true` |
| 超技能 | `hyperSkills.js` | `useHyperSkills.js` | `msucp.hyperSkills.v1` | 5 點 × 9 選項 × 各 1 點;`levelReq` 限制 |
| Hyper Stat | `hyperStat.js` | `useHyperStat.js` | `msucp.hyperStat.v1` | Lv140 解鎖;主屬 `fixed: true` |
| 秘法符文 | `arcaneSymbols.js` | `useArcane.js` | `msucp.arcane.v1` | 6 符文 × 各 0-20;主屬 fixed flat |
| 寵物 | `pets.js` | `usePet.js` | `msucp.pet.v1` | ATT/MATK flat,**吃 %**,計入 CP |
| 內潛 ABILITY | `innerPotential.js` | `useInnerPotential.js` | `msucp.innerPotential.v1` | 3 排;主/全屬 `fixed`、條件型 `specialEffect` |
| V 矩陣 | `vmatrix.js`(資料合併進 skill entry) | `useVMatrix.js` | `msucp.vmatrix.v1` | 見下方 |
| CP 比較欄 | — | — | `msucp.cpCompare.v1` | CP banner 儲存快照 |

### V 矩陣 schema(合併進 skill entry)

```js
skill.vmatrix = {
  kind: 'boost' | 'skill',   // boost=增強既有技能、skill=V 技能本身
  passive?: { type, per, statKey?, fixed? },  // 僅 skill:CP 屬性加成
  maxLevel?,                                   // 預設 30;boost 多半 60
  finalDmgPerLevel?, ignoreDefBonus?,          // 僅 boost:戰鬥模擬終傷與無視
  coreGroupId?,                                // 多支技能共用同一 core(等級同步)
}
```

- `maxLevelOf(skill)` 只讀 `vmatrix.maxLevel`,不 fallback 到 `skill.maxLevel`
- `passiveValueAt(skill, lv) = ceil(lv / passive.per)`(Lv1 就有 1 點)
- **CP 貢獻**:僅 `kind === 'skill'` 且帶 `passive`;走 flat,**吃 %**(非 fixed)
- `coreGroupId` 同的技能 VM 等級同步(例:Teleport Mastery ↔ Creeping Toxin)

## CP 計算機 (`CpCalculatorPage.vue`)

### Breakdown 管線

所有來源收斂到每個 stat key 的 `{ flat: [], pct: [] }`,順序:

1. 角色 base(主屬 Lv 公式、HP/MP、critRate 保底 5%)
2. 已裝備裝備(每件內部先合併 base + star + bonusStats + potentials + bonusPotentials,最後每 stat 只發一條「{裝備名} +N」)
3. 套裝加成
4. 稱號(TITLE,互斥)
5. 技能 SKILL(共通開關 / 被動職業技能 `passive + contribute(ctx)` / 群組互斥 `group`)
6. Buff(`jobs?` 限定;`skillLevelBonus` 例:Combat Orders)
7. NFT 圖鑑 / 聯盟拼圖 / Hyper Stat / 聯盟成員 / 秘法符文 / 內潛 / V 矩陣 / Link Skill / 寵物

每 entry 的 `cpExclude` 旗標(`addFlat/addPct` 第 4/3 參數)— SKILL / BUFF / V Matrix / Link Skill 預設 `true`(不計入 CP)。例外允許名單 `CP_SKILL_ALLOWLIST = { blessing_of_the_fairy, empress_blessing }`。

### PCT_KEYS / MULTIPLICATIVE_KEYS

- `PCT_KEYS`: `bossDmg / ignoreDef / allStatPct / dmgPct / atkPct / matkPct / hpPct / mpPct / strPct / dexPct / intPct / lukPct / critRate / critDmg / finalDmg / buffDuration / damageTaken / elementalResist / summonDuration / cooldownReduction / normalMobDmg / bonusExp`
- `MULTIPLICATIVE_KEYS`: `ignoreDef / damageTaken` 走 `1 − Π(1 − x/100)`

### 最終值公式

- 非 %:`final = floor(normalFlatTotal × (1 + pctTotal/100)) + fixedFlatTotal`
- 相乘型:`1 − Π(1 − Xᵢ/100)`(damageTaken 保留負號)
- 純 % stat:`flatTotal + pctTotal`
- 主屬 breakdown 額外納入 `<stat>Pct / allStatPct / allStat`(同裝備的 `<stat>Pct + allStatPct` **依 label 合併**)

### ATT STATS / COMBAT POWER

傷害:`base = (4 × 主屬 + 副屬) × ATT/100 × 武器常數`,法系自動切 MATK(`JOB_ATT_META[jobKey].usesMatk`)

```
fm     = 1 + Final Damage% / 100
basic  = base × (1 + Damage%/100)                     × fm
boss   = base × (1 + (Damage% + Boss Dmg%)/100)       × fm
```

**熟練度**已從 basic/boss 移除(僅影響實際傷害 min)。

**實際傷害 (boss)**:
```
crit_max  = 1.50 + 爆擊傷害%/100
crit_min  = (1.20 + 爆擊傷害%/100) × 熟練度/100
bossMax   = boss × crit_max;  bossMin = boss × crit_min;  bossAvg = 平均
```

屬性耐性不在 CP 頁套用(改由戰鬥模擬依怪物設定計算)。

**CP 公式**(6 個乘區):
```
Zone 1 = (4 × 主屬 + 副屬) / 100
Zone 2 = ATT (僅 flat,不吃 %)
Zone 3 = 1 + ATT% / 100
Zone 4 = (135 + 爆擊傷害%) / 100
Zone 5 = (100 + Damage% + Boss Damage%) / 100
Zone 6 = 終傷乘區 (未實作) → 1
差值  = round(ATT × Zone3, 2dp) − floor((ATT − 69) × Zone3)
Z2Z3  = Zone2 × Zone3 − 差值
CP    = floor(Zone1 × Z2Z3 × Zone4 × Zone5 × Zone6)
```

`WEAPON_COEFFICIENT_DELTA = 69`;所有取值用 `statTotalForCp / flatTotalForCp / pctTotalForCp`(過濾 `cpExclude`)。

## 戰鬥模擬 (`BattlePage.vue`)

`requestAnimationFrame` 逐 frame 推進。

### 共用 composable

| composable | 職責 |
|---|---|
| `useCpDamage` | 從 CpCalculatorPage 抽出的 breakdowns / statTotal / attStatsInfo / cpZones,兩頁共用 |
| `useCpToggles` | Buff / Skill / Title 啟用 Set(localStorage 同步) |
| `useBattleBuffs` | 實戰 buff 層數(session-only) |
| `useDotTracker` | 場上 DoT 數 |
| `useEnemySettings` | ENEMY SETTINGS(持久化) |
| `useBattleSim` | 模擬主控 |

### 技能資料架構 (`src/constants/skills/`)

```
skills/
├── _shared/
│   ├── helpers.js                            # LOCAL_ICON / skillDamagePct 等
│   ├── all-jobs/{0..6}th.js                  # 全職業共通
│   ├── branches/magician/{0..6}th.js         # 分支共通
│   └── class-groups/adventurer-mage/{0..6}th.js
├── jobs/
│   ├── _template/                            # 新職業範本
│   └── archmage-fp/{0..6}th.js + hyper.js + index.js
└── index.js                                   # 頂層 barrel
```

每個 `Nth.js` 採「單一主列表 + filter derive」:

- `TOGGLE_SKILLS / BUFFS / PASSIVE_SKILLS` ← 依 `cp.role`
- `VMATRIX_SKILLS` ← 依 `s.vmatrix`
- `SIM_SKILLS` ← 依 `s.sim`
- `BATTLE_BUFFS` ← filter `s.battle`

### Skill entry schema

**遊戲屬性於 top level,系統角色於子物件**:

```js
{
  id, name, nameKey, descriptionKey, imageUrl, icon, color,
  jobs, advancement,                        // 0~6 / 'hyper' / 'title'
  kind,                                     // attack|passive|buff|toggle|summon|aura|utility|link
  element, baseLevel, maxLevel,
  mpCost, hitsPerCast, maxEnemies, cooldown,
  damage, burn, explosions, finalDmgByExplosions, ignoreDef, finalAttack, ignite, fieldDurationSec,
  stats, mastery, skillLevelBonus, contribute,   // CP 計算
  combatOrdersEligible,

  cp:      { role, group },
  vmatrix: { kind, maxLevel, passive?, finalDmgPerLevel?, ignoreDefBonus?, coreGroupId? },
  battle:  { source, mirror?, onceOnly?, triggerAfter?, ignoresBuffDuration?, hideCooldown? },
  sim:     { role, castDelayBySpeed, priority, aura?, onHitSpawn?, onHitResetCooldown?, requiresField?, cooldown?, orbs? },
}
```

單一 entry 可同時具備多角色(例:Decent Sharp Eyes = CP Buff + V 矩陣;arcane_aim = CP passive + Battle Buff)。SIM 是否進戰鬥模擬的條件是 `s.sim` 存在。

### 施放排程

**earliest-ready + priority tiebreak** 選一支技能 fire。Fire 後:

- **主動型**:`nextCastAt = tCast + max(animDelay, effCd)`,**同時 global cast lock** 把其他主動技能推到 ≥ `tCast + animDelay`
- **Aura 型**(`kind:'aura'`):只更新自身 `nextCastAt = tCast + intervalSec × 1000`,不鎖其他、不被鎖
- **Derived 型**:永不自排程,只靠 `onHitSpawn` 觸發

**Opener priority cascade**(`start()`):依 priority 遞減,累加 animDelay 作前序等待,避免開場齊發。

**Aura 首次觸發**:`firstHitWindowSec: [min, max]` 範圍隨機。

**PRNG**:`makeRng` 用 mulberry32(取代原 LCG 以消 bias);`state.seed = Date.now() >>> 0`,可用 `setSeed(n)` 重現。

### 傷害公式

**主擊**:
```
hit = bossBase × (主技%/100) × elemMult × arcMult × skillFinalMult × buffFinalDmgMult
      × defMult × explosionMult × bmMult × levelDiffMult
```

爆擊與熟練度已內化進 `bossMin / bossMax` 取樣。

**DoT**(獨立管線):
```
dot = baseRaw × (DoT%/100) × skillFinalMult × dotSpecialMult × dotEnemyMult × arcMult × DOT_COEFFICIENT
```

`DOT_COEFFICIENT = 1.5`(`useBattleSim.js` 模組常數)。

**DoT 一律不吃**:fm / CP Damage% / Buff Damage% / 超技能 `burnDamagePct` / Boss Damage% / `elemMult` / buff 終傷 / Burning Magic FD / 等差終傷 / 怪物 DEF / 爆擊 / 熟練度
**DoT 有吃**:`arcMult`、`skillFinalMult`(技能專屬 VM)、`dotSpecialMult`(Fervent Drain)、`dotEnemyMult`(怪物類型:normal=1.00 / boss-full=1.86 / boss-half=1.41 / boss-none=0)、`DOT_COEFFICIENT`
**DoT 時長**:`(base + hyper flat) × burningMagicDotDurationMult()`,Burning Magic 場上 ≥1 DoT → ×2

**DoT 傷害快照 (sticky)**:`emitCast` 建立新 DoT 時以當下面板算 `dotDmg` 存 `burnState[id].dmg`;只要未過期,中途任何變動都不會重算,`processBurnTicks` 讀 `bs.dmg`。

### Buff 系統 (`useBattleBuffs`)

buff `source` 類型:
- `linkSkill` — 動態查 link skill 等級取 stats;`rollTriggers` 依 procRate 抽層
- `passive` + `passiveType: 'dotCount' | 'procOnHit'`
- `activeToggle` — 戰鬥開始後自動循環(Infinity);CD 吃 CD 減免
- `linkCycle` — stats 從 LinkSkill 系統取;自動循環或事件觸發;**不吃 Buff Duration% 與 CD 減免**;可選 `triggerOn: 'debuffApplied'`

**最終傷害合成**:不同 buff 互乘,同 buff 層加:
```
buffFinalDmgMult = Π [ 1 + (stacks × perStack) / 100 ]
```

### 冷卻公式 (`computeEffectiveCooldown` in `useCpDamage.js`)

**嚴格順序**:

1. 技能優先扣秒 (`skill.cooldownPriorityRedSec`)
2. 百分比減免(乘法疊加):`skill.cooldownOwnPctRed` × `externalPctRed`
   - 特例 `cooldownExternalPctUsesBaseAsFlat: true` → 外部 % 以 base CD 換 flat 扣
3. 帽子 flat (`hatFlatRedSec`):
   - `CD < 5s` → 不生效
   - `CD > 10s` → 直接扣秒
   - `5s ≤ CD ≤ 10s` → 每 1s flat 轉 5% 減免
   - 最終 **≥ 5s 硬下限**

走此函式:一般技能 + `activeToggle` buff(Infinity)
不走:`linkCycle`(用原始 cooldown)

### DoT 計數同步

`burnState` 一旦變動 → `syncDotCount()` → `useDotTracker.setActiveDotCount(...)`。確保:
- 同一 tick 內 Flame Haze 衍生 Poison Mist 後,Mist Eruption 讀到當下 DoT 數
- CD 優先減免(`activeDots >= cooldownPriorityThreshold`)即時觸發
- Fervent Drain 疊層同步

### CD / 下次施放時間分離

- `nextCastAt[id]`:scheduler 用(含 animDelay 鎖)
- `cooldownEndAt[id]`:純遊戲 CD,`onHitResetCooldown` 清零用,CD 面板讀這個

### 超技能 Damage% 歸屬

超技能 `damagePct` **加算到主擊 Damage% 桶**,不乘進技能 %:
```
extraDmgPct (main) = Buff Damage% + Hyper damagePct
basic/boss = baseRaw × (1 + (CP Damage% + extraDmgPct)/100) × fm
hit        = bossBase × (skill.hit%/100) × ...
```

**DoT 不吃 Damage% 任何來源**;`burnDamagePct` 目前無效(欄位保留)。

### 等差終傷

`levelDiffFinalDmgPct`(`constants/enemySettings.js`):角色等級 − 怪物等級查表(+5 封頂 +20%、-40 封底 -100%)。**僅主擊**。

### ENEMY SETTINGS

Type(BOSS / 一般)、Level、Defense、Elemental DMG Taken(full/half/none)、Boss ARC。
`ARC_RATIO_TABLE` + `arcRatioLookup(playerArc, bossArc)` → 終傷 %。

## 職業資料庫 (`src/constants/jobs.js`)

branch / 職業 / 主屬 / `linkSkill?`:

- **beginner** / **warrior** → `invincible_belief` / **magician** → `empirical_knowledge`
- **bowman** → `adventurers_curiosity` / **thief** → `thiefs_cunning` / **pirate** → `pirate_blessing`
- **cygnus** → `cygnus_blessing`(5 人 Lv 上限 10) / **mihile** → `knights_watch`
- **heroes**:aran/evan/mercedes/phantom/luminous/shade 各有 link skill

`findBranchByJob(jobKey)` 取得 branch。

## 數值精度 (`src/utils/numerics.js`)

為避免 IEEE 浮點誤差,核心計算管線**一律**走此模組:

- `clean(x)` — 截 1e10 精度
- `add / sub / mul / div` — variadic,每步都 clean
- `sumBy / applyPct / combineIgnorePct / floor / ceil / roundTo`

**規則**:
- 加總 flat/pct → `sumBy / add`
- 一連串乘區 → `mul(...)` 或 `mulChain(...)`
- 無視/減傷相乘疊加 → `combineIgnorePct(...)`
- **新增計算邏輯不要用原生 `+` `*`**;已遷移:`useCpDamage.js` / `useBattleSim.js`

## UI 慣例

- **Tooltip**(`ItemTooltip.vue`):`position: fixed` + `<Teleport to="body">`、跟隨滑鼠、邊緣自動翻轉
- **屬性顏色**:base=白、有星力/星火=青、bonus=綠、star 段=青
- **Star Bar**:5 顆一組、3 組換行;`compact/normal/large`
- **Entry Editor**:分頁 Stars/Bonus/Potential/BonusPot;不適用分頁直接隱藏;草稿模式
- **CP 側欄 SKILL/BUFF/TITLE**:每排 4 顆;40×40 icon;TITLE 互斥;SKILL `group` 互斥;BUFF `jobs?` 限定可見
- **背包格**:不可直接編輯星力(用 EntryEditor dialog);格子不顯示 `N/M` 計數
- **禁用**:`rarity` 欄位、頁底背景 tooltip 卡

## 工作慣例

- **i18n**:所有字串放 `src/i18n/locales/zh-TW.json + en.json`;術語保留英文(Bonus Stats / Rare / Epic / Unique / Legendary ...)
- 新增或變更資料模型,`loadState()` 要 sanitize(向後相容)
- 驗證:`npx vite build` 需過
- 不在 UI 層做重計算 — 衍生值放 composable 的 computed

## Git

- 原始碼 remote:`https://github.com/jbjouo/MSUCP.git`(`origin`)
- main 為主分支;小修直 commit to main;新功能可開 `feat/xxx` + PR

### 正式環境部署

- 正式站 repo:`https://github.com/wasaizanla/msucp.git`(另一個帳號,GitHub Pages 來源)
- **只有在使用者明確說要「部署 / deploy / 上正式 / 推到正式環境」時才 push 到這裡**。一般 commit、bug fix、功能開發都**不要**主動部署
- 部署流程(**一律用絕對路徑 `git -C` 操作 dist,絕對不要 `cd dist`**,避免 cwd 歧義誤刪專案 `.git`):
  1. `npx vite build`
  2. `cp <root>/dist/index.html <root>/dist/404.html`(SPA 深連結 fallback)
  3. `git -C <root>/dist init -b main -q`
  4. `git -C <root>/dist -c user.email=... -c user.name=... add -A && commit -m "deploy: ..."`
  5. `git -C <root>/dist -c credential.helper=store push -f https://wasaizanla@github.com/wasaizanla/msucp.git main`
  6. `rm -rf <root>/dist/.git`
- credential 已存在 `~/.git-credentials`(macOS 上需用 `wasaizanla@github.com` URL 形式才會吃 store 而非 osxkeychain 的 `jbjouo`)
- 部署相關設定(必須維持):`vite.config.js` 的 `base: '/msucp/'`、`src/router/index.js` 的 `createWebHistory(import.meta.env.BASE_URL)`、`public/.nojekyll`

## localStorage key 清單

| key | 用途 |
|---|---|
| `msucp.equipment.v3` | 裝備 entries + inventory + equipped |
| `msucp.character.v1` | 角色等級 / 職業 |
| `msucp.collection.v1` | 圖鑑等級 |
| `msucp.legion.v1` / `msucp.puzzle.v1` | 戰地 / 拼圖 |
| `msucp.hyperStat.v1` | Hyper Stat 配點 |
| `msucp.arcane.v1` | 秘法符文 |
| `msucp.pet.v1` | 寵物 |
| `msucp.innerPotential.v1` | 內潛 3 排 |
| `msucp.vmatrix.v1` | V 矩陣等級(含技能專屬) |
| `msucp.linkSkills.applied.v3` | 已連結 link skill |
| `msucp.cpBuffs.v1` / `msucp.cpSkills.v1` / `msucp.cpTitles.v1` | CP 開關 |
| `msucp.cpCompare.v1` | CP 比較快照 |
| `msucp.enemy.v1` | ENEMY SETTINGS |
| `msucp.hyperSkills.v1` | 超技能配點 |

**未持久化(session only)**:`useBattleSim`、`useBattleBuffs`、`useDotTracker`

資料匯出/匯入:`useDataIO.js` 的 `DATA_KEYS`;`EXPORT_VERSION = 2`。新增子系統請同步維護。
