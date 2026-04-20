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

### 技能資料模型 (`src/constants/skills/archmageFP.js`)
```js
{
  id: 'flame_sweep',
  nameKey, imageUrl, color, jobs: ['archmageFP'],
  element: 'fire',               // 空值 = 無屬性
  baseLevel: 30,
  hitsPerCast: 7,
  maxEnemies: 8,
  damage: { base: 220, perLevel: 3 },            // 主擊 %(每級 +3)
  burn: { base: 240, perLevel: 4, durationSec: 5, tickIntervalSec: 1 },  // DoT
  castDelayBySpeed: { 7: 660, 8: 600 },
  variance: 0.15,
  // V 矩陣專屬 (不進 CP 面板,僅此技能吃)
  vmatrix: { maxLevel: 60, finalDmgPerLevel: 2, ignoreDefBonus: { threshold: 40, value: 20 } },
  // 冷卻欄位 (選填;Flame Sweep 無 cooldown)
  cooldown: 10,
  cooldownPriorityRedSec: 2,      // Step 1
  cooldownOwnPctRed: 50,           // Step 2a
  cooldownExternalPctUsesBaseAsFlat: true,   // Mist Eruption 特例
}
```

### 傷害公式(useBattleSim)

**主擊**
```
bossMin ≤ bossBase ≤ bossMax   ← 先以 buff Damage%(法師傳授)併入 CP Damage% 後重算
hit = bossBase × (主技%/100) × elemMult × arcMult × skillFinalMult × buffFinalDmgMult × defMult × variance
```

**DoT**(不吃爆擊 / 不吃 BossDmg / 無視防禦 / 固定值)
```
basic = baseRaw × (1 + (CP Damage% + buff Damage%)/100) × fm
dot   = basic × (DoT%/100) × elemMult × arcMult × skillFinalMult × buffFinalDmgMult
```

### 各乘區來源

| 乘區 | 來源 | 型態 | 備註 |
|---|---|---|---|
| `elemMult` | skill.element × enemy.elementalDmg × 職業無視屬性 | 單一 | `ENEMY_ELEM_RESIST_PCT × ELEM_IGNORE_BY_JOB` |
| `arcMult` | 秘法符文 ARC 比值對照 | 單一 | 玩家ARC / 怪物ARC 查表 → `finalDmg %` |
| `skillFinalMult` | 技能專屬 V 矩陣 | 單一 | 例:Flame Sweep Lv N × 2% 終傷 |
| `buffFinalDmgMult` | 實戰 buff 最終傷害 | **不同 buff 互乘,同 buff 層加** | Fervent Drain 1 DoT → ×1.05 |
| `buffDmgMult`(合入 Damage%) | 實戰 buff 的 Damage% | 與 CP Damage% 相加 | 例:法師傳授 3 層 → +9% Damage |
| `defMult` | 怪物 DEF × 有效無視 | 相乘疊加 | CP ignore × VM × buff,三者相乘 |
| `fm` | CP Final Damage% | 已併入 basic / boss | 不重複套用 |

### Buff 系統 (`useBattleBuffs` / `constants/battleBuffs.js`)

每筆 buff 有 `source`:
- `linkSkill` → 動態查 `combinedLevelFor + bestLevelDataFor` 取得當前等級的 stats (procRate / maxStacks / duration / damagePerStack / ignoreDefPerStack)
- `passive` + `passiveType: 'dotCount'` → 層數 = `min(maxStacks, activeDotCount)`

**目前已實作**
- `empirical_knowledge`(法師傳授 / Adventurer Mage link skill)— 用 link skill 現有 i18n 與圖示;Lv1–6 依連結結果
- `fervent_drain`(火毒被動 / Elemental Drain icon)— 每層 +5% 最終傷害,max 5 層

**Buff 面板**(`BattlePage` 的 `.bp-buffs`,在 Enemy Settings 與統計列之間)
- 只顯示技能圖示(置右);0 層 → 灰階;≥1 層 → 亮色;≥2 層 → 右下角金字黑描邊層數
- 新疊層時 420ms 金光 pulse 動畫(watch `state.stacks[id].count` 上升)

**最終傷害合成規則**:不同 buff 互乘,同 buff 層線性相加後轉為單一乘區
```
buffFinalDmgMult = Π over each buff [ 1 + (stacks × perStack) / 100 ]
例:A 3 層 × 3% + B 5 層 × 5% → (1 + 9/100) × (1 + 25/100) = 1.36
```

### 冷卻公式 (`computeEffectiveCooldown` in `useCpDamage.js`)

Step 順序嚴格:
1. 技能優先扣秒 (`skill.cooldownPriorityRedSec`,例:Mist Eruption 爆炸 ≥5 次 -2s)
2. 百分比減免(乘法疊加):`skill.cooldownOwnPctRed`(超技能 -50%)× `externalPctRed`(聯盟 Mercedes)
   - 特例 `cooldownExternalPctUsesBaseAsFlat: true` → 外部 % 以 base CD 為基準換算為 flat 秒扣除
3. 帽子 flat (`hatFlatRedSec`):
   - 若前兩步後 **CD < 5s**:帽子完全不生效(保持當前值)
   - 若 **CD > 10s**:直接扣秒
   - 若 **5s ≤ CD ≤ 10s**:每 1s flat 轉 5% 減免
   - 最終 **≥ 5s 硬下限**

**Mist Eruption 特例範例**(baseCd 10、-2s 優先、-50% 超技能、5% Mercedes、-4s 帽)
```
Step 1: 10 - 2 = 8
Step 2a: 8 × 0.5 = 4
Step 2b (特例): 4 - 10×0.05 = 3.5
Step 3: 3.5 < 5 → 帽子不生效
最終: 3.5s
```

### ENEMY SETTINGS (`useEnemySettings`)
- Type(BOSS / 一般)、Level、Defense、Elemental DMG Taken(full/half/none)、Boss ARC
- ARC 比值查表(`ARC_RATIO_TABLE`)→ 終傷 / 被擊傷害;`finalDmg` 透過 `arcRatioLookup(playerArc, bossArc)` 得出 `%`

### 單次施放測試(`simulateSingleCast`)
- 按下「測試一下」→ 以當前 CP 數值 + buff 層數 + 1 個 DoT 模擬一次 Flame Sweep
- 輸出 mainHits (7 筆)/ dotTicks (5 筆)/ 每個乘區數值 / 完整公式文字(VM / Buff / 重算 basic 與 boss / main / defense / DoT)

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

**未持久化(session only)**
- `useBattleSim`(durationSec / attackSpeed / skillLevels)
- `useBattleBuffs`(stacks / expireAt)
- `useDotTracker`(activeDotCount)

> 資料匯出 / 匯入:`src/composables/useDataIO.js` 的 `DATA_KEYS` 陣列定義要走 export 的 keys。
> `EXPORT_VERSION = 2`(v1→v2 無 schema 遷移,只是新增 `msucp.enemy.v1` 與 V 矩陣內的 flame_sweep key;舊檔匯入會走 sanitize 預設)。
> 新增子系統時請同步維護該陣列 + 上表 + `EXPORT_VERSION`(若欄位有相容性問題)。
