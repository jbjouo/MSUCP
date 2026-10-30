<script setup>
import { useI18n } from 'vue-i18n'
import { useGuildSkills } from '../composables/useGuildSkills.js'
import { GUILD_VISIBLE_GROUPS, GUILD_NORMAL_TIERS } from '../constants/guildSkills.js'

// 公會技能 — 普通技能(被動,填等級即計入 CP)/ 貴族技能(buff,等級 > 0 出現在 CP 增益欄)
const { t } = useI18n()
const { state, setLevel, GUILD_SKILLS } = useGuildSkills()

const skillsOf = (group) => GUILD_SKILLS.filter((s) => s.group === group)
// 普通技能依公會等級分欄(同遊戲內公會技能表)
const normalColumns = GUILD_NORMAL_TIERS.map((lv) => ({
  lv,
  skills: GUILD_SKILLS.filter((s) => s.group === 'normal' && s.guildLevel === lv),
}))
</script>

<template>
  <section class="vm-panel">
    <header class="vm-panel__head">
      <span>{{ t('guildSkills.title') }}</span>
    </header>

    <div v-for="group in GUILD_VISIBLE_GROUPS" :key="group" class="vm-group">
      <div class="vm-group__head">
        <span>{{ t(`guildSkills.groups.${group}`) }}</span>
      </div>
      <div v-if="group === 'normal'" class="vm-tiers">
        <div v-for="col in normalColumns" :key="col.lv" class="vm-tier">
          <div class="vm-tier__head">{{ t('guildSkills.tier', { lv: col.lv }) }}</div>
          <div class="vm-tier__cells">
            <div
              v-for="skill in col.skills"
              :key="skill.id"
              class="vm-cell"
            >
              <img
                v-if="skill.icon"
                class="vm-cell__icon"
                :src="skill.icon"
                :alt="t(`guildSkills.skills.${skill.id}.name`)"
                loading="lazy"
              />
              <div v-else class="vm-cell__icon vm-cell__icon--empty">?</div>
              <div class="vm-cell__name">{{ t(`guildSkills.skills.${skill.id}.name`) }}</div>
              <div class="vm-cell__level">
                <input
                  type="number"
                  class="vm-cell__input"
                  min="0"
                  :max="skill.maxLevel"
                  :value="state[skill.id]"
                  @input="(e) => setLevel(skill.id, e.target.value)"
                />
                <span class="vm-cell__cap">/ {{ skill.maxLevel }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="vm-grid">
        <div
          v-for="skill in skillsOf(group)"
          :key="skill.id"
          class="vm-cell"
        >
          <img
            v-if="skill.icon"
            class="vm-cell__icon"
            :src="skill.icon"
            :alt="t(`guildSkills.skills.${skill.id}.name`)"
            loading="lazy"
          />
          <div v-else class="vm-cell__icon vm-cell__icon--empty">?</div>
          <div class="vm-cell__name">{{ t(`guildSkills.skills.${skill.id}.name`) }}</div>
          <div class="vm-cell__level">
            <input
              type="number"
              class="vm-cell__input"
              min="0"
              :max="skill.maxLevel"
              :value="state[skill.id]"
              @input="(e) => setLevel(skill.id, e.target.value)"
            />
            <span class="vm-cell__cap">/ {{ skill.maxLevel }}</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.vm-panel {
  background: linear-gradient(180deg, #8b96a8 0%, #6b7689 100%);
  border: 1px solid #3d4554;
  border-radius: 14px;
  padding: 10px;
  box-shadow:
    0 10px 28px rgba(0, 0, 0, 0.45),
    inset 0 1px 0 rgba(255, 255, 255, 0.25);
  color: #f1f3f7;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}
.vm-panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  background: linear-gradient(180deg, #3d4554 0%, #2f3642 100%);
  border: 1px solid #1a1f27;
  border-radius: 8px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #ffc857;
  font-size: 0.92rem;
  text-shadow: 0 1px 0 rgba(0, 0, 0, 0.4);
}
.vm-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(104px, 1fr));
  gap: 8px;
  padding: 10px;
  background: linear-gradient(180deg, #4f5867 0%, #434c59 100%);
  border: 1px solid #2f3642;
  border-radius: 8px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
}
.vm-tiers {
  display: grid;
  grid-template-columns: repeat(6, minmax(96px, 1fr));
  gap: 6px;
  padding: 8px;
  background: linear-gradient(180deg, #4f5867 0%, #434c59 100%);
  border: 1px solid #2f3642;
  border-radius: 8px;
  overflow-x: auto;
}
.vm-tier {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}
.vm-tier__head {
  padding: 4px 0;
  text-align: center;
  font-size: 0.78rem;
  font-weight: 700;
  color: #1f2630;
  background: #dfe4ec;
  border-radius: 5px;
  font-variant-numeric: tabular-nums;
}
.vm-tier__cells {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
}
.vm-cell {
  display: grid;
  grid-template-rows: auto 2.4em auto;
  align-items: center;
  justify-items: center;
  gap: 6px;
  padding: 8px 4px;
  background: #3d4654;
  border: 1px solid #1a1f27;
  border-radius: 6px;
  min-width: 0;
}
.vm-cell__icon {
  width: 40px;
  height: 40px;
  object-fit: contain;
  background: #1f2630;
  border: 1px solid #141a22;
  border-radius: 5px;
  flex-shrink: 0;
}
.vm-cell__icon--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  border-style: dashed;
  border-color: #6b7689;
  color: #8ea6b8;
  font-size: 1rem;
  font-weight: 700;
}
.vm-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.vm-group__head {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  padding: 0 4px;
  font-size: 0.8rem;
  font-weight: 700;
  color: #ffe9a8;
  letter-spacing: 0.04em;
}
.vm-cell__name {
  font-size: 0.7rem;
  color: #e8edf2;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-align: center;
  line-height: 1.2;
  width: 100%;
  word-break: break-word;
  hyphens: auto;
  display: flex;
  align-items: center;
  justify-content: center;
}
.vm-cell__level {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 0.25rem;
}
.vm-cell__input {
  width: 44px;
  background: #1f2630;
  color: #f1f3f7;
  border: 1px solid #141a22;
  border-radius: 4px;
  padding: 0.15rem 0.3rem;
  font-family: inherit;
  font-size: 0.82rem;
  text-align: center;
  font-variant-numeric: tabular-nums;
}
.vm-cell__input:focus { outline: none; border-color: #ffc857; }
.vm-cell__cap {
  font-size: 0.7rem;
  color: #8ea6b8;
  font-variant-numeric: tabular-nums;
}
</style>
