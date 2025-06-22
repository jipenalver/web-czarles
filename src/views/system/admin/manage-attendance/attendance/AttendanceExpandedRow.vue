<script setup lang="ts">
import { type Attendance } from '@/stores/attendances'
import { useDisplay } from 'vuetify'
import { useDate } from 'vuetify'

const props = defineProps<{
  columnsLength: number
  itemData: Attendance
}>()

const date = useDate()
const { mobile } = useDisplay()
</script>

<template>
  <tr>
    <td :colspan="props.columnsLength" class="py-2">
      <v-row dense>
        <v-col
          cols="12"
          sm="6"
          class="d-flex align-center my-2"
          :class="mobile ? 'justify-space-between' : 'justify-start'"
        >
          <span class="text-body-2 font-weight-bold me-2">Rendered Time:</span>
          <span class="text-body-2">
            {{ date.getDiff(props.itemData.am_time_in, props.itemData.am_time_out, 'hours') }} hours
          </span>
        </v-col>

        <v-col
          cols="12"
          sm="6"
          class="d-flex align-center my-2"
          :class="mobile ? 'justify-space-between' : 'justify-start'"
        >
          <span class="text-body-2 font-weight-bold me-2">Undertime:</span>
          <span></span>
        </v-col>

        <v-col
          cols="12"
          sm="6"
          class="d-flex align-center my-2"
          :class="mobile ? 'justify-space-between' : 'justify-start'"
        >
          <span class="text-body-2 font-weight-bold me-2">Is Overtime Applied:</span>
          <span></span>
        </v-col>

        <v-col
          cols="12"
          sm="6"
          class="d-flex align-center my-2"
          :class="mobile ? 'justify-space-between' : 'justify-start'"
        >
          <span class="text-body-2 font-weight-bold me-2">Overtime:</span>
          <span></span>
        </v-col>

        <v-col
          cols="12"
          sm="3"
          class="d-flex align-center my-2"
          :class="mobile ? 'justify-space-between' : 'justify-start'"
        >
          <span class="text-body-2 font-weight-bold me-2">AM - Time In:</span>
          <v-chip
            class="font-weight-black"
            :color="props.itemData.is_am_in_rectified ? 'error' : 'success'"
            size="small"
          >
            {{ props.itemData.is_am_in_rectified ? 'Rectified' : 'Not Rectified' }}
          </v-chip>
        </v-col>

        <v-col
          cols="12"
          sm="3"
          class="d-flex align-center my-2"
          :class="mobile ? 'justify-space-between' : 'justify-start'"
        >
          <span class="text-body-2 font-weight-bold me-2">AM - Time Out:</span>
          <v-chip
            class="font-weight-black"
            :color="props.itemData.is_am_out_rectified ? 'error' : 'success'"
            size="small"
          >
            {{ props.itemData.is_am_out_rectified ? 'Rectified' : 'Not Rectified' }}
          </v-chip>
        </v-col>

        <v-col
          cols="12"
          sm="3"
          class="d-flex align-center my-2"
          :class="mobile ? 'justify-space-between' : 'justify-start'"
        >
          <span class="text-body-2 font-weight-bold me-2">PM - Time In:</span>
          <v-chip
            class="font-weight-black"
            :color="props.itemData.is_pm_in_rectified ? 'error' : 'success'"
            size="small"
          >
            {{ props.itemData.is_pm_in_rectified ? 'Rectified' : 'Not Rectified' }}
          </v-chip>
        </v-col>

        <v-col
          cols="12"
          sm="3"
          class="d-flex align-center my-2"
          :class="mobile ? 'justify-space-between' : 'justify-start'"
        >
          <span class="text-body-2 font-weight-bold me-2">PM - Time Out:</span>
          <v-chip
            class="font-weight-black"
            :color="props.itemData.is_pm_out_rectified ? 'error' : 'success'"
            size="small"
          >
            {{ props.itemData.is_pm_out_rectified ? 'Rectified' : 'Not Rectified' }}
          </v-chip>
        </v-col>
      </v-row>
    </td>
  </tr>
</template>
