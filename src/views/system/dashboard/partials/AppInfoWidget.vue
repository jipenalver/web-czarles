<script setup lang="ts">
import { supabase } from '@/utils/supabase'
import { onMounted, ref } from 'vue'

const appVersion = ref('1.0.0')

const getAppVersion = async () => {
  const { data } = await supabase.from('app_version').select().eq('id', 1)

  appVersion.value = (data as { app_latest_version: string }[])[0].app_latest_version
}

onMounted(async () => {
  await getAppVersion()
})
</script>

<template>
  <v-card elevation="8">
    <v-card-text class="text-center d-flex justify-center align-center">
      <v-chip class="me-5" color="primary">
        <v-icon icon="mdi-cellphone-information"></v-icon>
      </v-chip>

      <h2 class="text-h3">{{ appVersion }}</h2>

      <div class="ms-5">
        <p class="mb-3">Mobile App Version</p>

        <v-chip class="font-weight-bold" density="compact" color="primary"> Latest Version </v-chip>
      </div>
    </v-card-text>
  </v-card>
</template>
