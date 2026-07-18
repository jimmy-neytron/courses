<script setup lang="ts">
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend, type ChartOptions } from 'chart.js'
import type { Course } from '@/types/course'
ChartJS.register(CategoryScale,LinearScale,BarElement,Tooltip,Legend)
const props=defineProps<{courses:Course[]}>()
const data=computed(()=>({labels:props.courses.map(course=>course.title),datasets:[{label:'Прогресс, %',data:props.courses.map(course=>course.progress),backgroundColor:'#8b6cff',borderRadius:8,borderSkipped:false,maxBarThickness:34}]}))
const options:ChartOptions<'bar'>={responsive:true,maintainAspectRatio:false,indexAxis:'y',plugins:{legend:{display:false},tooltip:{backgroundColor:'#171b24',titleColor:'#f3f5f8',bodyColor:'#c8ced9',borderColor:'#303747',borderWidth:1,padding:12}},scales:{x:{beginAtZero:true,max:100,grid:{color:'#252b37'},ticks:{color:'#7f8796',callback:value=>`${value}%`}},y:{grid:{display:false},ticks:{color:'#c8ced9',font:{family:'Manrope',size:11}}}}}
</script>
<template><div class="chart-canvas"><Bar :data="data" :options="options"/></div></template>