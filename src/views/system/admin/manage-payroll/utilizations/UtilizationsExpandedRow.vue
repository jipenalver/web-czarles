<script setup lang="ts">
import { type Utilization } from '@/stores/utilizations'
import { useDisplay } from 'vuetify'

const props = defineProps<{
  columnsLength: number
  itemData: Utilization
}>()

const { mobile } = useDisplay()
</script>

<template>
  <tr>
    <td :colspan="props.columnsLength" class="py-2">
      <v-row :class="mobile ? '' : 'px-4'" :no-gutters="!mobile" dense>
        <v-divider class="my-3" thickness="1"></v-divider>
      </v-row>
    </td>
  </tr>
</template>
