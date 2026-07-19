<script setup lang="ts">
import { CalendarDays, Clock3, Flag, ListChecks } from 'lucide-vue-next'
import type { CourseLearningPlan } from '@/types/course'

defineProps<{ plan: CourseLearningPlan }>()
</script>

<template>
  <article class="course-learning-plan">
    <header>
      <div><span>Учебный маршрут</span><h2>План, который можно перенести в календарь</h2></div>
      <CalendarDays />
    </header>
    <dl>
      <div><CalendarDays /><dt>Продолжительность</dt><dd>{{ plan.durationWeeks }} недель</dd></div>
      <div><ListChecks /><dt>Занятий</dt><dd>{{ plan.totalSessions }}</dd></div>
      <div><Clock3 /><dt>Ритм</dt><dd>{{ plan.sessionsPerWeek }} × {{ plan.sessionMinutes }} минут</dd></div>
      <div><Flag /><dt>Контрольных точек</dt><dd>{{ plan.checkpointCount }}</dd></div>
    </dl>
    <p>{{ plan.cadence }}. {{ plan.outcome }}. Резервные дни используются для интервального повторения и переноса пропущенных занятий.</p>
  </article>
</template>
