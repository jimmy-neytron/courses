import { createPinia } from 'pinia'
import { createApp } from 'vue'

import '@neytron/compact-ui/styles.css'
import '@/assets/styles/tokens.css'
import '@/assets/styles/reset.css'
import '@/assets/styles/theme.css'
import '@/assets/styles/typography.css'
import '@/assets/styles/accessibility.css'
import '@/assets/styles/compact-ui-overrides.css'

import AppRoot from '@/app.vue'
import { configureTheme } from '@/plugins/compact-ui-theme'
import { router } from '@/router'
import { useAuthStore } from '@/stores/auth'

configureTheme()

const app = createApp(AppRoot)
const pinia = createPinia()

app.use(pinia)
app.use(router)

await useAuthStore(pinia).initialize()

app.mount('#app')
