<script setup lang="ts">
// import TopProfileNavigation from './navigation/TopProfileNavigation.vue'
// import LogoBd from '@images/logos/bd-logo-with-text.png'
// import { useAuthUserStore } from '@/stores/authUser'
import { onMounted, ref } from 'vue'
import { useDisplay } from 'vuetify'

const props = defineProps<{
  isWithAppBarIcon?: boolean
}>()

const emit = defineEmits(['isDrawerVisible', 'theme'])

const { mobile, xs } = useDisplay()

// const authUserStore = useAuthUserStore()

const isLoggedIn = ref(false)
const theme = ref(localStorage.getItem('theme') ?? 'light')

function onToggleTheme() {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
  localStorage.setItem('theme', theme.value)
  emit('theme', theme.value)
}

onMounted(() => {
  // isLoggedIn.value = authUserStore.isAuthenticated()
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
            <!-- <v-img max-width="228" :src="LogoBd"></v-img> -->
          </RouterLink>
        </v-app-bar-title>

        <v-btn
          class="me-2"
          :icon="theme === 'light' ? 'mdi-weather-night' : 'mdi-weather-sunny'"
          @click="onToggleTheme"
        ></v-btn>

        <template v-if="isLoggedIn">
          <!-- <TopProfileNavigation></TopProfileNavigation> -->
        </template>

        <template v-else>
          <div v-if="mobile" class="d-flex align-center ga-1">
            <v-menu>
              <template v-slot:activator="{ props }">
                <v-btn icon="mdi-dots-vertical" variant="text" v-bind="props"></v-btn>
              </template>

              <v-list>
                <v-list-item prepend-icon="mdi-login" to="/login">
                  <v-list-item-title class="font-weight-bold text-uppercase">
                    Sign In
                  </v-list-item-title>
                </v-list-item>

                <v-list-item
                  prepend-icon="mdi-account-plus"
                  class="bg-primary"
                  rounded="lg"
                  to="/register"
                >
                  <v-list-item-title class="font-weight-bold text-uppercase">
                    Sign Up
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </div>

          <div v-else class="d-flex align-center ga-5">
            <v-btn prepend-icon="mdi-login" rounded="lg" to="/login"> Sign In </v-btn>

            <v-btn
              prepend-icon="mdi-account-plus"
              color="primary"
              variant="elevated"
              rounded="lg"
              to="/register"
            >
              Sign Up
            </v-btn>
          </div>
        </template>
      </v-app-bar>

      <slot name="navigation"></slot>

      <v-main>
        <slot name="content"></slot>
      </v-main>

      <v-footer :class="mobile ? 'd-flex flex-column' : 'd-flex justify-between'" border app>
        <div class="font-weight-bold text-center">Czarles Construction and Supplies</div>

        <div :class="xs ? '' : 'd-flex align-center'"></div>
      </v-footer>
    </v-app>
  </v-responsive>
</template>
