<script setup lang="ts">
import UiSegmented from "@/components/ui/UiSegmented.vue"
import type { CourseDetailsTab } from "@/composables/useCourseDetails"

const props = defineProps<{ modelValue: CourseDetailsTab }>()
const emit = defineEmits<{ "update:modelValue": [value: CourseDetailsTab] }>()

const tabs: { value: CourseDetailsTab; label: string }[] = [
  { value: "overview", label: "\u041e\u0431\u0437\u043e\u0440" },
  { value: "curriculum", label: "\u041f\u0440\u043e\u0433\u0440\u0430\u043c\u043c\u0430" },
  { value: "settings", label: "\u041d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0438" },
]
const values = tabs.map((tab) => tab.value)
const labels = new Map<CourseDetailsTab, string>(tabs.map((tab) => [tab.value, tab.label]))
const ariaLabel = "\u0420\u0430\u0437\u0434\u0435\u043b\u044b \u043a\u0443\u0440\u0441\u0430"

function formatTab(value: CourseDetailsTab): string {
  return labels.get(value) ?? value
}

function handleUpdate(value: CourseDetailsTab): void {
  emit("update:modelValue", value)
}
</script>

<template>
  <UiSegmented
    class="product-tabs product-tabs-segmented"
    :aria-label="ariaLabel"
    :model-value="props.modelValue"
    :options="values"
    :format-label="formatTab"
    @update:model-value="handleUpdate"
  />
</template>
