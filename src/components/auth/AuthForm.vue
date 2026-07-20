<script setup lang="ts">
import { GraduationCap } from 'lucide-vue-next'
import UiButton from '@/components/ui/UiButton.vue'
import UiInput from '@/components/ui/UiInput.vue'
import UiAlert from '@/components/ui/UiAlert.vue'
import { useAuthForm } from '@/composables/useAuthForm'

const { isLogin, name, email, password, busy, error, notice, submit, switchMode } = useAuthForm()
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

    <UiAlert v-if="error" severity="error">{{ error }}</UiAlert>
    <UiAlert v-if="notice" severity="success">{{ notice }}</UiAlert>
    <UiButton type="submit" :loading="busy" fluid>{{ isLogin ? 'Войти' : 'Зарегистрироваться' }}</UiButton>
    <p class="auth-switch">
      {{ isLogin ? 'Нет аккаунта?' : 'Уже есть аккаунт?' }}
      <UiButton type="button" link @click="switchMode">{{ isLogin ? 'Создать' : 'Войти' }}</UiButton>
    </p>
  </form>
</template>
