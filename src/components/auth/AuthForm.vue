<script setup lang="ts">
import { GraduationCap } from 'lucide-vue-next'
import UiButton from '@/components/ui/UiButton.vue'
import UiInput from '@/components/ui/UiInput.vue'
import { useAuthForm } from '@/composables/useAuthForm'

const { isLogin, name, email, password, busy, submit, switchMode } = useAuthForm()
</script>

<template>
  <form @submit.prevent="submit">
    <div class="mobile-brand"><GraduationCap />Курсор</div>
    <p class="eyebrow">Добро пожаловать</p>
    <h1>{{ isLogin ? 'Войдите в аккаунт' : 'Создайте аккаунт' }}</h1>
    <p>{{ isLogin ? 'Продолжите работу над своими курсами.' : 'Личное пространство создастся автоматически.' }}</p>

    <label v-if="!isLogin">Ваше имя
      <UiInput v-model="name" required autocomplete="name" placeholder="Алексей Петров" fluid />
    </label>
    <label>Email
      <UiInput v-model="email" required type="email" autocomplete="email" placeholder="you@example.com" fluid />
    </label>
    <label>Пароль
      <UiInput type="password"
        v-model="password"
        required
        :minlength="6"
        :autocomplete="isLogin ? 'current-password' : 'new-password'"
        placeholder="Минимум 6 символов"


        fluid
      />
    </label>

    <UiButton class="auth-submit" type="submit" :loading="busy" fluid>{{ isLogin ? 'Войти' : 'Зарегистрироваться' }}</UiButton>
    <p class="auth-switch">
      <span>{{ isLogin ? 'Нет аккаунта?' : 'Уже есть аккаунт?' }}</span>
      <button class="auth-switch-action" type="button" @click="switchMode">
        {{ isLogin ? 'Создать аккаунт' : 'Войти' }}
      </button>
    </p>
  </form>
</template>
