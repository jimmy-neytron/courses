import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/app/courses' },
    { path: '/auth', component: () => import('@/pages/auth/index.vue'), meta: { guest: true } },
    { path: '/app', redirect: '/app/courses' },
    { path: '/app/courses', component: () => import('@/pages/courses/index.vue'), meta: { title: 'Курсы', auth: true } },
    {
      path: '/app/courses/:courseId',
      component: () => import('@/pages/courses/[courseId].vue'),
      meta: { title: 'Программа курса', auth: true },
    },
    {
      path: '/app/lessons/:lessonId/editor',
      component: () => import('@/pages/lessons/[lessonId]/editor.vue'),
      meta: { title: 'Редактор урока', loadingLabel: 'Открываем редактор урока', auth: true },
    },
    {
      path: '/preview/courses/:courseId',
      component: () => import('@/pages/preview/courses/[courseId].vue'),
      meta: { loadingLabel: 'Открываем курс', auth: true },
    },
    {
      path: '/preview/lessons/:lessonId',
      component: () => import('@/pages/preview/lessons/[lessonId].vue'),
      meta: { loadingLabel: 'Открываем урок', auth: true },
    },
    {
      path: '/app/:section(integrations|settings)',
      component: () => import('@/pages/[section].vue'),
      meta: { auth: true },
    },
    { path: '/:pathMatch(.*)*', redirect: '/app/courses' },
  ],
})

router.beforeEach((route) => {
  const auth = useAuthStore()
  if (!auth.isConfigured) return true

  if (route.meta.auth && !auth.isAuthenticated) {
    return { path: '/auth', query: { redirect: route.fullPath } }
  }
  if (route.meta.guest && auth.isAuthenticated) return '/app'
  return true
})