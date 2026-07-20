<script setup lang="ts">
import { LoaderCircle } from 'lucide-vue-next'

withDefaults(defineProps<{
  as?: 'button' | 'a'
  type?: 'button' | 'submit' | 'reset'
  href?: string
  target?: string
  label?: string
  severity?: 'primary' | 'secondary' | 'danger'
  outlined?: boolean
  text?: boolean
  rounded?: boolean
  fluid?: boolean
  loading?: boolean
  disabled?: boolean
  size?: 'small' | 'medium'
  link?: boolean
}>(), { as: 'button', type: 'button', severity: 'primary', size: 'medium' })
</script>

<template>
  <component
    :is="as"
    :type="as === 'button' ? type : undefined"
    :href="as === 'a' ? href : undefined"
    :target="as === 'a' ? target : undefined"
    :disabled="as === 'button' ? disabled || loading : undefined"
    :aria-disabled="disabled || loading || undefined"
    :class="['ui-button', `is-${severity}`, { 'is-outlined': outlined, 'is-text': text, 'is-rounded': rounded, 'is-fluid': fluid, 'is-loading': loading, 'is-small': size === 'small', 'is-link': link }]"
  >
    <LoaderCircle v-if="loading" class="ui-button-spinner" />
    <slot v-else />
    <span v-if="label">{{ label }}</span>
  </component>
</template>
