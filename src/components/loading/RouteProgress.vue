<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const visible = ref(false)
const progress = ref(0)
let progressTimer:ReturnType<typeof setInterval>|undefined
let finishTimer:ReturnType<typeof setTimeout>|undefined
let removeBefore:(()=>void)|undefined
let removeAfter:(()=>void)|undefined
let removeError:(()=>void)|undefined

function start(){clearTimeout(finishTimer);clearInterval(progressTimer);visible.value=true;progress.value=12;progressTimer=setInterval(()=>{progress.value=Math.min(88,progress.value+(90-progress.value)*.12)},110)}
function finish(){clearInterval(progressTimer);progress.value=100;finishTimer=setTimeout(()=>{visible.value=false;progress.value=0},220)}

onMounted(()=>{
  removeBefore=router.beforeEach((to,from)=>{if(to.fullPath!==from.fullPath)start();return true})
  removeAfter=router.afterEach(()=>finish())
  removeError=router.onError(()=>finish())
})
onBeforeUnmount(()=>{removeBefore?.();removeAfter?.();removeError?.();clearInterval(progressTimer);clearTimeout(finishTimer)})
</script>

<template><div v-show="visible" class="route-progress" aria-hidden="true"><span :style="{transform:`scaleX(${progress/100})`}" /></div></template>

<style scoped>
.route-progress{position:fixed;inset:0 0 auto;height:3px;z-index:1000;pointer-events:none;background:#22c87512}.route-progress span{display:block;width:100%;height:100%;transform-origin:left;background:linear-gradient(90deg,#7557ef,#a889ff,#45d0b0);box-shadow:0 0 18px #22c875,0 0 7px #ffffff66;transition:transform .16s ease-out}
</style>