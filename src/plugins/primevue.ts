import type { App } from 'vue'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'
import { definePreset } from '@primeuix/themes'

const CursorPreset=definePreset(Aura,{
  semantic:{
    primary:{
      50:'{emerald.50}',100:'{emerald.100}',200:'{emerald.200}',300:'{emerald.300}',400:'{emerald.400}',
      500:'{emerald.500}',600:'{emerald.600}',700:'{emerald.700}',800:'{emerald.800}',900:'{emerald.900}',950:'{emerald.950}',
    },
    colorScheme:{
      dark:{
        surface:{
          0:'#ffffff',50:'#eef3f0',100:'#d9e2dd',200:'#b8c6be',300:'#91a097',400:'#68776f',
          500:'#4a5650',600:'#343d38',700:'#252c28',800:'#171c19',900:'#0d110f',950:'#070a08',
        },
        primary:{
          color:'{emerald.400}',contrastColor:'{surface.950}',hoverColor:'{emerald.300}',activeColor:'{emerald.500}',
        },
        highlight:{background:'color-mix(in srgb, {emerald.400}, transparent 84%)',focusBackground:'color-mix(in srgb, {emerald.400}, transparent 76%)',color:'{emerald.200}',focusColor:'{emerald.100}'},
      },
    },
    focusRing:{width:'2px',style:'solid',color:'{primary.color}',offset:'2px'},
  },
})

export function installPrimeVue(app:App){
  document.documentElement.classList.add('app-dark')
  app.use(PrimeVue,{
    ripple:true,
    inputVariant:'filled',
    theme:{preset:CursorPreset,options:{darkModeSelector:'.app-dark',cssLayer:{name:'primevue',order:'primevue,app'}}},
  })
}
