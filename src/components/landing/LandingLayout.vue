<script setup lang="ts">
import headerCzarles from '@/assets/images/image-header-title.png'
import FooterNavigation from './navigation/FooterNavigation.vue'
import logoCzarles from '@/assets/logos/logo-czarles.png'
import imageBg from '@/assets/images/image-bg.jpg'
import { useDisplay } from 'vuetify'
import { ref } from 'vue'

const props = defineProps<{
  isWithAppBarIcon?: boolean
}>()

const emit = defineEmits(['isDrawerVisible', 'theme'])

const { smAndUp } = useDisplay()

const theme = ref(localStorage.getItem('theme') ?? 'light')
const tab = ref<number | null>(null)


function onToggleTheme() {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
  localStorage.setItem('theme', theme.value)
  emit('theme', theme.value)
}
</script>

<template>
  <v-responsive>
    <v-app :theme="theme">
      <v-app-bar class="px-3">
        <v-app-bar-nav-icon
          v-if="props.isWithAppBarIcon"
          icon="mdi-menu"
          :theme="theme"
          @click="emit('isDrawerVisible')"
        />

        <v-app-bar-title>
          <RouterLink to="/">
            <v-img v-if="theme === 'light' && smAndUp" max-width="265" :src="headerCzarles"/>
            <v-img v-else max-width="75" :src="logoCzarles"/>
          </RouterLink>
        </v-app-bar-title>

 

        <template v-if="smAndUp">
          <!-- Center the tabs visually on the app-bar by using an absolutely positioned wrapper
               The wrapper disables pointer-events so it doesn't block other app-bar elements,
               while the v-tabs itself re-enables pointer-events to remain interactive. -->
          <div style="position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); width:100%; max-width:500px; display:flex; justify-content:center; pointer-events:none;">
            <v-tabs
              v-model="tab"
              class="text-caption"
              grow
              background-color="transparent"
              style="min-width:320px; max-width:500px; pointer-events:auto;"
            >
              <v-tab href="#about">About Us</v-tab>
              <v-tab href="#company">Company</v-tab>
              <v-tab href="#contact">Contact us</v-tab>
            </v-tabs>
          </div>
        </template>

        <v-spacer />

        <div class="d-flex align-center">
          <template v-if="smAndUp">
            <v-btn class="me-2" prepend-icon="mdi-login" rounded="lg" to="/login"> Sign In </v-btn>
          </template>

          <v-btn
            class="me-2"
            :icon="theme === 'light' ? 'mdi-weather-night' : 'mdi-weather-sunny'"
            variant="elevated"
            @click="onToggleTheme"
            size="sm"
          />
        </div>
      </v-app-bar>

      <slot name="navigation" />

      <v-main>
        <v-img :src="imageBg" height="100%" cover>
          <slot name="content" />
        </v-img>
      </v-main>

      <FooterNavigation />
    </v-app>
  </v-responsive>
</template>
