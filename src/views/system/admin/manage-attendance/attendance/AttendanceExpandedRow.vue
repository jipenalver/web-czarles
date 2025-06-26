<script setup lang="ts">
import { getTime, getTotalWorkHours } from '@/utils/helpers/others'
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
          <p class="text-body-2 font-weight-bold">
            {{
              getTotalWorkHours(
                props.itemData.am_time_in,
                props.itemData.am_time_out,
                props.itemData.pm_time_in,
                props.itemData.pm_time_out,
              )
            }}
          </p>
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
            <p class="text-body-2">{{ props.itemData.is_overtime_applied ? 'Yes' : 'No' }}</p>
          </v-col>

          <v-col
            cols="12"
            sm="6"
            class="d-flex align-center my-2"
            :class="mobile ? 'justify-space-between' : 'justify-start'"
          >
            <span class="text-body-2 font-weight-bold me-2">Overtime:</span>
            <p class="text-body-2 font-weight-bold">
              {{
                getTotalWorkHours(
                  props.itemData.overtime_in,
                  props.itemData.overtime_out,
                  null,
                  null,
                )
              }}
            </p>
          </v-col>

          <v-col
            cols="12"
            sm="6"
            class="d-flex align-center my-2"
            :class="mobile ? 'justify-space-between' : 'justify-start'"
          >
            <span class="text-body-2 font-weight-bold me-2">Overtime - Time In:</span>
            <v-chip class="font-weight-black" color="secondary" size="small">
              {{ props.itemData.overtime_in ? getTime(props.itemData.overtime_in) : 'n/a' }}
            </v-chip>
          </v-col>

          <v-col
            cols="12"
            sm="6"
            class="d-flex align-center my-2"
            :class="mobile ? 'justify-space-between' : 'justify-start'"
          >
            <span class="text-body-2 font-weight-bold me-2">Overtime - Time Out:</span>
            <v-chip class="font-weight-black" color="secondary" size="small">
              {{ props.itemData.overtime_out ? getTime(props.itemData.overtime_out) : 'n/a' }}
            </v-chip>
          </v-col>

          <v-col
            cols="12"
            sm="6"
            class="d-flex align-center my-2"
            :class="mobile ? 'justify-space-between' : 'justify-start'"
          >
            <span class="text-body-2 font-weight-bold me-2">Overtime - Time In:</span>
            <v-chip
              class="font-weight-black"
              :color="props.itemData.is_overtime_in_rectified ? 'error' : 'success'"
              size="small"
            >
              {{ props.itemData.is_overtime_in_rectified ? 'Rectified' : 'Not Rectified' }}
            </v-chip>
          </v-col>

          <v-col
            cols="12"
            sm="6"
            class="d-flex align-center my-2"
            :class="mobile ? 'justify-space-between' : 'justify-start'"
          >
            <span class="text-body-2 font-weight-bold me-2">Overtime - Time Out:</span>
            <v-chip
              class="font-weight-black"
              :color="props.itemData.is_overtime_out_rectified ? 'error' : 'success'"
              size="small"
            >
              {{ props.itemData.is_overtime_out_rectified ? 'Rectified' : 'Not Rectified' }}
            </v-chip>
          </v-col>
        </template>

        <v-divider class="my-3" thickness="1"></v-divider>
      </v-row>
    </td>
  </tr>
</template>
