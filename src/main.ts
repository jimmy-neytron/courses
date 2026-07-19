import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from '@/App.vue'
import { router } from '@/router'
import { installPrimeVue } from '@/plugins/primevue'
import { useAuthStore } from '@/stores/auth'
import '@/assets/styles/index.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
installPrimeVue(app)
await useAuthStore(pinia).initialize()
app.use(router)
app.mount('#app')
