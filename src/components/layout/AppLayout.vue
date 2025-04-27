<script setup lang="ts">
import TopProfileNavigation from './navigation/TopProfileNavigation.vue'
import headerCzarles from '@/assets/images/image-header-title.png'
import logoCzarles from '@/assets/logos/logo-czarles.png'
import { useAuthUserStore } from '@/stores/authUser'
import imageBg from '@/assets/images/image-bg.jpg'
import { onMounted, ref } from 'vue'
import { useDisplay } from 'vuetify'

const props = defineProps<{
  isWithAppBarIcon?: boolean
}>()

const emit = defineEmits(['isDrawerVisible', 'theme'])

const { mobile, smAndUp } = useDisplay()

const authUserStore = useAuthUserStore()

const isLoggedIn = ref(false)
const theme = ref(localStorage.getItem('theme') ?? 'light')

function onToggleTheme() {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
  localStorage.setItem('theme', theme.value)
  emit('theme', theme.value)
}

onMounted(async () => {
  isLoggedIn.value = await authUserStore.isAuthenticated()
})
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

        <template v-if="isLoggedIn">
          <TopProfileNavigation></TopProfileNavigation>
        </template>
      </v-app-bar>

      <slot name="navigation"></slot>

      <v-main>
        <v-img :src="imageBg" class="h-screen" cover>
          <slot name="content"></slot>
        </v-img>
      </v-main>

      <v-footer class="d-flex" :class="mobile ? 'justify-center' : 'justify-between'" border app>
        <div class="font-weight-bold text-center">
          Copyright © 2025 | Czarles Construction and Supplies
        </div>
      </v-footer>
    </v-app>
  </v-responsive>
</template>
