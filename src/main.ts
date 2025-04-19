import './assets/main.css'

// Vue 3
import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { VDateInput } from 'vuetify/labs/VDateInput'

// Icon Fonts
import '@mdi/font/css/materialdesignicons.css'

// Custom Theme
import { customDefaults, customTheme } from '@/utils/vuetify/config'

const vuetify = createVuetify({
  theme: {
    themes: customTheme,
  },
  defaults: customDefaults,
  components: {
    ...components,
    VDateInput,
  },
  directives,
})

const app = createApp(App)

app.use(createPinia())
app.use(vuetify)
app.use(router)

app.mount('#app')
