// 全職業共通 — 0 轉 (入門 / 共通互動型)
// Will of the Alliance / Blessing of the Fairy / Empress's Blessing / Hero's Echo
//
// 設計原則:
//   技能本體(id / name / nameKey / stats / mpCost / cooldownSec 等)保持乾淨,
//   只描述遊戲裡的技能本身。
//   其他系統的角色與參數掛在子物件:
//     cp:      CP 計算機裡的角色 (role: 'toggle' | 'passive' | 'buff')
//     vmatrix: V 矩陣角色
//     battle:  戰鬥模擬角色 (未使用時不寫)
//
// 同一支技能若在不同系統有不同角色,各寫各的子物件,互不干擾。

import { ASSET } from '../helpers.js'

export const ALL_JOBS_0TH_SKILLS = [
  // ── Will of the Alliance ─────────────────────────────────────────────────
  // 本質是 passive(取得後永遠生效),但因取得條件特殊(聯盟活動) → 玩家有/無不一致,
  // 所以 CP 計算機裡作為 toggle 讓玩家自行標記。
  {
    id: 'will_of_the_alliance',
    name: 'Will of the Alliance',
    nameKey: 'skills.common.will_of_the_alliance.name',
    descriptionKey: 'skills.common.will_of_the_alliance.description',
    icon: ASSET('skills/will_of_the_alliance.png'),
    advancement: 0,
    kind: 'passive',
    stats: { str: 5, dex: 5, int: 5, luk: 5, atk: 5, matk: 5 },
    cp: { role: 'toggle' },
  },
  // ── Blessing of the Fairy ────────────────────────────────────────────────
  // 各角色等級依其帳號最高角色等級(條件型);CP 視為 toggle,與 Empress 互斥。
  {
    id: 'blessing_of_the_fairy',
    name: 'Blessing of the Fairy',
    nameKey: 'skills.common.blessing_of_the_fairy.name',
    descriptionKey: 'skills.common.blessing_of_the_fairy.description',
    icon: ASSET('skills/blessing_of_the_fairy.png'),
    advancement: 0,
    kind: 'passive',
    stats: { atk: 20, matk: 20 },
    cp: { role: 'toggle', group: 'blessing' },
  },
  // ── Empress's Blessing ───────────────────────────────────────────────────
  {
    id: 'empress_blessing',
    name: "Empress's Blessing",
    nameKey: 'skills.common.empress_blessing.name',
    descriptionKey: 'skills.common.empress_blessing.description',
    icon: ASSET('skills/empress_blessing.png'),
    advancement: 0,
    kind: 'passive',
    stats: { atk: 30, matk: 30 },
    cp: { role: 'toggle', group: 'blessing' },
  },
  // ── Gold Richie Resort VIP ────────────────────────────────────────────────
  {
    id: 'gold_richie_resort_vip',
    name: 'Gold Richie Resort VIP',
    nameKey: 'skills.common.gold_richie_resort_vip.name',
    descriptionKey: 'skills.common.gold_richie_resort_vip.description',
    icon: ASSET('skills/gold_richie_resort_vip.png'),
    advancement: 0,
    kind: 'buff',
    stats: {
      allStat: 20,
      atk: 10,
      matk: 10,
      ignoreDef: 15,
      bossDmg: 15,
      critRate: 15,
      buffDuration: 25,
    },
    cp: { role: 'buff' },
  },
  // ── Hero's Echo ──────────────────────────────────────────────────────────
  // 可施放 buff 技能(Max Lv 1,Lv1 +4% ATT/MATK, 2400s, cooldown 300s)。
  // CP 計算機視為 Buff 面板開關。
  {
    id: 'heros_echo',
    name: "Hero's Echo",
    nameKey: 'skills.common.heros_echo.name',
    descriptionKey: 'skills.common.heros_echo.description',
    icon: ASSET('skills/heros_echo.png'),
    advancement: 0,
    kind: 'buff',
    maxLevel: 1,
    masterLevel: 1,
    mpCost: 30,
    durationSec: 2400,
    cooldownSec: 300,
    stats: { atkPct: 4, matkPct: 4 },
    cp: { role: 'buff' },
  },
]

// 子分類(derive from cp.role) — 對 consumer 維持舊命名
export const ALL_JOBS_0TH_TOGGLE_SKILLS = ALL_JOBS_0TH_SKILLS.filter((s) => s.cp?.role === 'toggle')
export const ALL_JOBS_0TH_BUFFS         = ALL_JOBS_0TH_SKILLS.filter((s) => s.cp?.role === 'buff')
export const ALL_JOBS_0TH_PASSIVE_SKILLS = ALL_JOBS_0TH_SKILLS.filter((s) => s.cp?.role === 'passive')
export const ALL_JOBS_0TH_VMATRIX_SKILLS = ALL_JOBS_0TH_SKILLS.filter((s) => s.vmatrix)
export const ALL_JOBS_0TH_BATTLE_BUFFS = []
