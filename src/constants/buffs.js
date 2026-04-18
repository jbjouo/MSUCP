// Buff 定義 — 計算機右側可切換的增益效果
//
// 欄位:
//   id, name, icon
//   baseLevel?        : 技能本身的 base 等級 (預設 0)
//   skillLevelBonus?  : 啟用時為其他 buff 的 effectiveLevel +N (例:Combat Orders)
//   mastery?          : 固定 +N% 武器熟練度
//   stats?            : 靜態屬性加成 bag { key: value, ... }
//   contribute?       : (ctx) => [{ key, label, value, isPct? }] — 依情境動態產生貢獻
//       ctx = { charState, baseStats, primary, effectiveLevel }
//
// 處理順序:先收集所有啟用中 buff 的 skillLevelBonus 總和,
// 再以此算出每個 buff 的 effectiveLevel 呼叫 contribute。

export const BUFFS = [
  {
    id: 'meditation',
    name: 'Meditation',
    icon: '/skills/meditation.png',
    jobs: ['archmageFP'], // 僅火毒可見的專屬 buff
    stats: { matk: 30 },
  },
  {
    id: 'decent_sharp_eyes',
    name: 'Decent Sharp Eyes',
    icon: '/skills/decent_sharp_eyes.png',
    // 通用 buff:暴擊率 +10%、暴擊傷害 +8%
    stats: {
      critRate: 10,
      critDmg: 8,
    },
  },
  {
    id: 'combat_orders',
    name: 'Combat Orders',
    icon: '/skills/combat_orders.png',
    // 本身的效果:武器熟練度 +1%,並使其他 buff 技能等級 +1
    mastery: 1,
    skillLevelBonus: 1,
  },
  {
    id: 'maple_warrior',
    name: 'Maple Warrior',
    icon: '/skills/maple_warrior.png',
    baseLevel: 30,
    // 效果:依 AP 配點的主屬性 × X%;Lv30 = 15%,Lv31 = 16% (被 Combat Orders 加持)
    contribute(ctx) {
      const lv = ctx.effectiveLevel
      const pct = Math.max(0, 15 + (lv - 30))
      const ap = ctx.baseStats[ctx.primary] || 0
      const bonus = Math.floor(ap * pct / 100)
      if (!bonus) return []
      const label = ctx.t
        ? ctx.t('cp.buffs.mapleWarriorLabel', { name: this.name, lv, pct })
        : `Buff: ${this.name} (Lv ${lv}, +${pct}% AP)`
      return [{ key: ctx.primary, label, value: bonus }]
    },
  },
]

export const BUFFS_BY_ID = Object.fromEntries(BUFFS.map((b) => [b.id, b]))
