<script setup lang="ts">
import { GraduationCap } from 'lucide-vue-next'

withDefaults(defineProps<{ label?:string; fullscreen?:boolean }>(), {
  label:'Загружаем данные',
  fullscreen:false,
})
</script>

<template>
  <section class="page-loader" :class="{'page-loader--fullscreen':fullscreen}" role="status" aria-live="polite">
    <div class="page-loader-visual" aria-hidden="true">
      <span class="page-loader-orbit page-loader-orbit--outer" />
      <span class="page-loader-orbit page-loader-orbit--inner" />
      <span class="page-loader-mark"><GraduationCap /></span>
    </div>
    <div class="page-loader-copy"><strong>{{ label }}</strong><span>Подготавливаем рабочее пространство</span></div>
  </section>
</template>

<style scoped>
.page-loader{min-height:calc(100dvh - 128px);display:grid;place-content:center;justify-items:center;gap:22px;padding:40px 20px;background:radial-gradient(circle at 50% 46%,#22c87516,transparent 220px),#060907;color:#f1f7f3;text-align:center}.page-loader--fullscreen{min-height:100dvh}.page-loader-visual{position:relative;width:92px;height:92px;display:grid;place-items:center}.page-loader-orbit{position:absolute;border-radius:50%;border:1px solid transparent}.page-loader-orbit--outer{inset:0;border-top-color:#62e69c;border-right-color:#1eaf65;box-shadow:0 0 30px #22c8752e;animation:loader-spin 1.15s linear infinite}.page-loader-orbit--inner{inset:10px;border-bottom-color:#23c57580;border-left-color:#83edb34d;animation:loader-spin-reverse 1.7s linear infinite}.page-loader-mark{width:54px;height:54px;display:grid;place-items:center;border:1px solid #39d4865c;border-radius:17px;background:linear-gradient(145deg,#10261a,#0c1510);box-shadow:inset 0 1px #ffffff0d,0 14px 40px #0007}.page-loader-mark svg{width:26px;color:#6be8a3;filter:drop-shadow(0 0 8px #22c87580)}.page-loader-copy{display:grid;gap:7px}.page-loader-copy strong{font-size:15px;letter-spacing:.01em}.page-loader-copy span{font-size:12px;color:#84938a}@keyframes loader-spin{to{transform:rotate(360deg)}}@keyframes loader-spin-reverse{to{transform:rotate(-360deg)}}@media(prefers-reduced-motion:reduce){.page-loader-orbit{animation-duration:3s}}
</style>
