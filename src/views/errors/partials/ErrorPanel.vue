<script setup lang="ts">
import SideNavigation from '@/components/layout/navigation/SideNavigation.vue'
import LogoBdTransparent from '@/assets/logos/logo-czarles.png'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useAuthUserStore } from '@/stores/authUser'
import { onMounted, ref } from 'vue'
import { useDisplay } from 'vuetify'

const props = defineProps<{
  headline: string
  title: string
  text: string
}>()

const { xs } = useDisplay()

const authUserStore = useAuthUserStore()

const isLoggedIn = ref(true)
const isDrawerVisible = ref(xs.value ? false : true)

onMounted(async () => {
  isLoggedIn.value = await authUserStore.isAuthenticated()
})
</script>

<template>
  <AppLayout
    :is-with-app-bar-icon="isLoggedIn"
    @is-drawer-visible="isDrawerVisible = !isDrawerVisible"
  >
    <template #navigation v-if="isLoggedIn">
      <SideNavigation :is-drawer-visible="isDrawerVisible"></SideNavigation>
    </template>

    <template #content>
      <v-container>
        <v-row>
          <v-col class="mx-auto mt-16 text-center" cols="12" xl="4" lg="5">
            <v-empty-state :image="LogoBdTransparent">
              <template #headline>
                <h1 class="text-h1 font-weight-black text-primary">{{ props.headline }}</h1>
              </template>

              <template #title>
                <h2 class="text-h2 font-weight-black mb-2">{{ props.title }}</h2>
              </template>

              <template #text>
                <p class="text-subtitle-1 font-weight-bold mb-4">{{ props.text }}</p>
              </template>
            </v-empty-state>

            <v-btn prepend-icon="mdi-home" color="primary" variant="elevated" rounded="lg" to="/">
              Back to {{ isLoggedIn ? 'Dashboard' : 'Homepage' }}
            </v-btn>
          </v-col>
        </v-row>
      </v-container>
    </template>
  </AppLayout>
</template>
