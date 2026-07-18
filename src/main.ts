import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from './router'
import { useAuthStore } from './stores/auth'
import './assets/styles/main.css'
import './assets/styles/product-fixes.css'
const app=createApp(App);const pinia=createPinia();app.use(pinia);await useAuthStore(pinia).initialize();app.use(router).mount('#app')
