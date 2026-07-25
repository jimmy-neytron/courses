<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { Headphones, Pause, Play, RotateCcw, Volume2 } from 'lucide-vue-next'
const props=defineProps<{src?:string;transcript?:string;title?:string}>()
const emit=defineEmits<{completed:[]}>()
const audio=ref<HTMLAudioElement>();const speaking=ref(false);const hasRecording=computed(()=>Boolean(props.src))
function speak(){if(!props.transcript||!('speechSynthesis'in window))return;window.speechSynthesis.cancel();const speech=new SpeechSynthesisUtterance(props.transcript);speech.lang='en-US';speech.rate=.88;speech.onend=()=>{speaking.value=false;emit('completed')};speaking.value=true;window.speechSynthesis.speak(speech)}
function stopSpeech(){window.speechSynthesis?.cancel();speaking.value=false}
function restart(){if(audio.value){audio.value.currentTime=0;void audio.value.play()}else speak()}
onBeforeUnmount(stopSpeech)
</script>
<template><section class="lesson-audio-player"><div class="lesson-audio-heading"><span><Headphones/></span><div><small>Listening practice</small><strong>{{title||'Аудирование'}}</strong></div></div><audio v-if="hasRecording" ref="audio" :src="src" controls preload="metadata" @ended="emit('completed')"/><div v-else class="lesson-audio-tts"><button type="button" :disabled="!transcript" @click="speaking?stopSpeech():speak()"><Pause v-if="speaking"/><Play v-else/>{{speaking?'Остановить':'Прослушать запись'}}</button><span><Volume2/> Встроенная английская озвучка</span></div><button type="button" class="lesson-audio-restart" @click="restart"><RotateCcw/>Прослушать ещё раз</button><details v-if="transcript"><summary>Показать транскрипт</summary><p>{{transcript}}</p></details></section></template>