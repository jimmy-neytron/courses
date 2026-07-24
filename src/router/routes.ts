import type { RouteRecordRaw } from 'vue-router'

export const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/app/courses' },
  {
    path: '/auth',
    name: 'auth',
    component: () => import('@/pages/auth.vue'),
    meta: { guest: true },
  },
  {
    path: '/app',
    component: () => import('@/layouts/default.vue'),
    meta: { auth: true },
    children: [
      { path: '', redirect: '/app/courses' },
      {
        path: 'courses',
        name: 'courses',
        component: () => import('@/pages/courses/index.vue'),
      },
      {
        path: 'courses/:courseId',
        name: 'course-details',
        component: () => import('@/pages/courses/[courseId].vue'),
      },
      {
        path: 'lessons/:lessonId/editor',
        name: 'lesson-editor',
        component: () => import('@/pages/lessons/[lessonId]/editor.vue'),
      },
    ],
  },
  {
    path: '/preview',
    component: () => import('@/layouts/preview.vue'),
    meta: { auth: true },
    children: [
      {
        path: 'courses/:courseId',
        name: 'course-preview',
        component: () => import('@/pages/preview/courses/[courseId].vue'),
      },
      {
        path: 'lessons/:lessonId',
        name: 'lesson-preview',
        component: () => import('@/pages/preview/lessons/[lessonId].vue'),
      },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/app/courses' },
]
