<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { BookOpen, Clock3, CornerDownLeft, FileText, Plus, Plug, Search, Settings } from 'lucide-vue-next'
import UiInput from '@/components/ui/UiInput.vue'
import { useCommandPalette } from '@/composables/useCommandPalette'
import { useRecentCourses } from '@/composables/useRecentCourses'
import { useCourseStore } from '@/stores/courses'

interface PaletteCommand {
  id: string
  label: string
  detail: string
  to: string
  icon: typeof BookOpen
  recentAt?: number
}

const router = useRouter()
const store = useCourseStore()
const palette = useCommandPalette()
const recent = useRecentCourses()
const query = ref('')
const activeIndex = ref(0)
const input = ref<InstanceType<typeof UiInput>>()

const commands = computed<PaletteCommand[]>(() => {
  const staticCommands: PaletteCommand[] = [
    { id: 'create-course', label: 'Создать курс', detail: 'Новое рабочее пространство', to: '/app/courses?create=1', icon: Plus },
    { id: 'integrations', label: 'Интеграции', detail: 'Подключения приложения', to: '/app/integrations', icon: Plug },
    { id: 'settings', label: 'Настройки', detail: 'Профиль и пространство', to: '/app/settings', icon: Settings },
  ]
  const courseCommands = store.courses.flatMap((course) => {
    const location = recent.forCourse(course.id)
    const courseCommand: PaletteCommand = {
      id: `course-${course.id}`,
      label: course.title,
      detail: course.accessRole === 'creator' ? 'Курс · редактирование' : `Курс · автор ${course.creator.name}`,
      to: location?.path ?? (course.accessRole === 'creator' ? `/app/courses/${course.id}` : `/preview/courses/${course.id}`),
      icon: BookOpen,
      recentAt: location?.updatedAt,
    }
    const lessons = course.modules.flatMap((module) => module.lessons.map((lesson) => ({
      id: `lesson-${lesson.id}`,
      label: lesson.title,
      detail: `${course.title} · ${module.title}`,
      to: course.accessRole === 'creator' ? `/app/lessons/${lesson.id}/editor` : `/preview/lessons/${lesson.id}`,
      icon: FileText,
      recentAt: location?.lessonId === lesson.id ? location.updatedAt : undefined,
    })))
    return [courseCommand, ...lessons]
  })
  return [...staticCommands, ...courseCommands]
})

const filtered = computed(() => {
  const normalized = query.value.trim().toLocaleLowerCase('ru-RU')
  const values = normalized
    ? commands.value.filter((item) => `${item.label} ${item.detail}`.toLocaleLowerCase('ru-RU').includes(normalized))
    : [...commands.value].sort((a, b) => (b.recentAt ?? 0) - (a.recentAt ?? 0))
  return values.slice(0, 12)
})

watch(() => palette.open.value, async (value) => {
  if (!value) return
  query.value = ''
  activeIndex.value = 0
  await nextTick()
  const element = input.value?.$el as HTMLInputElement | undefined
  element?.focus()
})
watch(query, () => { activeIndex.value = 0 })

function choose(command: PaletteCommand | undefined): void {
  if (!command) return
  palette.hide()
  void router.push(command.to)
}
function onKeydown(event: KeyboardEvent): void {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    palette.toggle()
    return
  }
  if (!palette.open.value) return
  if (event.key === 'Escape') palette.hide()
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    activeIndex.value = Math.min(activeIndex.value + 1, filtered.value.length - 1)
  }
  if (event.key === 'ArrowUp') {
    event.preventDefault()
    activeIndex.value = Math.max(activeIndex.value - 1, 0)
  }
  if (event.key === 'Enter') {
    event.preventDefault()
    choose(filtered.value[activeIndex.value])
  }
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <Transition name="command-palette">
      <div v-if="palette.open.value" class="command-palette-layer" @mousedown.self="palette.hide()">
        <section class="command-palette" role="dialog" aria-modal="true" aria-label="Быстрый поиск">
          <label class="command-palette-search"><Search /><UiInput ref="input" v-model="query" placeholder="Курс, урок или действие…" /></label>
          <div v-if="filtered.length" class="command-palette-list">
            <button v-for="(command, index) in filtered" :key="command.id" :class="{ 'is-active': index === activeIndex }" @mouseenter="activeIndex = index" @click="choose(command)">
              <span><component :is="command.recentAt ? Clock3 : command.icon" /></span>
              <div><strong>{{ command.label }}</strong><small>{{ command.recentAt ? `Недавнее · ${command.detail}` : command.detail }}</small></div>
              <CornerDownLeft v-if="index === activeIndex" />
            </button>
          </div>
          <div v-else class="command-palette-empty">Ничего не найдено</div>
          <footer><span><kbd>↑</kbd><kbd>↓</kbd> выбрать</span><span><kbd>Enter</kbd> открыть</span><span><kbd>Esc</kbd> закрыть</span></footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>
