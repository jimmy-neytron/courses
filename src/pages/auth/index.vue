<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PrimeButton from 'primevue/button'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Password from 'primevue/password'
import { GraduationCap } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

const store=useAuthStore()
const router=useRouter()
const route=useRoute()
const mode=ref<'login'|'register'>((route.query.mode as 'register')||'login')
const name=ref(''),email=ref(''),password=ref(''),busy=ref(false),error=ref(''),notice=ref('')
async function submit(){error.value='';notice.value='';busy.value=true;try{if(mode.value==='login'){await store.signIn(email.value,password.value);await router.replace('/app')}else{const active=await store.signUp(email.value,password.value,name.value);if(active)await router.replace('/app');else notice.value='Проверьте почту и подтвердите регистрацию, затем войдите.'}}catch(cause){error.value=cause instanceof Error?cause.message:'Не удалось выполнить запрос'}finally{busy.value=false}}
function switchMode(){mode.value=mode.value==='login'?'register':'login';error.value='';notice.value=''}
</script>

<template>
  <main class="auth-page">
    <section class="auth-art"><div class="brand light"><span class="brand-mark"><GraduationCap/></span><strong>Курсор</strong></div><div><span>ПЛАТФОРМА ДЛЯ АВТОРОВ</span><h1>Создавайте обучение, которое хочется проходить.</h1><p>Курсы и интерактивные уроки в одном независимом пространстве.</p></div></section>
    <section class="auth-form">
      <form @submit.prevent="submit">
        <div class="mobile-brand"><GraduationCap/>Курсор</div><p class="eyebrow">Добро пожаловать</p>
        <h1>{{mode==='login'?'Войдите в аккаунт':'Создайте аккаунт'}}</h1><p>{{mode==='login'?'Продолжите работу над своими курсами.':'Личное пространство создастся автоматически.'}}</p>
        <label v-if="mode==='register'">Ваше имя<InputText v-model="name" required autocomplete="name" placeholder="Алексей Петров" fluid/></label>
        <label>Email<InputText v-model="email" required type="email" autocomplete="email" placeholder="you@example.com" fluid/></label>
        <label>Пароль<Password v-model="password" required :minlength="6" autocomplete="current-password" placeholder="Минимум 6 символов" :feedback="mode==='register'" toggle-mask fluid/></label>
        <Message v-if="error" severity="error" :closable="false">{{error}}</Message><Message v-if="notice" severity="success" :closable="false">{{notice}}</Message>
        <PrimeButton type="submit" :loading="busy" fluid>{{mode==='login'?'Войти':'Зарегистрироваться'}}</PrimeButton>
        <p class="auth-switch">{{mode==='login'?'Нет аккаунта?':'Уже есть аккаунт?'}} <PrimeButton type="button" link @click="switchMode">{{mode==='login'?'Создать':'Войти'}}</PrimeButton></p>
      </form>
    </section>
  </main>
</template>
