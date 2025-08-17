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
        >
        </v-app-bar-nav-icon>

        <v-app-bar-title>
          <RouterLink to="/">
            <v-img v-if="theme === 'light' && smAndUp" max-width="265" :src="headerCzarles"></v-img>
            <v-img v-else max-width="75" :src="logoCzarles"></v-img>
          </RouterLink>
        </v-app-bar-title>

        <v-btn
          class="me-2"
          :icon="theme === 'light' ? 'mdi-weather-night' : 'mdi-weather-sunny'"
          variant="elevated"
          @click="onToggleTheme"
          slim
        ></v-btn>
      </v-app-bar>

      <slot name="navigation"></slot>

      <v-main>
        <v-img :src="imageBg" height="100%" cover>
          <slot name="content"></slot>
        </v-img>
      </v-main>

      <FooterNavigation></FooterNavigation>
    </v-app>
  </v-responsive>
</template>
