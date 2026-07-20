import { computed, ref } from 'vue'

export interface RecentCourseLocation {
  courseId: string
  lessonId?: string
  path: string
  label: string
  updatedAt: number
}

const storageKey = 'cursor.recent-course-locations.v1'

function readLocations(): Record<string, RecentCourseLocation> {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(window.localStorage.getItem(storageKey) ?? '{}') as Record<string, RecentCourseLocation>
  } catch {
    return {}
  }
}

const locations = ref<Record<string, RecentCourseLocation>>(readLocations())

function persist(): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(storageKey, JSON.stringify(locations.value))
}

export function useRecentCourses() {
  const ordered = computed(() => Object.values(locations.value).sort((a, b) => b.updatedAt - a.updatedAt))

  function record(location: Omit<RecentCourseLocation, 'updatedAt'>): void {
    locations.value = {
      ...locations.value,
      [location.courseId]: { ...location, updatedAt: Date.now() },
    }
    persist()
  }

  function forCourse(courseId: string): RecentCourseLocation | undefined {
    return locations.value[courseId]
  }

  function forget(courseId: string): void {
    if (!locations.value[courseId]) return
    const next = { ...locations.value }
    delete next[courseId]
    locations.value = next
    persist()
  }

  return { locations, ordered, record, forCourse, forget }
}
