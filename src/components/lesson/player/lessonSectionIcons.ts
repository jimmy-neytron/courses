import { BookOpen, Brain, Check, CheckCircle2, Headphones, Languages, MessageCircle, ShieldAlert } from 'lucide-vue-next'
import type { Component } from 'vue'
import type { LessonSectionId } from '@/types/course'

export const lessonSectionIcons: Record<LessonSectionId, Component> = {
  content: BookOpen,
  theory: BookOpen,
  conversation: MessageCircle,
  listening: Headphones,
  cards: Brain,
  errors: ShieldAlert,
  translation: Languages,
  practice: Check,
  test: CheckCircle2,
}
