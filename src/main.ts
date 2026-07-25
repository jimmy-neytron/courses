import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from '@/App.vue'
import { router } from '@/router'
import { useAuthStore } from '@/stores/auth'
import '@neytron/compact-ui/styles.css'
import '@/assets/styles/index.css'

const app = createApp(App)
const pinia = createPinia()

document.documentElement.dataset.cuiTheme = 'dark'

app.use(pinia)
await useAuthStore(pinia).initialize()
app.use(router)
app.mount('#app')
