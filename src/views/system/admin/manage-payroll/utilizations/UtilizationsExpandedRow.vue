<script setup lang="ts">
import {
  getOvertimeHoursDecimal,
  getOvertimeHoursString,
  getWorkHoursDecimal,
  getWorkHoursString,
} from '@/utils/helpers/attendance'
import { type Utilization } from '@/stores/utilizations'
import { useEmployeesStore } from '@/stores/employees'
import { getTime } from '@/utils/helpers/dates'
import { useDisplay } from 'vuetify'
import { computed } from 'vue'

const props = defineProps<{
  columnsLength: number
  itemData: Utilization
}>()

const { mobile } = useDisplay()

const employeesStore = useEmployeesStore()

const isFieldStaff = computed(() => {
  const employee = employeesStore.employees.find((emp) => emp.id === props.itemData.employee_id)
  return employee?.is_field_staff || false
})
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
          <span class="text-body-2 font-weight-bold me-2">AM - Time In:</span>
          <span class="font-weight-bold">
            {{ getTime(props.itemData.am_time_in) }}
          </span>
        </v-col>

        <v-col
          cols="12"
          sm="6"
          class="d-flex align-center my-2"
          :class="mobile ? 'justify-space-between' : 'justify-start'"
        >
          <span class="text-body-2 font-weight-bold me-2">AM - Time Out:</span>
          <span class="font-weight-bold">
            {{ getTime(props.itemData.am_time_out) }}
          </span>
        </v-col>

        <v-col
          cols="12"
          sm="6"
          class="d-flex align-center my-2"
          :class="mobile ? 'justify-space-between' : 'justify-start'"
        >
          <span class="text-body-2 font-weight-bold me-2">PM - Time In:</span>
          <span class="font-weight-bold">
            {{ getTime(props.itemData.pm_time_in) }}
          </span>
        </v-col>

        <v-col
          cols="12"
          sm="6"
          class="d-flex align-center my-2"
          :class="mobile ? 'justify-space-between' : 'justify-start'"
        >
          <span class="text-body-2 font-weight-bold me-2">PM - Time Out:</span>
          <span class="font-weight-bold">
            {{ getTime(props.itemData.pm_time_out) }}
          </span>
        </v-col>

        <v-col
          cols="12"
          class="d-flex align-center my-2"
          :class="mobile ? 'justify-space-between' : 'justify-start'"
        >
          <span class="text-body-2 font-weight-bold me-2">Rendered Time:</span>
          <p class="text-body-2">
            {{
              getWorkHoursString(
                props.itemData.am_time_in,
                props.itemData.am_time_out,
                props.itemData.pm_time_in,
                props.itemData.pm_time_out,
                isFieldStaff,
              )
            }}

            <span class="text-caption font-weight-black">
              ({{
                getWorkHoursDecimal(
                  props.itemData.am_time_in,
                  props.itemData.am_time_out,
                  props.itemData.pm_time_in,
                  props.itemData.pm_time_out,
                  isFieldStaff,
                )
              }})
            </span>
          </p>
        </v-col>

        <template v-if="props.itemData.overtime_hours">
          <v-divider class="my-3" thickness="1"></v-divider>

          <v-col
            cols="12"
            sm="6"
            class="d-flex align-center my-2"
            :class="mobile ? 'justify-space-between' : 'justify-start'"
          >
            <span class="text-body-2 font-weight-bold me-2">Overtime - Time In:</span>
            <span class="font-weight-bold">
              {{ getTime(props.itemData.overtime_in) }}
            </span>
          </v-col>

          <v-col
            cols="12"
            sm="6"
            class="d-flex align-center my-2"
            :class="mobile ? 'justify-space-between' : 'justify-start'"
          >
            <span class="text-body-2 font-weight-bold me-2">Overtime - Time Out:</span>
            <span class="font-weight-bold">
              {{ getTime(props.itemData.overtime_out) }}
            </span>
          </v-col>

          <v-col
            cols="12"
            class="d-flex align-center my-2"
            :class="mobile ? 'justify-space-between' : 'justify-start'"
          >
            <span class="text-body-2 font-weight-bold me-2">Rendered Overtime:</span>
            <p class="text-body-2">
              {{ getOvertimeHoursString(props.itemData.overtime_in, props.itemData.overtime_out) }}

              <span class="text-caption font-weight-black">
                ({{
                  getOvertimeHoursDecimal(props.itemData.overtime_in, props.itemData.overtime_out)
                }})
              </span>
            </p>
          </v-col>
        </template>

        <v-divider class="my-3" thickness="1"></v-divider>
      </v-row>
    </td>
  </tr>
</template>
