# MSUCP — Claude Code 專案指引

本檔案讓 Claude 在任何新 clone 的機器上能快速接續開發。著重「資料模型」與「不變的慣例」。

## 專案總覽

**MapleStory Universe (MSU)** 輔助工具:角色 + 聯盟戰地 + 圖鑑 + Hyper Stat / 裝備管理 / 戰鬥力計算。

- Stack: **Vue 3 (Composition API, `<script setup>`) + Vite + vue-router + vue-i18n**
- 部署形式: Vite SPA,`createWebHistory` (無 `#`)
- 資料持久化: **瀏覽器 localStorage**(每個子系統一個 key),`navigator.storage.persist()` 要求長期儲存

啟動 `npm install && npm run dev`;驗證 `npx vite build`(build 過即代表通過)。

## 路由

| path | page | 說明 |
|---|---|---|
| `/character` | `CharacterPage.vue` | 角色基礎 + Link Skill + 聯盟戰地 + 圖鑑 + Hyper Stat + 秘法符文(ARC) + 寵物 + 內潛 + V 矩陣 |
| `/equipment` | `EquipmentPage.vue` | 裝備 + 背包 |
| `/cp` | `CpCalculatorPage.vue` | 戰鬥力計算(主要工作面板,統整所有來源) |
| `/battle` | `BattlePage.vue` | 戰鬥模擬(實時逐擊模擬 + ENEMY SETTINGS + Buff 面板 + 單次施放測試) |
| `/legion` | 重導至 `/character` | (舊路由保留相容) |

`/` 重導到 `/character`。

## 全站風格

整站統一 **MapleStory 灰色面板**(以 CP 計算機為範本):

- `--ms-panel-bg`:`linear-gradient(180deg, #8b96a8, #6b7689)` + `#3d4554` 邊框 + 14px 圓角
- `--ms-section-bg`:`linear-gradient(180deg, #4f5867, #434c59)` + `#2f3642` 邊框 + 8px 圓角
- `--ms-head-bg`:灰色頂條 + 金色字 / 白字
- `--ms-accent` = `#ffc857`(金)、`--ms-accent-cyan` = `#5cd1ea`(青)
- 共用 class `.ms-panel / .ms-panel__head / .ms-section / .ms-btn`(在 `src/style.css`)

TopBar 亦改為灰色條 + 金字 brand。

## 核心資料模型

### 1. `items.json` — 裝備模板 (`src/data/items.json`)

僅存**基礎數值**,使用者強化狀態放在 entry 實例。

```jsonc
{
  "id": "唯一 ID",
  "name": "名稱", "nameEn": "英文名稱 (可選)",
  "type": "weapon | hat | top | bottom | shoes | glove | cape | shoulder | belt | pocket | ring | pendant | earring | eye | face | emblem | badge | medal | secondary | overall | android | heart",
  "subType": "sword | wand | bow | dagger | totem | ...",
  "level": "REQ LEV",
  "req": { "str?": 0, "dex?": 0, "int?": 0, "luk?": 0 },
  "classes": ["warrior" | "magician" | "bowman" | "thief" | "pirate"],
  "maxStars": 25,
  "attackSpeed": 4,
  "stats": { "atk?": 119, "matk?": 201, "str?": 40, ... },
  "imageUrl": "https://..."
}
```

- **沒有** `rarity`(已整個移除)
- `stats` key:`str / dex / int / luk / atk / matk / hp / mp / def`,% 類 `bossDmg / ignoreDef / allStatPct / atkPct / matkPct / hpPct / mpPct / strPct / ...`
- 若 `maxStars` 省略,以 `maxStarsForLevel(level)` 自動推算(見下方 架構)

### 2. Entry (使用者實例,`useEquipment.js`)

```js
state.entries[uid] = {
  itemId,
  stars,                 // 0..min(item.maxStars, levelCap, STAR_SETTABLE_CAP=23)
  bonusStats?,           // { str, dex, int, luk, atk, matk, bossDmg, dmgPct, allStatPct }
  potential?,            // { tier, lines: [label|null, ..., ×3] }
  bonusPotential?,
}
state.inventory = [uid, ...]
state.equipped  = { [slotKey]: uid | null }
```

- 儲存 key:`msucp.equipment.v3`(v1/v2 會清除)
- `resolveEntry(uid)` → `{ uid, stars, item, starStats, bonusStats, potential, bonusPotential }`

### 3. 裝備槽 (`src/constants/equipmentSlots.js`)

5×6 佈局,23 個槽位;**無 android / heart / medal**。`accepts: [type, ...]`。

## 強化與計算相關子系統

### 星力 (`src/constants/starForce.js`)

**資料驅動、兩個維度:等級級距 × 部位類別。**

**等級級距 → 最大星數(架構規範 `maxStarsForLevel`)**:
| 裝備等級 | 上限 |
|---|---|
| 100-109 | 8 |
| 110-119 | 10 |
| 120-129 | 15 |
| 130-139 | 20 |
| 140+ | 25(UI 封頂 23) |
| <100 | 0(不可強化) |

`STAR_SETTABLE_CAP = 23` — UI 永遠封頂 23。

**部位類別 `categoryOf`**:
- `weapon`:weapon / secondary
- `glove`:glove(含 Lv160 的 5/7/9/11/13/14/15★ 特殊 ATT/MATK +1)
- `armor`:hat / top / bottom / shoes / overall(16★+ 主&副屬)
- `other`:其餘飾品 + 披風(16★+ 全屬)

**1-15★ 規則**(動態判定,在 `computeStarStats` 內):
- 全職業裝備(`item.classes.length >= 2`)→ 每星加**全屬性**
- 單職業裝備 → 每星僅加**主&副屬**(依 `item.classes[0]`)
- `tier.target === 'allStat'` 可強制所有類別走全屬(保留 Lv100 表相容)

**武器 1-15★**:逐星以**當下攻擊力**查表(每 50 ATT 區間 +1 ATT/星),ATT 與 MATK 獨立計算(`accumulateWeaponAtt`)。

**16★+ 規則**:`perStarFrom16[cat]` 提供 `allStat` 或 `mainSub` + `rangeTo`;per-cat `rangeTo` 可覆寫頂層。23★(或 24/25)走 `attByStar` 特例表。

**已實作表格**:
- `TABLE_100`(Lv100-139):1-5 +2、6-25 +3(`target: 'allStat'`)
- `TABLE_140`:16-22★ 全屬/主&副 +9;其中武器 17+ 未完成
- `TABLE_150`:全屬/主&副 +11
- `TABLE_160`:全屬/主&副 +13;手套 1-15 特殊 ATT 加成

**主/副屬 `JOB_MAIN_SUB`**:warrior(str/dex)、magician(int/luk)、bowman(dex/str)、thief(luk/dex)、pirate(str/dex)。武器以 `item.classes[0]` 判斷。

### 潛能 `POTENTIAL_POOLS` (`src/constants/potentials.js`)

結構:`POTENTIAL_POOLS[category][levelBucket][tier] = options[]`
- `option = { label, weight, stats? }` — `stats` 供計算機;沒 stats 者(條件型如 Skill MP Cost / HP Recovery / chance to ignore damage)不進統計
- 階級:`rare → epic → unique → legendary`
- 疊加規則:第 1 行只吃該階級池;第 2、3 行(epic+)包含**低一階**池
- **已有資料**:
  - weapon.120 全四階
  - ring.100 / ring.110 / ring.120 全四階
  - belt.120 全四階(Unique / Legendary 帶「chance to ignore damage」條件效果)
  - pendant.120 全四階(資料同 ring.120,程式內共用引用)

### 附加潛能 `BONUS_POTENTIAL_POOLS` (`src/constants/bonusPotentials.js`)

同潛能結構(池獨立)。疊加規則亦同。
- 已有:weapon.120 / ring.100/110/120 / belt.120 / pendant.120
- 特殊 stat keys:`moveSpeed`、`jump`、`*PerLv10`

### Bonus Stats (星火) (`useEquipment.js`)

- `BONUS_STATS_KEYS = [str, dex, int, luk, atk, matk, bossDmg, dmgPct, allStatPct]`
- `NO_BONUS_TYPES = { ring, shoulder, secondary, emblem, badge }` — 完全不支援
- `WEAPON_ONLY_KEYS = { bossDmg, dmgPct }` — 只有武器能有
- `allowedBonusStatKeys(item)` / `supportsBonusStats(item)`

### 套裝 (`src/constants/itemSets.js`)

```js
{ id, nameKey, itemIds[], tiers: [{ count, stats }] }
```

累加式階層加成(觸發 9 件 = 3/5/7/9 件效果全部生效)。
已實作:`boss_accessory` 全階,itemIds 列出 19 件成員(目前 items.json 已有:Guardian Angel Ring / Noble Ifia's Ring / Silver Blossom Ring / Mechanator Pendant / Dominator Pendant / Golden Clover Belt / Pink Holy Cup)。

### Link Skill (`src/data/linkSkills.js` + `src/composables/useLinkSkills.js`)

- 資料庫:每個 skill 有 `owners / classGroup / uniqueByJob / specialEffect / ownMaxLevel / maxTotalLevel / levels[]`,可有 `flavorKey / caveatKey / selfDescKey`
- 職業 `jobs.js` 在 job 設 `linkSkill: 'xxx'`
- **規則**:
  - 同 ownerJob 不可重複連結
  - 同職業群(classGroup = 我的 branch)→ 疊加自身等級,**不佔 slot**
  - 不同職業群 → 佔 1 slot(slot cap 12,同 skill 多個 owner 合併後仍只算 1 slot)
- Applied Effect 左下面板:固定列出所有 active skill 的描述 + 統計(specialEffect 的跳過統計)
- Hover tooltip:自動翻轉、來源職業顯示(`linkSkill.fromJob`)、selfDescKey 切換(擁有者看自己版本)
- 已實作技能:`empirical_knowledge`(mage)、`thiefs_cunning`(thief)、`pirate_blessing`(pirate)、`invincible_belief`(warrior)、`adventurers_curiosity`(bowman,僅留 Critical Rate)、`cygnus_blessing`(5 人 Lv 上限 10)、`knights_watch`(mihile,self/linked 版本分開)、Heroes 六支(`combo_kill_blessing / rune_persistence / elven_blessing / phantom_instinct / light_wash / close_call`)

### NFT 圖鑑 (`src/constants/collection.js` + `useCollection.js`)

16 項屬性 × 各自 0-25 等,每項獨立可調:
- 大多線性(STR/DEX/INT/LUK 每級 +20、HP/MP +80、ATT/MATK +2、Damage/BossDmg/CritDmg/AbnormalResist 等 +1/級、Max HP/MP% +1%/級、Bonus EXP 等)
- **不規則曲線**:`ignoreDef`、`critRate`(`IRREGULAR_PCT_CURVE`:Lv1→1%、Lv2→2%、Lv3→4%… Lv25→38%)
- 儲存 `msucp.collection.v1`

### 聯盟戰地 (`src/constants/legion.js` + `src/constants/puzzle.js`)

Legion 分兩區,在 `LegionPanel.vue`:
- **左:戰地成員屬性** — 分分支列出,每位成員 `effects[5]` 依 tier(B/A/S/SS/SSS = 1-5),下拉切換
  - 主屬系(STR/DEX/INT/LUK)標 `fixed: true` → 計算機不吃 % 加成,直接加到 final
  - 條件型(Aran / Evan 攻擊回復)標 `specialEffect: true` → 不進計算機統計
- **右:拼圖屬性** — 16 條目(str/dex/int/luk/hp/mp/atk/matk 各 15 等;critRate/critDmg/ignoreDef/bossDmg/normalMobDmg/bonusExp/buffDuration/abnormalResist 各 40 等),直接輸入數字框即可
- 儲存:`msucp.legion.v1` / `msucp.puzzle.v1`

### 超技能 (`src/constants/hyperSkills.js` + `useHyperSkills.js` + `HyperSkillPanel.vue`)

- 5 點配點;9 選項 × 每項 1 點上限;`levelReq` 檢查角色等級
- 面板在角色頁最下方(`CharacterPage.vue` 尾端),3 欄分別對應 Poison Mist / Flame Sweep / Mist Eruption
- 點擊卡片 toggle;卡片樣態:未達等級 → `hyskill-card--locked`(半透明)、已點 → 金邊 `--picked`、超點或未解鎖 → `disabled`
- `effectsForSkill(skillId)` 聚合所有啟用中超技能的效果 bag,bag 欄位:
  - `damagePct`(主傷 %)、`burnDamagePct`(DoT %)、`burnDurationBonusSec`、`hitsPerCastBonus`、`ignoreDefPct`、`cooldownOwnPctRed`
- 目前 `useBattleSim` 已串接 → 僅 `flame_sweep` 立即生效(Poison Mist / Mist Eruption 之資料還未加入 `SIM_SKILLS`,選擇會存但暫不生效)
- 火毒已實作 9 支;其他職業 `jobs: []` 過濾即可擴充
- 儲存:`msucp.hyperSkills.v1`

### Hyper Stat (`src/constants/hyperStat.js` + `useHyperStat.js`)

- 解鎖 Lv140;`hyperPointsAtLevel(lv) = Σ floor((k-140)/10)+3`
- 每級固定 cost:`[1,2,4,8,10,15,20,25,30,35,50,65,80,95,110]`
- STR / DEX / INT / LUK 標 `fixed: true`(不吃 % 加成)
- 非線性曲線:Critical Rate、Boss Damage、Normal Mob Dmg、Abnormal Resist、Bonus EXP
- 儲存:`msucp.hyperStat.v1`

### 秘法符文 ARC (`src/constants/arcaneSymbols.js` + `useArcane.js`)

- 6 個符文(Vanishing Journey / Chu Chu Island / Lachelein / Arcana / Morass / Esfera),各 0-20 級
- Lv1: ARC +30,主屬 +300;之後每級 +10 ARC、+100 主屬
- 主屬加成為 **fixed flat**(不吃 % 加成),CP 計算機每符文單獨列一條來源
- 儲存:`msucp.arcane.v1`

### 寵物 (`src/constants/pets.js` + `usePet.js`)

- Multi Pet 隻數加成(`PET_COUNT_BONUS`)+ 寵物裝備加成(每件 `PET_EQUIPMENT_BONUS` ATT/MATK)
- ATT/MATK flat,**吃 % 加成**
- 寵物獨立於 SKILL/BUFF,**計入 CP**
- 儲存:`msucp.pet.v1`

### 內潛 ABILITY (`src/constants/innerPotential.js` + `useInnerPotential.js`)

- 3 排屬性(`INNER_POTENTIAL_LINES = 3`),每排 = 下拉 + 對應欄位輸入
- 選項 schema:`{ id, nameKey, fields: [{ statKey, max, isPct? }], fixed?, specialEffect? }`
- 約 47 個選項涵蓋:單屬 / 雙屬 12 排列 / 四屬合一 / HP·MP 系列 / ATT·MATK 系列 / 防禦力 flat & % / 跳躍·移速 / 每 N 等 +1 ATT·MATK / 爆擊 / 攻擊速度 / Boss·一般·異常怪物傷害 / 追加防禦傷害 / Buff 持續 / 掉寶·楓幣 / 被動技能 +1 / 攻擊目標 +1 / 4 個按 % 互轉 / 機率忽略冷卻
- **雙屬 / 多屬**:每個 `field` 一個獨立輸入框
- `specialEffect: true` → 不顯示輸入框、不貢獻 CP
- `fixed: true`(主屬 / 全屬)→ 不吃 % 加成
- **CP 串接**:全屬 → str/dex/int/luk 同時 fixed flat;其他依 PCT_KEYS 分流
- 中文「內潛」/ 英文 **ABILITY**(`vmatrix.title` 等)
- 儲存:`msucp.innerPotential.v1`

### V 矩陣 (`src/constants/vmatrix.js` + `useVMatrix.js`)

- 通用 V 技能 + 職業專屬;`VMATRIX_MAX_LEVEL = 30`
- Schema:`{ id, nameKey, imageUrl, jobs?, branch?, passive? }`
  - `passive.type`:`'allStat'` / `'attMatk'` / `'stat'`(+`statKey`)
  - `passive.per`:每 N 等 +1(`per=1` 即每等 +1)
  - **`passiveValueAt(skill, lv) = ceil(lv / per)`** — Lv1 就有 1 點;Lv6 (per=5) 變 2
  - 沒 `passive` → 面板隱藏(技能名仍存於資料,可填等級但無效果)
- `jobs?` / `branch?`:限定職業可見+貢獻(例 Unreliable Memory 僅 archmageFP/IL/bishop)
- **CP 串接**:全屬 / ATT·MATK / 單一屬性都走 flat,**吃 % 加成**(非 fixed)
- 已實作技能(11 通用 + 1 法系專屬):
  - 通用:Rope Lift(全屬 per=1)、Decent Mystic Door / Sharp Eyes / Hyper Body / Advanced Blessing / Speed Infusion(全屬 per=5)、Blink(ATT/MATK per=1)
  - 無被動隱藏:Decent Combat Orders / Erda Nova / Will of Erda / Decent Holy Symbol
  - 冒險家法師(`archmageFP/IL/bishop`):Unreliable Memory(INT per=1)
- 圖示來源:`https://media.maplestorywiki.net/yetidb/Skill_<Name>.png`(部分 Decent 共用原技能圖)
- 中文技能名稱保留英文(不翻譯)
- 儲存:`msucp.vmatrix.v1`

### CP 計算機 (`src/pages/CpCalculatorPage.vue`)

**breakdown 管線**(依順序把所有來源收斂到每個 stat key 的 `{ flat: [], pct: [] }`):

1. 角色 base(主屬 Lv 公式、HP/MP、critRate 保底 5%)
2. 已裝備裝備:**每件內部先合併**(base + star + bonusStats + potentials + bonusPotentials;`*PerLv10` 展開為 floor(charLv/10)×值 併入 flat;`ignoreDef / damageTaken` 屬 `MULTIPLICATIVE_KEYS` 在裝備內用 `1-Π(1-x/100)` 合併),最後對每個 stat key **只發一條「{裝備名} +N」** 的來源
3. 套裝加成:觸發的所有 tier 屬性合計 → 單一來源 `套裝:{name}({count} 件)`
4. 稱號(TITLE,toggle,只能 1 個啟用)
5. 技能 SKILL:
   - 共通開關型(Will of the Alliance / Blessing of the Fairy ↔ Empress's Blessing ...)
   - 被動職業技能(`passive: true`,依 `jobs` + `contribute(ctx)` 自動生效,ctx 含 `jobKey / weaponSubType / characterLevel / skillLevelBonus`)
   - 群組互斥 `group`(同群只能啟用一個,如 blessing)
6. Buff(BUFF 面板開關;`jobs?` 限定職業可見;`skillLevelBonus` 會加到 passive skill 的 effectiveLevel 例 Arcane Aim / Buff Mastery 因 Combat Orders +1)
7. NFT 圖鑑 `collectionContribs`
8. 聯盟拼圖 `puzzleContribs`
9. Hyper Stat `hyperStatContribs`(STR/DEX/INT/LUK 為 `fixed: true`)
10. 聯盟成員 `legionContribs`(主屬為 `fixed: true`)
11. 秘法符文 `arcaneContribs`(主屬 fixed flat,每符文一條來源)
12. 內潛 `abilityContribs`(全屬 → str/dex/int/luk fixed flat;單屬亦 fixed;其餘依 PCT_KEYS 分流)
13. V 矩陣 `vmatrixContribs`(全屬 / ATT·MATK / 單屬 都走 flat,**吃 % 加成**)
14. Link Skill `activeSkillContributions`(僅非 specialEffect)
15. 寵物 `petCountBonus / petEquipBonus`(ATT/MATK flat)

每筆 entry 內含 `cpExclude` 旗標(`addFlat / addPct` 第 4/3 參數)— SKILL / BUFF / V Matrix / Link Skill 預設 `true`,**不計入 COMBAT POWER**。例外允許名單 `CP_SKILL_ALLOWLIST` = { `blessing_of_the_fairy`, `empress_blessing` };寵物天然在獨立 block,不受影響。

**PCT_KEYS**:`bossDmg / ignoreDef / allStatPct / dmgPct / atkPct / matkPct / hpPct / mpPct / strPct / dexPct / intPct / lukPct / critRate / critDmg / finalDmg / buffDuration / damageTaken / elementalResist / summonDuration / cooldownReduction / normalMobDmg / bonusExp`

**MULTIPLICATIVE_KEYS**:`ignoreDef / damageTaken` — 走 `1 - Π(1 - Xᵢ/100)`。Tooltip 會隱藏「基本 / %數」摘要(因相乘疊加不適用加總)。

**breakdownFor**(hover tooltip):
- 主屬(STR/DEX/INT/LUK)額外納入 `<stat>Pct / allStatPct / allStat`(`allStat` flat 併入 flat 陣列;同裝備的 `<stat>Pct` + `allStatPct` 會**依 label 合併**成一條)
- `final = floor(normalFlatTotal × (1 + pctTotal/100)) + fixedFlatTotal`(非 % stat)
- 相乘型:`1 - Π(1 - Xᵢ/100)`,damageTaken 保留負號
- 純 % stat:`flatTotal + pctTotal`
- Tooltip 顯示:`flatTotal / fixedFlatTotal(有 fixed 來源才出現)/ pctTotal` 三列摘要;Base / Fixed / % Sources 三段明細;最後 Total
- Label 允許自動換行(`white-space: normal`),值保留單行對齊右

### ATT STATS(`CpCalculatorPage.vue`)

`JOB_ATT_META[jobKey]` 含 `weapons / weaponConst / mastery / usesMatk`;傷害公式:

```
base   = (4 × 主屬 + 副屬) × ATT/100 × 武器常數
fm     = 1 + Final Damage% / 100              ← 獨立乘區

basic  = base × (1 + Damage%/100)                          × fm
normal = base × (1 + (Damage% + Normal Mob Dmg%)/100)      × fm
boss   = base × (1 + (Damage% + Boss Dmg%)/100)            × fm
```

- 一般 / 首領 與 Damage% **相加**(同一個括號內);Final Damage 為**獨立乘區、相乘**
- **熟練度移除**自 basic / normal / boss(僅 tooltip 顯示),改為僅影響「實際傷害 min」
- 法系自動切 MATK(`usesMatk`)
- 顯示 `Math.round` 為整數
- Hover ATT STATS cell tooltip 內容:武器列表 → 武器常數 → 熟練度 → 基本/一般/首領 → **實際傷害 (boss) Min/Avg/Max**

#### 實際傷害 (boss) — 僅套用爆擊與熟練度

```
crit_max  = 1.50 + 爆擊傷害%/100
crit_min  = (1.20 + 爆擊傷害%/100) × 熟練度/100

bossMax   = boss × crit_max
bossMin   = boss × crit_min
bossAvg   = (bossMax + bossMin) / 2
```

- **首領屬性耐性不在 CP 頁套用**;已改由 **戰鬥模擬器**依「怪物屬性耐性設定 × 職業無視屬性」計算
- 對火毒 Flame Sweep(元素:fire)打「減半」首領 + 10% 無視屬性:`elemMult = 1 − 50×0.9/100 = 0.55`
- 非屬性技能(`skill.element` 為空)→ `elemMult = 1`

### COMBAT POWER 公式

頂部金色 banner 顯示 CP 整數值;`?` 按鈕展開 Zone Breakdown 下拉。

**6 個乘區**(`cpZones` computed):

```
Zone 1 = (4 × 主屬 + 副屬) / 100
Zone 2 = ATT (僅 flat,不吃 % 加成)            ← 法系自動換 MATK
Zone 3 = 1 + ATT% / 100
Zone 4 = (135 + 爆擊傷害%) / 100
Zone 5 = (100 + Damage% + Boss Damage%) / 100
Zone 6 = 終傷乘區 (目前裝備來源未實作)         → 1

差值  = round(ATT × Zone3, 2dp) − floor((ATT − 69) × Zone3)
Z2Z3  = Zone2 × Zone3 − 差值                  ← 在 Zone2 × Zone3 後扣

CP    = floor(Zone1 × Z2Z3 × Zone4 × Zone5 × Zone6)
```

- `WEAPON_COEFFICIENT_DELTA = 69`(同等級/同星等/同星火裝備之間的攻擊力差,暫固定)
- 所有取值用 `statTotalForCp(key)` / `flatTotalForCp(key)` / `pctTotalForCp(key)` — 過濾 `cpExclude` 來源
- 主屬吸收 `<stat>Pct` + `allStatPct` + `allStat` flat 的 cpExclude 過濾版

### CP 比較欄(`cp-compare`,左側 aside)

- COMBAT POWER banner「儲存」按鈕 → 把當下 `bossMax / bossAvg / bossMin` 加入快照(最新在最上)
- 每筆 row:時間(`YYYY-MM-DD HH:MM`)+ 三列數值 + 與當前差異 `Δ%`(2 位小數;綠↑/紅↓/灰持平)
- `×` 移除單筆;頂端「清空」按鈕清全部(有資料才出現,需 confirm)
- 持久化於 `msucp.cpCompare.v1`,已加入 `DATA_KEYS`(會被 export/import)

## 戰鬥模擬 (`/battle`, `BattlePage.vue`)

以實時 `requestAnimationFrame` 逐秒推進,所有傷害從 CP 計算頁的 `attStatsInfo`(透過共用 `useCpDamage` composable)取得。

### 共用 composable
- `useCpDamage` — 從 CpCalculatorPage 抽出的 breakdowns / statTotal / attStatsInfo / cpZones,由 CP 頁與戰鬥模擬兩邊共享
- `useCpToggles` — Buff / Skill / Title 啟用 Set(兩頁共用,localStorage 同步)
- `useBattleBuffs` — 實戰 buff 層數狀態(session-only,不持久)
- `useDotTracker` — 場上生效 DoT 數(`burnState` 長度寫入)
- `useEnemySettings` — ENEMY SETTINGS (type / level / defense / elementalDmg / bossArc),持久化於 `msucp.enemy.v1`
- `useBattleSim` — 模擬主控(state、tick、start/stop、simulateSingleCast)

### 已實作技能(archmageFP)
| id | type | 簡述 | 備註 |
|---|---|---|---|
| `flame_sweep` | attack | 7 擊 + 5s DoT (1s tick),Lv30 220%/240% | 專屬 VM(+2%/Lv);無 cooldown、priority 0(filler);`combatOrdersEligible`|
| `flame_haze` | attack | 15 擊 + 10s DoT,Lv30 202%/200%,CD 10s | 專屬 VM;priority 100;`onHitSpawn: ['poison_mist']`;`combatOrdersEligible` |
| `mist_eruption` | attack | 2 爆炸 × 10 擊 + 0 DoT,Lv30 125%,CD 10s | 專屬 VM;priority 80;`requiresField: 'poison_mist'`;`onHitResetCooldown: ['flame_haze']`;爆炸終傷表 + 條件式 CD -2s;`combatOrdersEligible` |
| `teleport_mastery` | **aura** | 單擊 + 20s DoT (2s tick),Lv10 272%/98% | **無 CD**、sim 用 aura 型固定週期排程:`firstHitWindowSec: [0, 0]`(t=0 開打)+ `intervalSec: 30`(每 30s 重施以延續 DoT;DoT 40s 足以覆蓋);不鎖其他、不被鎖 |
| `inferno_aura` | aura | 每 3s 觸發 2 擊 + 30s DoT,Lv1 400%/500% | 開場 0-3s 內隨機;不進 priority cascade |
| `ifrit` | aura | 每 3s 觸發 3 擊 + 2s DoT,Lv30 150%/140% | 開場 0-3s 內隨機;被動 Mastery +70% 尚未接入 CP;`combatOrdersEligible` |
| `poison_mist` | derived | 直擊 + 6s DoT,Lv20 270%/240% | 不自排程,由 Flame Haze `onHitSpawn` 衍生;`fieldDurationSec: 15` 供 Mist Eruption 檢查 |
| `meteor_shower` | passive | Final Attack — 角色任何主擊時 roll 1 次(爆炸技能 = `explosionCount` 次),Lv30 60% × 220% × 1 擊(火屬) | 不主動施放、不觸發自身;`skill.finalAttack: { procRate, damage }` 每級 +2%/+4%;成功 proc 走 `mainHitDmg` 主擊管線;`combatOrdersEligible` |
| `ignite` | passive | 火屬技能施放時 Lv10 50% proc 生成火牆 — 6s 持續、每 2s 觸發一次傷害 (40% × 3 下) × 3 ticks | 排除 Inferno Aura;Meteor Shower proc 也算火屬事件 → 會觸發 Ignite;火牆獨立疊加;每 tick `useCount +1`;專屬 VM(+4%/Lv);**非 4 轉 → 無 Combat Orders** |

### 被動(不進 SIM_SKILLS;模組直接 import)
| id | 效果 | 備註 |
|---|---|---|
| `BURNING_MAGIC` | 場上 `activeDotCount ≥ 1` → 主擊終傷 +20%;DoT 時長 ×2 | 僅火毒;DoT tick 不吃 FD 加成,但吃時長倍率 |

### 技能資料模型 (`src/constants/skills/archmageFP.js`)
```js
{
  id, name, nameKey, descriptionKey, imageUrl, color, jobs: ['archmageFP'],
  element: 'fire',               // fire / poison / ...;空值 = 無屬性
  type: 'attack',                // attack(一般可施放) / aura(固定間隔自動) / derived(不自排程) / passive(不出現在 scheduler,純 proc 效果)
  baseLevel: 30,                 // sim 預設等級
  combatOrdersEligible: true,    // 4 轉技能 → useCpToggles().isBuffActive('combat_orders') 為 true 時 effSkillLevel +1
  hitsPerCast, maxEnemies,
  damage: { base, perLevel },    // 主擊 % 線性成長
  burn: { base, perLevel, durationSec, tickIntervalSec },  // DoT;所有有 burn 的技能都登記進 burnState → 算入 activeDotCount
  castDelayBySpeed: { 7, 8 },    // 對應攻速階級的動畫延遲 (ms);0 = 不鎖其他主動技能
  cooldown,                      // 秒;選填。無 cooldown → 只受 animDelay 間隔
  priority,                      // 開場 cascade 排序:高→先 (Flame Haze 100 / Mist Eruption 80 / 其他 0)

  // ── 進階欄位 ──
  vmatrix: { maxLevel, finalDmgPerLevel, ignoreDefBonus: { threshold, value } }, // 專屬 V 矩陣(需同時加入 constants/vmatrix.js 的 skillSpecific 項)
  cooldownPriorityRedSec,                // Step 1 絕對秒扣除
  cooldownPriorityThreshold,             // 搭配上面 — 僅當 activeDotCount ≥ threshold 才套用
  cooldownOwnPctRed,                     // Step 2a 自身百分比減免
  cooldownExternalPctUsesBaseAsFlat,     // Mist Eruption 特例:外部 % 以 baseCd 換 flat 秒

  // Aura 型(type: 'aura')
  aura: { intervalSec, firstHitWindowSec: [min, max], defaultEnabled },
  // Derived 型(type: 'derived')
  fieldDurationSec,                      // 登記到 fieldState[id].expireAt,供 requiresField 檢查

  // 命中副作用
  onHitSpawn: ['skillId', ...],          // 命中時同 tCast 一併 emitCast 衍生技能 (例 Flame Haze → Poison Mist)
  onHitResetCooldown: ['skillId', ...],  // 命中時 *遊戲 CD* 立即清零;scheduler 仍會被本次 animDelay 鎖住,由 cast lock 統一控制
  requiresField: 'skillId',              // 需場上有該技能 field 才能施放(未滿足 → nextCastAt += 200ms 等待重試)

  // 爆炸型(Mist Eruption)
  explosions: { count: 2 },                              // 固定爆炸次數;總擊數 = hitsPerCast × count;useCount += count
  finalDmgByExplosions: { 2: 20, 3: 45, 4: 80, 5: 125 }, // key = 目標身上 DoT 層數 → 終傷 %(< 2 → 0%;>最大 key → 取最大值)

  // Meteor Shower 專用(type: 'passive')
  finalAttack: {
    procRate: { base, perLevel }, // % 每級線性
    damage:   { base, perLevel }, // % 每級線性
  },

  // Ignite 專用(type: 'passive')
  ignite: {
    procRate: { base, perLevel }, damage: { base, perLevel },
    tickIntervalSec, durationSec, hitsPerTick,
  },
}
```

`effSkillLevel(skill)` = `state.skillLevels[id] (或 baseLevel) + (combatOrdersEligible && Combat Orders 啟用 ? 1 : 0)`;所有 `skillDamagePct / skillIgnoreDefPct / skillFinalAttackPcts / skillIgnitePcts` 都透過它讀等級。

### 施放排程 / cast lock (`useBattleSim` tick 核心)

每回合用「earliest-ready + priority tiebreak」選一支技能 fire,而非平行 for-loop。fire 後:
- **主動型**(type 非 `'aura'` 非 `'derived'`):更新自身 `nextCastAt = tCast + max(animDelay, effCd)`,**同時把其他所有主動技能的 `nextCastAt` 推到 ≥ `tCast + animDelay`**(global cast lock)
- **Aura 型**:只更新自身 `nextCastAt = tCast + intervalSec × 1000`,**不鎖其他、也不受鎖影響**
- **Derived 型**:永不直接排程,只靠 `onHitSpawn` 觸發

**Opener priority cascade**(`start()`):依 `priority` 遞減,累加每支 animDelay 作為前序等待時間,避免開場第一個 tick 齊發。例(攻速 8):
```
Flame Haze  (priority 100, anim 900ms)  → 900ms
Mist Eruption (80, 720ms)                → 1620ms (但因需 Poison Mist field,會等到 Flame Haze 命中衍生 mist 後才能真正 fire)
Flame Sweep (0, 600ms)                   → 2220ms (filler)
```

**Aura 首次觸發**:`firstHitWindowSec: [min, max]` 範圍內隨機,與 priority cascade 獨立。Teleport Mastery 使用 `[0, 0]` 開場立即施放;Inferno Aura / Ifrit 用 `[0, 3]`。

### PRNG(`makeRng`)
- **mulberry32**(32-bit hash-based)取代原 Numerical Recipes LCG — LCG 在固定 seed + 固定 stride 下會有明顯 bias(例:seed=42 + Flame Sweep 約 18 rng/cast 的採樣節奏,proc roll 平均落在 0.7+)
- `state.seed` 預設 `Date.now() >>> 0`:每次 reload 新 seed,同一個 load 內 start/stop 重跑會得到同樣的序列。用 `setSeed(n)` 可強制重現。

### 傷害公式(useBattleSim)

**主擊**
```
bossMin ≤ bossBase ≤ bossMax   ← 先以 buff Damage%(法師傳授)併入 CP Damage% 後重算
hit = bossBase × (主技%/100) × elemMult × arcMult × skillFinalMult × buffFinalDmgMult
      × defMult × explosionMult × bmMult × levelDiffMult
```
- 爆擊與熟練度已內化進 `bossMin / bossMax` 取樣,不另外疊 variance(原 `skill.variance=0.15` 欄位已移除)
- `bmMult` = Burning Magic(`activeDotCount ≥ 1` → ×1.20;職業限 `archmageFP`)
- `levelDiffMult` = 等差終傷(角色等級 − 怪物等級,`levelDiffFinalDmgPct` 查表)— 僅主擊套,DoT 不套

**DoT**(獨立管線,與主擊完全切割)
```
dot = baseRaw × (DoT%/100) × skillFinalMult × dotSpecialMult × dotEnemyMult × arcMult × DOT_COEFFICIENT
```

- `baseRaw` — `att.baseRaw` = 武器係數 × (4×主屬+副屬) × ATK(計算 % 後)/100,直接取自 CP 面板
- `skillFinalMult` — 技能專屬 V 矩陣終傷(`1 + vm.finalDmgPct/100`)
- `dotSpecialMult` — **DoT 專用特殊終傷**,目前唯一來源 = 火毒 Fervent Drain 疊層(每層 +5%,max 5 層,同技能層相加後轉乘區),由 `useBattleBuffs.dotSpecialFinalMult()` 提供
- `dotEnemyMult`(`dotEnemyMult(enemy)`):
  - 一般怪物 → `1.00`
  - Boss + `elementalDmg='full'`(未減半)→ `1.86`
  - Boss + `elementalDmg='half'`(減半)→ `1.41`
  - Boss + `elementalDmg='none'`(免疫)→ `0`
- `DOT_COEFFICIENT` — 模組級常數(`useBattleSim.js`),目前固定 **1.5**,所有 DoT tick 直接乘進去,僅 DoT 吃;主擊完全不受影響

**DoT 一律不吃**:面板終傷 (fm) / CP Damage% / Buff Damage% / 超技能 `burnDamagePct` / Boss Damage% / 屬性減傷 (`elemMult`) / 其他 buff 最終傷害(Infinity 等 activeToggle)/ Burning Magic FD / 等差終傷 / 怪物 DEF / 爆擊 / 熟練度
**DoT 有吃**:ARC 終傷(`arcMult`,隨主擊一起);DoT 時長另有 Burning Magic ×2 倍率
**DoT 時長快照**:`(base + hyper flat) × burningMagicDotDurationMult()` 於 `emitCast` 建立 DoT 時寫入 `burnState[id].expireAt`

**DoT 傷害快照(sticky)**:`emitCast` 建立新 DoT 時以當下面板計算 `dotDmg` 並存入 `burnState[id].dmg`;只要這段 DoT 還沒過期,即使中途:
- Fervent Drain 層數改變 / VM 等級改變 / 技能等級改變 / 面板 Damage% 變動
- 重新施放同一個技能接續時間(refresh `expireAt`)

**傷害都不會重算**。只有 DoT 自然結束後被刪除,下次再觸發才會以當下面板重新快照。`processBurnTicks` 讀取 `bs.dmg`(保留 fallback 以避免舊狀態遺漏)。

### 各乘區來源

| 乘區 | 套用於 | 來源 | 型態 | 備註 |
|---|---|---|---|---|
| `elemMult` | 主擊 | skill.element × enemy.elementalDmg × 職業無視屬性 | 單一 | `ENEMY_ELEM_RESIST_PCT × ELEM_IGNORE_BY_JOB`;DoT **不吃**(已被 `dotEnemyMult` 取代) |
| `arcMult` | **主擊 & DoT** | 秘法符文 ARC 比值對照 | 單一 | 玩家ARC / 怪物ARC 查表 → `finalDmg %` |
| `skillFinalMult` | 主擊 & DoT | 技能專屬 V 矩陣 | 單一 | 例:Flame Sweep / Haze / Mist Eruption / Ignite × Lv × 其 `finalDmgPerLevel` 終傷(Ignite +4%/Lv;其餘 +2%/Lv);Lv40+ 再 +20% 無視防禦(僅主擊意義) |
| `explosionMult` | 主擊 | Mist Eruption 爆炸終傷 | 單一 | `finalDmgByExplosions[DoT 層數]` 查表;DoT **不吃** |
| `buffFinalDmgMult` | 主擊 | 實戰 buff 最終傷害 | **不同 buff 互乘,同 buff 層加** | Infinity time-ramp;DoT **不吃** |
| `bmMult` | 主擊 | Burning Magic | 單一 | `activeDotCount ≥ 1 && currentJobKey ∈ BURNING_MAGIC.jobs` → ×1.20,否則 ×1.00;DoT 主傷害不吃(但 DoT 時長吃 ×2) |
| `levelDiffMult` | 主擊 | 等差終傷 (`levelDiffFinalDmgPct`) | 單一 | 角色等級 − 怪物等級查表;+5 封頂 +20%、-40 封底 -100%;DoT **不吃**(DoT 有獨立的等差減傷機制,sim 未實作) |
| `dotSpecialMult` | DoT | DoT 專用特殊終傷 | 單一 | 目前唯一:Fervent Drain 疊層 ×(1 + n×5/100);其他 buff 不貢獻 |
| `dotEnemyMult` | DoT | 怪物類型 | 單一 | normal=1.00 · boss-full=1.86 · boss-half=1.41 · boss-none=0 |
| `DOT_COEFFICIENT` | DoT | 模組常數 (`useBattleSim.js`) | 單一 | 固定 1.5;所有 DoT 都乘,主擊不吃 |
| `buffDmgMult`(合入 Damage%) | 主擊 | 實戰 buff 的 Damage% | 與 CP Damage% 相加 | 例:Arcane Aim 5 層 → +40% Damage;DoT **不吃** |
| `hyperDmgPct`(合入 Damage%) | 主擊 | 超技能 `damagePct` | 與 CP Damage% 相加 | **不乘進技能 %**;`burnDamagePct` 目前無作用(DoT 不吃) |
| `defMult` | 主擊 | 怪物 DEF × 有效無視 | 相乘疊加 | CP × VM × buff × hyper × 技能自帶 `ignoreDef`;DoT **無視防禦** |
| `fm` | 主擊 | CP Final Damage% | 已併入 basic / boss | DoT **不吃** |

### Buff 系統 (`useBattleBuffs` / `constants/battleBuffs.js`)

每筆 buff 有 `source`:
- `linkSkill` → 動態查 `combinedLevelFor + bestLevelDataFor` 取得當前等級的 stats (procRate / maxStacks / duration / damagePerStack / ignoreDefPerStack);用 rollTriggers 依 procRate 抽層
- `passive` + `passiveType: 'dotCount'` → 層數 = `min(maxStacks, activeDotCount)`
- `passive` + `passiveType: 'procOnHit'` → 同 linkSkill 抽層方式,但用 buff 自帶 procRate
- `activeToggle` → 戰鬥開始後自動循環施放(Infinity);CD 吃一般 CD 減免(% + 帽子 flat,走 `computeEffectiveCooldown`)
- `linkCycle` → level / stats 從 LinkSkill 系統取(duration / cooldown / damage),自動循環或事件觸發;**不吃 Buff Duration% 與 CD 減免**;可選 `triggerOn: 'debuffApplied'` 改為事件驅動

**目前已實作**
- `empirical_knowledge`(法師傳授 / Adventurer Mage link skill)— 用 link skill 現有 i18n 與圖示;Lv1–6 依連結結果;`appliesDebuff: true`(成功 proc 視為對怪上 debuff)
- `fervent_drain`(火毒被動 / Elemental Drain icon)— 每層 +5% 最終傷害,max 5 層
- `arcane_aim`(法系 4 轉被動,`passiveType: 'procOnHit'`)— 攻擊時 100% 抽 1 層,max 5 層,5 秒內每次疊層刷新計時;每層 +8% Damage(疊入 CP Damage%)。20% 無視防禦已在 CP 面板 `SKILLS` 計入,這裡只補疊層 Damage
- `infinity`(火毒 4 轉 buff,`source: 'activeToggle'`)— 戰鬥模擬「開始」後 450ms(攻速 8)自動施放,冷卻 180s(吃 CD 減免)後自動再施放
  - 等級 = `baseLevel`(30)+(Combat Orders 啟用 ? 1 : 0)→ Lv30/31
  - 起始 FD = `70 + (level - 30)`%;每 `tickIntervalSec=5` 相加 `tickIncreasePct=3`%(buff 內線性累加,與其他 buff 仍互乘)
  - 持續時間 = `(40 + (level - 30))` × `(1 + buffDuration%/100)`(讀 `useCpDamage().statTotal('buffDuration')`)
  - 時間基準 = `state.elapsedMs`;戰鬥停止 / 重置一併清空
- `thiefs_cunning`(暗器的精髓,`source: 'linkCycle'` + `triggerOn: 'debuffApplied'`)
  - 等級 / stats 從 link skill 系統取:Lv1 +3% Damage、Lv6 +18% Damage;duration 10s、cooldown 20s
  - 觸發條件:`empirical_knowledge` 成功 proc(`appliesDebuff: true`)→ off-CD 才啟動
  - Damage% 啟動中併入主擊 Damage 桶(與 CP Damage% 相加,DoT 不吃)
  - CD 從啟動瞬間算(duration 10s 結束後還需等 10s 才能重觸發)
  - **不吃 Buff Duration% / CD 減免**,不寫入時間軸(被動 buff)

**Buff 面板**(`BattlePage` 的 `.bp-buffs`,在 Enemy Settings 與統計列之間)
- 只顯示技能圖示(置右);0 層 → 灰階;≥1 層 → 亮色;≥2 層 → 右下角金字黑描邊層數
- 新疊層時 420ms 金光 pulse 動畫(watch `state.stacks[id].count` 上升)
- `.bp-buffs__timer`(左下,青字)— 當前剩餘持續時間;條件:`info.remainingMs > 0 && info.count > 0`(通用,所有 buff 皆顯示)
- `.bp-buffs__cd`(正中央,金字)— buff 結束、CD 進行中時疊在灰階圖示中間;僅 activeToggle / linkCycle 有

**最終傷害合成規則**:不同 buff 互乘,同 buff 層線性相加後轉為單一乘區
```
buffFinalDmgMult = Π over each buff [ 1 + (stacks × perStack) / 100 ]
例:A 3 層 × 3% + B 5 層 × 5% → (1 + 9/100) × (1 + 25/100) = 1.36
```

### 冷卻公式 (`computeEffectiveCooldown` in `useCpDamage.js`)

Step 順序嚴格:
1. 技能優先扣秒 (`skill.cooldownPriorityRedSec`,例:Mist Eruption DoT ≥5 個 -2s)
2. 百分比減免(乘法疊加):`skill.cooldownOwnPctRed`(超技能 -50%)× `externalPctRed`(聯盟 Mercedes)
   - 特例 `cooldownExternalPctUsesBaseAsFlat: true` → 外部 % 以 base CD 為基準換算為 flat 秒扣除
3. 帽子 flat (`hatFlatRedSec`):
   - 若前兩步後 **CD < 5s**:帽子完全不生效(保持當前值)
   - 若 **CD > 10s**:直接扣秒
   - 若 **5s ≤ CD ≤ 10s**:每 1s flat 轉 5% 減免
   - 最終 **≥ 5s 硬下限**

**誰走 `computeEffectiveCooldown`**:
- 所有一般技能(`skill.cooldown` 欄位)
- `activeToggle` buff(Infinity)— `useBattleBuffs.autoTick` 呼叫;`externalPctRed = att.cooldownReductionPct`、`hatFlatRedSec = att.cooldownReductionSec`
- **不走**:`linkCycle`(Thief's Cunning)直接用 link skill 原始 cooldown

### DoT 計數同步 (Mist Eruption 爆炸終傷 / CD 優先減免)

`useBattleSim.js` 的 `burnState` 一旦變動就 `syncDotCount()` → `useDotTracker.setActiveDotCount(Object.keys(burnState).length)`,確保:
- 同一 tick 內先 fire 的技能(如 Flame Haze → spawn Poison Mist,加 2 個 DoT)其 DoT 數立刻反映出來
- 後續 fire 的 Mist Eruption 在 `mainHitDmg` 讀 `activeDotCount` 時拿到**當下**的 DoT 數,`skillExplosionFinalDmgPct` 查表正確
- `tick()` 裡的 CD 優先減免(`activeDots >= cooldownPriorityThreshold`)也讀到當下 DoT 數,`-2s` 正確觸發
- 其他消費者(Fervent Drain 疊層)同步更新

**Mist Eruption 特例範例**(baseCd 10、-2s 優先、-50% 超技能、5% Mercedes、-4s 帽)
```
Step 1: 10 - 2 = 8
Step 2a: 8 × 0.5 = 4
Step 2b (特例): 4 - 10×0.05 = 3.5
Step 3: 3.5 < 5 → 帽子不生效
最終: 3.5s
```

### Meteor Shower Final Attack(`meteor_shower` passive)
- **觸發來源**:任何 emitCast 呼叫且來源技能 `hitsPerCast > 0` 且 `id !== 'meteor_shower'`;含 type `attack / aura / derived` 的主擊(Inferno Aura / Ifrit / Poison Mist 也算)
- **Rolls 數**:`skillExplosionCount(skill)`(一般 1、Mist Eruption 2)
- **Proc 公式**:`skillFinalAttackPcts(meteor, effSkillLevel(meteor))`,Lv30 60%/220% → Lv31 62%/224%(Combat Orders)
- **傷害管線**:`mainHitDmg(meteor, elem, enemy, att, fa.damage)` — 走主擊管線(含 elemMult / arcMult / VM / Buff / 防禦 / Burning Magic / 等差終傷);`variance` 不適用
- **useCount**:每顆成功 proc `+1`;`attackCount +1`
- **反向觸發**:Meteor Shower 的追打是 fire element → 會再 roll Ignite 一次(`maybeProcIgnite(meteor, tCast, res)` 掛在 meteor proc 成功分支)
- **Debug log**:`window.__METEOR_DEBUG = true` 啟用 console 輸出 roll/prob/result

### Ignite 火牆(`ignite` passive)
- **觸發來源**:emitCast 呼叫 + `skill.element === 'fire'` + `skill.id !== 'inferno_aura'`(Meteor Shower proc 成功也觸發)
- **火牆狀態**:模組級 `igniteWalls = [{ sourceSkillId, spawnAt, nextTickAt, expireAt, tickIntervalMs, tickPct, hitsPerTick }, ...]`,多次 proc 各自獨立疊加
- **Tick**:每 `tickIntervalSec=2` 造成一次傷害(Lv10 40% × `hitsPerTick=3` 下);3 ticks / 6s(+2s / +4s / +6s)
- **傷害管線**:`mainHitDmg(ignite, elem, enemy, att, tickPct)`(含 VM +4%/Lv、Lv40+ +20% 無視);**非 DoT,不進 burnState,Burning Magic DoT 計數不變**
- **useCount / attackCount**:每 tick `useCount +1`、`attackCount += hitsPerTick`(一面火牆全跑完 → 3 useCount / 9 attackCount)
- **非 4 轉技能** → 無 `combatOrdersEligible`;Lv10 固定封頂
- **處理時機**:`tick()` 內 `processIgniteWalls(elapsed, enemy, att)` 於 `processBurnTicks` 之後;tick 完清掉 `nextTickAt > expireAt` 的已結束火牆
- **Debug log**:`window.__IGNITE_DEBUG = true`;debug 面板同步出現在時間軸下方(`.bp-ignite-debug`)

### 等差終傷(`levelDiffFinalDmgPct`,`constants/enemySettings.js`)
- 角色等級 − 怪物等級 → 終傷 % 查表:+5 封頂 +20%、0 → +10%、-2 → 0%、-4 → -10%、-5 → -12.5%(之後每 -1 等差多 -2.5%)、-40 封底 -100%
- `useBattleSim` 每 tick 快照 `currentCharLevel / currentEnemyLevel`,`levelDiffMainMult()` 轉乘區並接入 `mainHitDmg` 尾端 mul 鏈
- **僅主擊**。DoT 有另一套(sim 未實作)

### ENEMY SETTINGS (`useEnemySettings`)
- Type(BOSS / 一般)、Level、Defense、Elemental DMG Taken(full/half/none)、Boss ARC
- ARC 比值查表(`ARC_RATIO_TABLE`)→ 終傷 / 被擊傷害;`finalDmg` 透過 `arcRatioLookup(playerArc, bossArc)` 得出 `%`

### 單次施放測試(`simulateSingleCast`)
- 按下「測試一下」→ 以當前 CP 數值 + buff 層數模擬一次施放
- **DoT 層數判定**:sim 執行中 → 實際 `burnState` key 數 +(此技能有 burn 且尚未登記時 +1);sim 非執行 → `skill.burn ? 1 : 0`
- 輸出 mainHits(= `hitsPerCast × explosionCount`)/ dotTicks(= `durationSec / tickIntervalSec`)/ 每個乘區數值 / 完整公式文字
- 公式列:`vmatrix` / `explosion`(僅爆炸型顯示)/ `hyper` / `buff` / `rebuild`(主擊 Damage 桶 + DoT Damage 桶分開)/ `main` / `defense` / `dot`

### 戰鬥頁時間軸(BattlePage 右欄)
- **只顯示主動施放的技能(`skill.type === 'attack'`)與 activeToggle 啟動事件**
  - aura(Inferno Aura / Ifrit)/ derived(Poison Mist)→ 隱藏
  - linkCycle(Thief's Cunning)屬被動 buff → `emitCast` 不把 `rollTriggers` 回傳的啟動 push 進 events
  - DoT tick → 本來就不推入 timeline
  - Ignite tick → 不推入 timeline(噪音太多)
- `type: 'buff'` — 來自 `useBattleBuffs.autoTick()` 回傳的 activations(例:Infinity 自動施放),金色方塊 + 金字
- 時間格式走 `fmtTimelineClock(ms)` → `MM:SS.XX`(去掉小時,精確到百分秒);summary 大時鐘仍用 `fmtClock(HH:MM:SS)`

### 技能詳情表的 useCount / attackCount 規則
- 一般技能每次 `emitCast` → `useCount += 1`、`attackCount += hits`(主擊每下一筆)
- 爆炸型(Mist Eruption)→ `useCount += explosions.count`(2),`attackCount += hitsPerCast × count`
- Meteor Shower proc 成功:`useCount +1 / attackCount +1`(單擊追加)
- Ignite tick(每 2s):`useCount +1 / attackCount += hitsPerTick`(每 tick 一次「使用」)
- **DoT tick**:僅 `attackCount += 1`,`useCount` 不動
- `avgPerCast = total / useCount`、`avgPerHit = total / attackCount`

### 衍生統計節流(`refreshDerived`)
- 只計算 `share / avgDmgPerSec / avgPerSec / avgPerCast / avgPerHit` 與 `totalDmg`(各技能 `total` 加總);raw counter(`total / useCount / attackCount / maxHit / minHit`)由 `emitHit / emitCast` 即時寫
- **節流**:每 1000 模擬毫秒才跑一次,避免面板跟著 rAF(≈60Hz)閃;`tick()` 條件 `elapsed - lastRefreshMs >= 1000 || elapsed >= totalMs`
- `stop()` 強制跑一次,確保停止當下看到最新值

### CD / 下次施放時間分離
- **`nextCastAt[id]`**(模組級 + `state.nextCastAt` reactive 快照)— scheduler 用,`max(animDelay, effCd)` 都寫進這裡,其他主動技能的 cast lock 也會改這個
- **`cooldownEndAt[id]`**(模組級 + `state.cooldownEndAt` reactive 快照)— **純遊戲 CD**,不含動畫鎖;`onHitResetCooldown` 會把它設為 `tCast`(立即 ready)。CD 面板只讀這個,確保 Mist Eruption 重置 Flame Haze 後面板馬上顯示 ready
- 兩個 map 在每個有 cast 變動的 tick 與 `start()` 以 `syncNextCastAt()` 同步到 reactive state

### 主動技能 CD 面板(`BattlePage` 的 `.bp-cds`,Buff 面板下方)
- 篩選:`SIM_SKILLS.filter(s => s.type === 'attack' && Number(s.cooldown) > 0)`(目前:Flame Haze / Mist Eruption;Teleport Mastery 已改 aura 排除)
- 讀 `state.cooldownEndAt[id] - state.elapsedMs`;Ready → 彩色 icon,CD 中 → 灰階 + 中央黃字倒數
- 統一時間格式 `fmtTimeRemaining(ms)`:<10s 一位小數(`9.3`)、≥10s 整數(`12`)、`≤0` 空字串 — 與 Buff 面板 `.bp-buffs__timer` / `.bp-buffs__cd` 共用

## UI 慣例

### Tooltip (`ItemTooltip.vue`)
- 浮動 `position: fixed`、`<Teleport to="body">`、跟隨滑鼠、邊緣自動翻轉(`offsetWidth`)
- 格式仿 MS:星力條 → 粉紅色名稱 → REQ → 職業列(僅武器/副手)→ 屬性列表(含 base + bonus + star 色彩)→ L 徽章 Potential / Bonus Potential
- **屬性顏色**:純 base = 白;有星力/星火 = 青;bonus 段綠;star 段青(總值 +N 仍藍)
- 英文名與中文名相同時只顯示一行
- **右側套裝面板**(若物件有所屬套裝):
  - 成員清單僅列出 items.json 已登錄者(未加入不顯示)
  - 穿上的成員 → 白字亮;未穿 → 灰字
  - 階層加成:觸發的 tier 白字亮、未觸發 → opacity 0.45、灰字 + 暗黃標題

### Star Bar (`StarBar.vue`)
- 每 5 顆一組、組間留白、每 3 組換行、不滿 3 組 `justify-content: center`
- 三種大小 `compact / normal / large`;`editableMax` 鎖上限

### Entry Editor (`EntryEditor.vue`)
- 分頁:Stars / Bonus Stats / Potential / Bonus Potential
- **不適用分頁直接隱藏**(ring 沒有 Bonus Stats → 不顯示該分頁;pocket 沒星力 → Stars 分頁隱藏)
- 草稿模式:`draft` + 確定寫回
- 星數上限:`min(item.maxStars, maxStarsForLevel(item.level), STAR_SETTABLE_CAP)`

### CP 計算機 側欄(`SKILL / BUFF / TITLE`)
- 每排固定 4 顆,超過自動換行
- 40×40 icon、金色高亮啟用中
- TITLE 互斥:同時只能啟用 1 個
- SKILL `group` 互斥:同群只能啟用 1 個(例 blessing = `blessing_of_the_fairy` ↔ `empress_blessing`)
- BUFF `jobs?` 限定可見(例 Meditation 只對 archmageFP 顯示)

### 背包格 / 裝備欄
- 圖+名、左上角 `★N` 徽章僅在 stars > 0 顯示
- Hover 顯示 ✎ 編輯 + × 移除
- Grid cols `minmax(0, 1fr)` 防撐開
- 選中槽位 → 黃色外框 + 背包自動過濾符合類型

### CatalogPicker(+ 新增 按鈕)
- Tooltip hover 僅綁在 thumbnail + info 範圍,**不含 Add 按鈕**(避免遮擋)

## 職業資料庫 (`src/constants/jobs.js`)

分支 / 職業 / 主屬 / `linkSkill?`:

- **beginner**:新手(str)
- **warrior**:英雄 / 聖騎士 / 黑騎士 → `invincible_belief`
- **magician**:火毒 / 冰雷 / 主教 → `empirical_knowledge`
- **bowman**:箭神 / 遊俠 / 開拓者 → `adventurers_curiosity`
- **thief**:夜使者 / 暗影神偷 / 影武者 → `thiefs_cunning`
- **pirate**:拳霸 / 槍神 / 重砲指揮官 → `pirate_blessing`
- **cygnus**:聖魂劍士 / 烈焰巫師 / 破風使者 / 暗夜行者 / 閃雷悍將 → `cygnus_blessing`
- **mihile**:米哈逸 → `knights_watch`
- **heroes**:狂狼勇士(aran)→ `combo_kill_blessing`;龍魔導士(evan)→ `rune_persistence`;精靈遊俠(mercedes)→ `elven_blessing`;幻影俠盜(phantom)→ `phantom_instinct`;夜光(luminous)→ `light_wash`;隱月(shade)→ `close_call`

`findBranchByJob(jobKey)` 取得 branch key。

## 數值精度 (`src/utils/numerics.js`)

為避免 IEEE 浮點誤差(0.1 + 0.2 = 0.30000000000000004),核心計算管線**一律**走此模組提供的 helper:

- `clean(x)` — 把 x 截到 1e10 精度(吃掉 < 1e-10 的漂移;不影響真實小數值)
- `add / sub / mul / div` — variadic,每一步輸出都 clean
- `sumBy(arr, fn)` — 陣列加總
- `applyPct(base, pct)` — `base × (1 + pct/100)` 乾淨版
- `combineIgnorePct(...pcts)` — `1 − Π(1 − xᵢ/100)`,回傳相對 %
- `floor(x) / ceil(x) / roundTo(x, decimals)` — 先 clean 再捨入

**規則**:
- 任何「加總多個 flat / pct 值」→ 用 `sumBy / add`
- 任何「一連串乘區」→ 用 `mul(...)` 或 `mulChain(...)`
- 任何「相乘疊加的無視/減傷」→ 用 `combineIgnorePct(...)`
- 顯示層(tooltip、formula)截位 → `roundTo(x, 2)` 或 `.toFixed(2)`
- **新增計算邏輯時,不要用原生 `+` `*`**(尤其是跨百分比與絕對值的邊界)。已遷移的模組:`useCpDamage.js` / `useBattleSim.js`;其他 composable 若要碰 % 算術也請一併改走 numerics。

## 超技能 Damage% 歸屬

超技能的 `damagePct` **加算到主擊 Damage% 桶**,不乘進技能 % 本身:

```
extraDmgPct (main) = Buff Damage% + Hyper damagePct
basic/boss = baseRaw × (1 + (CP Damage% + extraDmgPct)/100) × fm
hit        = bossBase × (skill.hit%/100) × ...  ← 技能 % 保持原值
```

**DoT 不吃 Damage% 任何來源**(新公式僅乘 V 矩陣終傷 × Fervent Drain × 怪物類型):
- `burnDamagePct`(超技能)、CP Damage%、Buff Damage% 都**不作用於 DoT**
- `burnDamagePct` 目前等於無效欄位(保留以免資料檔破壞;未來若加回 DoT Damage% 桶再啟用)

**影響**:
- Flame Sweep Lv30(220% 主、240% DoT)+ Reinforce (+10%) → 主擊:Damage% +10% 進 basic/boss(不改技能 %);DoT:+10% 完全不生效
- 命中數 / DoT 時長 / 無視防禦 / 冷卻 走各自的管線,不與 Damage% 合併

## 工作慣例

- **i18n**:所有字串放 `src/i18n/locales/zh-TW.json` + `en.json`;Bonus Stats / Potential / Rare / Epic / Unique / Legendary 等術語保留英文
- 新增或變更資料模型,`loadState()` 要 sanitize(向後相容)
- 驗證:`npx vite build` 需過,之後 `rm -rf dist`
- 不要在 UI 層做重計算 — 純衍生值放 composable 的 computed,資料層存 raw
- **禁止事項**:
  - 不再加 `rarity` 欄位
  - 背包格不可直接編輯星力(用 EntryEditor dialog)
  - 不在頁面底部做背景 tooltip 卡(用浮動 tooltip)
  - 每格子不顯示 `N/M` 計數

## Git

- remote:`https://github.com/jbjouo/MSUCP.git`
- main 為主分支
- 小修直 commit to main;新功能可開 `feat/xxx` 分支 + PR

## localStorage key 清單

| key | 用途 |
|---|---|
| `msucp.equipment.v3` | 裝備 entries + inventory + equipped |
| `msucp.character.v1` | 角色等級 / 職業 |
| `msucp.collection.v1` | 圖鑑等級表 |
| `msucp.legion.v1` | 戰地成員 tier |
| `msucp.puzzle.v1` | 拼圖屬性等級 |
| `msucp.hyperStat.v1` | Hyper Stat 配點 |
| `msucp.arcane.v1` | 秘法符文等級 |
| `msucp.pet.v1` | 寵物隻數 + 寵物裝備 toggle |
| `msucp.innerPotential.v1` | 內潛 3 排 (id + values[]) |
| `msucp.vmatrix.v1` | V 矩陣技能等級(含技能專屬 V 矩陣,如 flame_sweep Lv 0-60) |
| `msucp.linkSkills.applied.v3` | 已連結的 link skill(含法師傳授 empirical_knowledge) |
| `msucp.cpBuffs.v1` | Buff 開關狀態 |
| `msucp.cpSkills.v1` | Skill 開關狀態 |
| `msucp.cpTitles.v1` | Title 開關狀態 |
| `msucp.cpCompare.v1` | CP 比較欄快照陣列 |
| `msucp.enemy.v1` | 戰鬥模擬 ENEMY SETTINGS(type/level/defense/elementalDmg/bossArc) |
| `msucp.hyperSkills.v1` | 超技能配點(picked: string[]) |

**未持久化(session only)**
- `useBattleSim`(durationSec / attackSpeed / skillLevels)
- `useBattleBuffs`(stacks / expireAt)
- `useDotTracker`(activeDotCount)

> 資料匯出 / 匯入:`src/composables/useDataIO.js` 的 `DATA_KEYS` 陣列定義要走 export 的 keys。
> `EXPORT_VERSION = 2`(v1→v2 無 schema 遷移,只是新增 `msucp.enemy.v1` 與 V 矩陣內的 flame_sweep key;舊檔匯入會走 sanitize 預設)。
> 新增子系統時請同步維護該陣列 + 上表 + `EXPORT_VERSION`(若欄位有相容性問題)。
