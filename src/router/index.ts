import { createRouter, createWebHistory, type RouteLocationNormalized } from 'vue-router'

import { useAuthStore } from '@/stores/auth'
import { routes } from './routes'

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach((route: RouteLocationNormalized) => {
  const auth = useAuthStore()

  if (!auth.initialized) return true
  if (route.meta.auth && !auth.isAuthenticated) {
    return { name: 'auth', query: { redirect: route.fullPath } }
  }
  if (route.meta.guest && auth.isAuthenticated) {
    return { name: 'courses' }
  }

  return true
})
