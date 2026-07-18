# Рекомендуемый пакетный стек

## Core

```text
vue
vue-router
pinia
@tanstack/vue-query
@supabase/supabase-js
zod
vee-validate
@vee-validate/zod
```

## UI

```text
tailwindcss
shadcn-vue
reka-ui
lucide-vue-next
class-variance-authority
clsx
tailwind-merge
vue-sonner
```

`shadcn-vue` используется как open-code основа дизайн-системы, а не как непрозрачная зависимость. Компоненты должны храниться в репозитории и адаптироваться под токены проекта.

## Course editor

```text
@tiptap/vue-3
@tiptap/starter-kit
@tiptap/extension-link
@tiptap/extension-placeholder
vue-draggable-plus
```

Не разрешать произвольный HTML. Использовать whitelist Tiptap nodes/marks и sanitization при рендеринге.

## Utilities

```text
@vueuse/core
date-fns
vue-i18n
```

## Testing and quality

```text
vitest
@vue/test-utils
@playwright/test
msw
eslint
prettier
vue-tsc
husky
lint-staged
```

## State rule

- Pinia: auth context, selected organization, editor/UI state.
- TanStack Query: server data and cache.
- VeeValidate + Zod: forms.
- Zod separately: API, postMessage and JSONB runtime validation.
