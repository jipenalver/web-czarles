<script setup lang="ts">
import { type Attendance } from '@/stores/attendances'
// import { useDisplay } from 'vuetify'
// import { useDate } from 'vuetify'

const props = defineProps<{
  columnsLength: number
  itemData: Attendance
}>()

// const date = useDate()
// const { mobile } = useDisplay()
</script>

<template>
  <tr>
    <td :colspan="props.columnsLength" class="py-2">
      <v-row dense> </v-row>
    </td>
  </tr>
</template>
