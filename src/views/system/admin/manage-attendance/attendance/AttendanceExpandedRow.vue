<script setup lang="ts">
import { getTotalWorkHours } from '@/utils/helpers/others'
import { type Attendance } from '@/stores/attendances'
import { useDisplay } from 'vuetify'

const props = defineProps<{
  componentView: 'attendance' | 'leave'
  columnsLength: number
  itemData: Attendance
}>()

const { mobile } = useDisplay()
</script>

<template>
  <tr>
    <td :colspan="props.columnsLength" class="py-2">
      <v-row :class="mobile ? '' : 'px-4'" :no-gutters="!mobile" dense>
        <v-col
          cols="12"
          sm="6"
          class="d-flex align-center my-2"
          :class="mobile ? 'justify-space-between' : 'justify-start'"
        >
          <span class="text-body-2 font-weight-bold me-2">Rendered Time:</span>
          <span class="text-body-2 font-weight-bold text-secondary">
            {{
              getTotalWorkHours(
                props.itemData.am_time_in,
                props.itemData.am_time_out,
                props.itemData.pm_time_in,
                props.itemData.pm_time_out,
              )
            }}
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

        <template v-if="props.componentView === 'leave'">
          <v-divider class="my-3" thickness="1"></v-divider>

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
        </template>

        <v-divider class="my-3" thickness="1"></v-divider>
      </v-row>
    </td>
  </tr>
</template>
