<script setup lang="ts">
import { computed, useAttrs } from 'vue'
import { UiButton as CompactButton } from '@neytron/compact-ui/button'
import type { UiButtonVariant } from '@neytron/compact-ui/button'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
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
  ariaLabel?: string
}>(), { as: 'button', type: 'button', severity: 'primary', size: 'medium' })

const attrs = useAttrs()
const variant = computed<UiButtonVariant>(() => {
  if (props.severity === 'danger') return 'danger'
  if (props.text || props.link) return 'ghost'
  if (props.severity === 'secondary' || props.outlined) return 'secondary'
  return 'primary'
})
const classes = computed(() => ['ui-button', `is-${props.severity}`, {
  'is-outlined': props.outlined,
  'is-text': props.text,
  'is-rounded': props.rounded,
  'is-fluid': props.fluid,
  'is-loading': props.loading,
  'is-small': props.size === 'small',
  'is-link': props.link,
}])
</script>

<template>
  <a v-if="as === 'a'" v-bind="attrs" :href="href" :target="target" :aria-label="ariaLabel" :aria-disabled="disabled || loading || undefined" :class="classes">
    <slot /><span v-if="label">{{ label }}</span>
  </a>
  <CompactButton v-else v-bind="attrs" :class="classes" :type="type" :variant="variant" :size="size === 'small' ? 'sm' : 'md'" :block="fluid" :loading="loading" :disabled="disabled" :aria-label="ariaLabel">
    <slot /><span v-if="label">{{ label }}</span>
  </CompactButton>
</template>