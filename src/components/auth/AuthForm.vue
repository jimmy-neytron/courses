<script setup lang="ts">
import { GraduationCap } from 'lucide-vue-next'
import PrimeButton from 'primevue/button'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Password from 'primevue/password'
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
      <InputText v-model="name" required autocomplete="name" placeholder="Алексей Петров" fluid />
    </label>
    <label>Email
      <InputText v-model="email" required type="email" autocomplete="email" placeholder="you@example.com" fluid />
    </label>
    <label>Пароль
      <Password
        v-model="password"
        required
        :minlength="6"
        :autocomplete="isLogin ? 'current-password' : 'new-password'"
        placeholder="Минимум 6 символов"
        :feedback="!isLogin"
        toggle-mask
        fluid
      />
    </label>

    <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
    <Message v-if="notice" severity="success" :closable="false">{{ notice }}</Message>
    <PrimeButton type="submit" :loading="busy" fluid>{{ isLogin ? 'Войти' : 'Зарегистрироваться' }}</PrimeButton>
    <p class="auth-switch">
      {{ isLogin ? 'Нет аккаунта?' : 'Уже есть аккаунт?' }}
      <PrimeButton type="button" link @click="switchMode">{{ isLogin ? 'Создать' : 'Войти' }}</PrimeButton>
    </p>
  </form>
</template>
