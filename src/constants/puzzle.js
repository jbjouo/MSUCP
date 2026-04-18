// 聯盟拼圖 屬性 — 每項獨立等級 (0..maxLevel)
//
// 每個項目是一條「條目」,升一級就套用 stats (一個 key/value bag)。
// 屬性皆吃 % 加成 (無 fixed flag)。

export const PUZZLE_ENTRIES = [
  { id: 'str',             maxLevel: 15, labelKey: 'puzzle.entries.str',             stats: { str: 5 } },
  { id: 'dex',             maxLevel: 15, labelKey: 'puzzle.entries.dex',             stats: { dex: 5 } },
  { id: 'int',             maxLevel: 15, labelKey: 'puzzle.entries.int',             stats: { int: 5 } },
  { id: 'luk',             maxLevel: 15, labelKey: 'puzzle.entries.luk',             stats: { luk: 5 } },
  { id: 'hp',              maxLevel: 15, labelKey: 'puzzle.entries.hp',              stats: { hp: 250 } },
  { id: 'mp',              maxLevel: 15, labelKey: 'puzzle.entries.mp',              stats: { mp: 250 } },
  { id: 'atk',             maxLevel: 15, labelKey: 'puzzle.entries.atk',             stats: { atk: 1 } },
  { id: 'matk',            maxLevel: 15, labelKey: 'puzzle.entries.matk',            stats: { matk: 1 } },
  { id: 'crit_rate',       maxLevel: 40, labelKey: 'puzzle.entries.crit_rate',       stats: { critRate: 1 } },
  { id: 'abnormal_resist', maxLevel: 40, labelKey: 'puzzle.entries.abnormal_resist', stats: { abnormalResist: 1 } },
  { id: 'ignore_def',      maxLevel: 40, labelKey: 'puzzle.entries.ignore_def',      stats: { ignoreDef: 1 } },
  { id: 'normal_mob_dmg',  maxLevel: 40, labelKey: 'puzzle.entries.normal_mob_dmg',  stats: { normalMobDmg: 1 } },
  { id: 'crit_dmg',        maxLevel: 40, labelKey: 'puzzle.entries.crit_dmg',        stats: { critDmg: 0.5 } },
  { id: 'bonus_exp',       maxLevel: 40, labelKey: 'puzzle.entries.bonus_exp',       stats: { bonusExp: 0.25 } },
  { id: 'boss_dmg',        maxLevel: 40, labelKey: 'puzzle.entries.boss_dmg',        stats: { bossDmg: 1 } },
  { id: 'buff_duration',   maxLevel: 40, labelKey: 'puzzle.entries.buff_duration',   stats: { buffDuration: 1 } },
]

export const PUZZLE_ENTRIES_BY_ID = Object.fromEntries(PUZZLE_ENTRIES.map((e) => [e.id, e]))
