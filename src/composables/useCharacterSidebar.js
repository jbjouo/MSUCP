import { ref } from 'vue'

const MOBILE_BREAKPOINT = 900
const sidebarOpen = ref(true)
const isMobile = ref(false)
const activeSection = ref('basic')

function updateViewport() {
  const mobile = window.innerWidth <= MOBILE_BREAKPOINT
  isMobile.value = mobile
  sidebarOpen.value = !mobile
}

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}

function setActiveSection(key) {
  activeSection.value = key
}

export function useCharacterSidebar() {
  return {
    MOBILE_BREAKPOINT,
    sidebarOpen,
    isMobile,
    activeSection,
    updateViewport,
    toggleSidebar,
    setActiveSection,
  }
}
