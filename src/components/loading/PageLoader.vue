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
.page-loader{min-height:calc(100dvh - 128px);display:grid;place-content:center;justify-items:center;gap:22px;padding:40px 20px;background:radial-gradient(circle at 50% 46%,#7c5cff12,transparent 220px),#0b0d12;color:#f4f5f8;text-align:center}.page-loader--fullscreen{min-height:100dvh}.page-loader-visual{position:relative;width:92px;height:92px;display:grid;place-items:center}.page-loader-orbit{position:absolute;border-radius:50%;border:1px solid transparent}.page-loader-orbit--outer{inset:0;border-top-color:#9b7bff;border-right-color:#45d0b0;box-shadow:0 0 30px #7758ee26;animation:loader-spin 1.15s linear infinite}.page-loader-orbit--inner{inset:10px;border-bottom-color:#7958ef80;border-left-color:#a991ff4d;animation:loader-spin-reverse 1.7s linear infinite}.page-loader-mark{width:54px;height:54px;display:grid;place-items:center;border:1px solid #8b72e35c;border-radius:17px;background:linear-gradient(145deg,#241d3d,#151925);box-shadow:inset 0 1px #ffffff0d,0 14px 40px #0007}.page-loader-mark svg{width:26px;color:#a88bff;filter:drop-shadow(0 0 8px #8d6cff80)}.page-loader-copy{display:grid;gap:7px}.page-loader-copy strong{font-size:15px;letter-spacing:.01em}.page-loader-copy span{font-size:12px;color:#7f8798}@keyframes loader-spin{to{transform:rotate(360deg)}}@keyframes loader-spin-reverse{to{transform:rotate(-360deg)}}@media(prefers-reduced-motion:reduce){.page-loader-orbit{animation-duration:3s}}
</style>
