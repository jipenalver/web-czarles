<script setup lang="ts">
import {
  type MainNavigation,
  type SubNavigation,
  adminNav,
  adminItemsNav1,
  adminItemsNav2,
  adminItemsNav3,
  adminItemsNav4,
  settingsItemsNav,
} from './sideNavigation'
import { useAuthUserStore } from '@/stores/authUser'
import { onMounted, ref } from 'vue'
import { useDisplay } from 'vuetify'

const props = defineProps<{
  isDrawerVisible: boolean
}>()

const { mobile } = useDisplay()

const authUserStore = useAuthUserStore()

const noAccessPages = ref<string[]>([])
const mainNav = ref<MainNavigation[] | SubNavigation[]>([])
const editableItemsNav1 = ref<SubNavigation[]>([...adminItemsNav1])
const editableItemsNav2 = ref<SubNavigation[]>([...adminItemsNav2])
const editableItemsNav3 = ref<SubNavigation[]>([...adminItemsNav3])
const editableItemsNav4 = ref<SubNavigation[]>([...adminItemsNav4])

onMounted(() => {
  mainNav.value = adminNav

  if (authUserStore.userRole === 'Super Administrator') return

  const menuItems = [
    { items: editableItemsNav1, title: adminNav[0][0] },
    { items: editableItemsNav2, title: adminNav[1][0] },
    { items: editableItemsNav3, title: adminNav[2][0] },
    { items: editableItemsNav4, title: adminNav[3][0] },
  ]

  menuItems.forEach(({ items, title }) => {
    if (!items.value) return

    items.value = items.value.filter((item) => authUserStore.authPages.includes(item[3]))

    if (items.value.length === 0) noAccessPages.value.push(title)
  })
})
</script>

<template>
  <v-navigation-drawer
    :model-value="props.isDrawerVisible"
    :persistent="mobile"
    :temporary="mobile"
    :permanent="!mobile"
    :width="300"
  >
    <v-list density="compact" lines="one" nav>
      <v-list-item
        prepend-icon="mdi-view-dashboard"
        to="/dashboard"
        color="primary"
        variant="flat"
        slim
      >
        <template #title>
          <span class="font-weight-black"> Dashboard </span>
        </template>
      </v-list-item>

      <v-divider></v-divider>

      <v-list-group v-for="([title, icon], i) in mainNav" :key="i">
        <template #activator="{ props }" v-if="!noAccessPages.includes(title)">
          <v-list-item v-bind="props" :prepend-icon="icon" color="primary" variant="flat" slim>
            <template #title>
              <span class="font-weight-black">
                {{ title }}
              </span>
            </template>
          </v-list-item>
        </template>

        <template v-if="mainNav[0] && title === mainNav[0][0]">
          <v-list-item
            v-for="([title, icon, subtitle, to], i) in editableItemsNav1"
            :key="i"
            :prepend-icon="icon"
            :subtitle="subtitle ?? undefined"
            :to="to ?? undefined"
            color="primary"
            variant="flat"
            slim
          >
            <template #title>
              <span class="font-weight-black"> {{ title }} </span>
            </template>
          </v-list-item>
        </template>

        <template v-if="mainNav[1] && title === mainNav[1][0]">
          <v-list-item
            v-for="([title, icon, subtitle, to], i) in editableItemsNav2"
            :key="i"
            :prepend-icon="icon"
            :subtitle="subtitle ?? undefined"
            :to="to ?? undefined"
            color="primary"
            variant="flat"
            slim
          >
            <template #title>
              <span class="font-weight-black"> {{ title }} </span>
            </template>
          </v-list-item>
        </template>

        <template v-if="mainNav[2] && title === mainNav[2][0]">
          <v-list-item
            v-for="([title, icon, subtitle, to], i) in editableItemsNav3"
            :key="i"
            :prepend-icon="icon"
            :subtitle="subtitle ?? undefined"
            :to="to ?? undefined"
            color="primary"
            variant="flat"
            slim
          >
            <template #title>
              <span class="font-weight-black"> {{ title }} </span>
            </template>
          </v-list-item>
        </template>

        <template v-if="mainNav[3] && title === mainNav[3][0]">
          <v-list-item
            v-for="([title, icon, subtitle, to], i) in editableItemsNav4"
            :key="i"
            :prepend-icon="icon"
            :subtitle="subtitle ?? undefined"
            :to="to ?? undefined"
            color="primary"
            variant="flat"
            slim
          >
            <template #title>
              <span class="font-weight-black"> {{ title }} </span>
            </template>
          </v-list-item>
        </template>
      </v-list-group>

      <v-divider></v-divider>

      <v-list-group>
        <template #activator="{ props }">
          <v-list-item v-bind="props" prepend-icon="mdi-wrench" color="primary" variant="flat" slim>
            <template #title>
              <span class="font-weight-black"> Settings </span>
            </template>
          </v-list-item>
        </template>

        <v-list-item
          v-for="([title, icon, subtitle, to], i) in settingsItemsNav"
          :key="i"
          :prepend-icon="icon"
          :subtitle="subtitle ?? undefined"
          :to="to ?? undefined"
          color="primary"
          variant="flat"
          slim
        >
          <template #title>
            <span class="font-weight-black"> {{ title }} </span>
          </template>
        </v-list-item>
      </v-list-group>
    </v-list>
  </v-navigation-drawer>
</template>
