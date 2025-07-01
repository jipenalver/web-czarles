<script setup lang="ts">
import { getAvatarText } from '@/utils/helpers/others'
import { useLogsStore } from '@/stores/logs'
import { useDate } from 'vuetify'
import { onMounted } from 'vue'

const props = defineProps<{
  itemId?: number
  type: 'rates' | 'benefits'
  maxHeight?: string
}>()

const date = useDate()

const logsStore = useLogsStore()

onMounted(async () => {
  if (props.itemId) await logsStore.getLogsById(props.itemId, props.type)
})
</script>

<template>
  <h2 class="text-body-1 font-weight-black mb-3 ms-2">Adjustment Logs</h2>

  <div class="overflow-x-auto" :style="{ maxHeight: props.maxHeight || '300px' }">
    <v-list lines="one" density="compact" nav>
      <v-list-item v-for="log in logsStore.logsByEmployee" :key="log.id">
        <template #prepend>
          <v-avatar
            v-if="log.user_avatar"
            :image="log.user_avatar"
            color="primary"
            size="small"
          ></v-avatar>

          <v-avatar v-else color="primary" size="small">
            <span class="text-caption">
              {{ getAvatarText(log.user_fullname) }}
            </span>
          </v-avatar>
        </template>

        <v-list-item-title>
          <p class="text-caption text-wrap">{{ log.description }}</p>
        </v-list-item-title>
        <v-list-item-subtitle>
          {{ log.user_fullname }}
        </v-list-item-subtitle>

        <template #append>
          <div class="d-flex flex-column align-end text-caption">
            <span>{{ date.format(log.created_at, 'fullDate') }}</span>
            <span>{{ date.format(log.created_at, 'fullTime') }}</span>
          </div>
        </template>
      </v-list-item>
    </v-list>
  </div>
</template>
