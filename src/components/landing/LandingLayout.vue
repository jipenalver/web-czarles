<script setup lang="ts">
import headerCzarles from '@/assets/images/image-header-title.png'
import FooterNavigation from './navigation/FooterNavigation.vue'
import logoCzarles from '@/assets/logos/logo-czarles.png'
import imageBg from '@/assets/images/image-bg.jpg'
import { useDisplay } from 'vuetify'
import { ref, watch, computed, useSlots } from 'vue'
import { useRoute } from 'vue-router'

const props = defineProps<{
  isWithAppBarIcon?: boolean
  hideBg?: boolean
}>()

const emit = defineEmits(['isDrawerVisible', 'theme'])

const { smAndUp } = useDisplay()

const theme = ref(localStorage.getItem('theme') ?? 'light')
const route = useRoute()
const tab = ref<string | null>(route.path)
const slots = useSlots()
const showHeader = computed(() => route.path !== '/' && !!slots.hero)
const isDrawerVisible = ref(false)

// keep the tab in sync when the route changes (so active tab follows navigation)
watch(() => route.path, (p) => {
  tab.value = p
})

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
            <v-img v-if="theme === 'light' && smAndUp" max-width="265" :src="headerCzarles" />
            <v-img v-else max-width="75" :src="logoCzarles" />
          </RouterLink>
        </v-app-bar-title>

        <template v-if="smAndUp">
         
          <div
            style="
              position: absolute;
              left: 50%;
              top: 50%;
              transform: translate(-50%, -50%);
              width: 100%;
              max-width: 1000px;
              display: flex;
              justify-content: center;
              pointer-events: none;
            "
          >
            <v-tabs
              v-model="tab"
              class="text-caption"
              grow
              background-color="transparent"
              style="min-width: 320px; max-width: 600px; pointer-events: auto"
            >
              <v-tab :to="'/'" value="/">Home</v-tab>
              <v-tab :to="'/about'" value="/about">About Us</v-tab>
              <v-tab :to="'/company'" value="/company">Company</v-tab>
              <v-tab :to="'/contact'" value="/contact">Contact us</v-tab>
             <!--  <v-tab :to="'/privacy-policy'" value="/privacy-policy">Privacy Policy</v-tab>
              <v-tab :to="'/terms-agreements'" value="/terms-agreements">Terms of Service</v-tab> -->
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
        <!-- Mobile navigation menu -->
        <template v-if="!smAndUp">
          <v-menu v-model="isDrawerVisible" location="bottom end" :theme="theme">
            <template v-slot:activator="{ props: menuProps }">
              <v-btn
                icon="mdi-menu"
                variant="text"
                v-bind="menuProps"
                class="me-2"
              />
            </template>
            <v-card min-width="200">
              <v-list>
                <v-list-item to="/" @click="() => (isDrawerVisible = false)">
                  <v-list-item-title>Home</v-list-item-title>
                </v-list-item>
                <v-list-item to="/about" @click="() => (isDrawerVisible = false)">
                  <v-list-item-title>About Us</v-list-item-title>
                </v-list-item>
                <v-list-item to="/company" @click="() => (isDrawerVisible = false)">
                  <v-list-item-title>Company</v-list-item-title>
                </v-list-item>
                <v-list-item to="/contact" @click="() => (isDrawerVisible = false)">
                  <v-list-item-title>Contact us</v-list-item-title>
                </v-list-item>
                <v-list-item to="/privacy-policy" @click="() => (isDrawerVisible = false)">
                  <v-list-item-title>Privacy Policy</v-list-item-title>
                </v-list-item>
                <v-list-item to="/terms-agreements" @click="() => (isDrawerVisible = false)">
                  <v-list-item-title>Terms of Service</v-list-item-title>
                </v-list-item>
                <v-divider />
                <v-list-item to="/login" @click="() => (isDrawerVisible = false)">
                  <v-list-item-title>Sign In</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-card>
          </v-menu>
        </template>

       
      </v-app-bar>

      <slot name="navigation" />

      <!-- optional page hero/header slot; only show when route is not '/' and the slot is provided -->
      <template v-if="showHeader">
        <v-sheet
          height="220"
          elevation="0"
          class="d-flex align-center justify-center"
          :style="{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.45)), url(${imageBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            marginTop: '64px',
          }"
        >
          <slot name="hero" />
        </v-sheet>
      </template>

      <v-main>
        <div class="d-flex align-center justify-center landing-parallax" style="height: 100%;">
          <template v-if="!props.hideBg">
            <div class="landing-bg" :style="{ backgroundImage: 'url(' + imageBg + ')' }"></div>
          </template>
          <slot name="content" />
        </div>
      </v-main>

      <FooterNavigation />
    </v-app>
  </v-responsive>
</template>

<style scoped>
.landing-parallax::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
}

.landing-parallax {
  position: relative;
  overflow: hidden;
}

.landing-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-size: cover;
  background-position: center center;
  background-repeat: no-repeat;
  will-change: transform;
  transform-origin: center center;
  animation: landing-zoom 25s ease-in-out infinite;
  z-index: 0;
}

/* keep content above the background */
.landing-parallax > *:not(.landing-bg) {
  position: relative;
  z-index: 1;
}

@keyframes landing-zoom {
  0% {
    transform: scale(1);
  }
  100% {
    transform: scale(1.25);
  }
}

@media (prefers-reduced-motion: reduce) {
  .landing-bg {
    animation: none;
  }
}
</style>
