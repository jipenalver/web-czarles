<script setup lang="ts">
import {
  getLateUndertimeHoursDecimal,
  getLateUndertimeHoursString,
  getOvertimeHoursDecimal,
  getOvertimeHoursString,
  getWorkHoursDecimal,
  getWorkHoursString,
} from '@/utils/helpers/attendance'
import AttendanceViewDialog from './AttendanceViewDialog.vue'
import { type Attendance } from '@/stores/attendances'
import { useAttendanceTable } from './attendanceTable'
import { useEmployeesStore } from '@/stores/employees'
import { getTime } from '@/utils/helpers/dates'
import { useDisplay } from 'vuetify'
import { computed } from 'vue'

const props = defineProps<{
  componentView: 'attendance' | 'leave' | 'overtime'
  columnsLength: number
  itemData: Attendance
}>()

const { mobile } = useDisplay()

const employeesStore = useEmployeesStore()

const { isViewDialogVisible, viewType, onView, hasAttendanceImage } = useAttendanceTable(props)

// Computed property para sa current employee data
const currentEmployee = computed(() => {
  return employeesStore.employees.find(emp => emp.id === props.itemData.employee_id)
})

// Computed property para check kung field staff
const isCurrentEmployeeFieldStaff = computed(() => {
  return currentEmployee.value?.is_field_staff || false
})

// Function para check kung field staff based sa employee ID
const isFieldStaff = (employeeId: number) => {
  const employee = employeesStore.employees.find(emp => emp.id === employeeId)
  return employee?.is_field_staff || false
}
</script>

<template>
  <tr>
    <td :colspan="props.columnsLength" class="py-2">
      <v-row :class="mobile ? '' : 'px-4'" :no-gutters="!mobile" dense>
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

        <v-col
          cols="12"
          sm="6"
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
                isFieldStaff(props.itemData.employee_id as number),
              )
            }}

            <span class="text-caption font-weight-black">
              ({{
                getWorkHoursDecimal(
                  props.itemData.am_time_in,
                  props.itemData.am_time_out,
                  props.itemData.pm_time_in,
                  props.itemData.pm_time_out,
                  isFieldStaff(props.itemData.employee_id as number),
                )
              }})
            </span>
          </p>
        </v-col>

        <v-col
          cols="12"
          sm="6"
          class="d-flex align-center my-2"
          :class="mobile ? 'justify-space-between' : 'justify-start'"
        >
          <span class="text-body-2 font-weight-bold me-2">Late / Undertime:</span>
          <p class="text-body-2">
            {{
              getLateUndertimeHoursString(
                props.itemData.am_time_in,
                props.itemData.am_time_out,
                props.itemData.pm_time_in,
                props.itemData.pm_time_out,
                isFieldStaff(props.itemData.employee_id as number),
              )
            }}

            <span class="text-caption font-weight-black">
              ({{
                getLateUndertimeHoursDecimal(
                  props.itemData.am_time_in,
                  props.itemData.am_time_out,
                  props.itemData.pm_time_in,
                  props.itemData.pm_time_out,
                  isFieldStaff(props.itemData.employee_id as number),
                )
              }})
            </span>
          </p>
        </v-col>

        <v-col
          cols="12"
          class="d-flex align-center my-2"
          :class="mobile ? 'justify-space-between' : 'justify-start'"
        >
          <span class="text-body-2 font-weight-bold me-2">Is Field Staff?:</span>
          <v-chip class="font-weight-black" color="default" size="small">
            {{ isCurrentEmployeeFieldStaff ? 'Yes' : 'No' }}
          </v-chip>
        </v-col>

        <template v-if="props.componentView === 'overtime'">
          <v-divider class="my-3" thickness="1"></v-divider>

          <v-col
            cols="12"
            sm="6"
            class="d-flex align-center my-2"
            :class="mobile ? 'justify-space-between' : 'justify-start'"
          >
            <span class="text-body-2 font-weight-bold me-2">Overtime - Time In:</span>
            <span
              v-if="
                props.itemData.overtime_in &&
                !hasAttendanceImage(props.itemData.attendance_images, 'overtime_in')
              "
              class="font-weight-bold"
            >
              {{ getTime(props.itemData.overtime_in) }}
            </span>
            <span
              v-else-if="
                props.itemData.overtime_in &&
                hasAttendanceImage(props.itemData.attendance_images, 'overtime_in')
              "
              class="font-weight-bold cursor-pointer text-decoration-underline"
              @click="onView(props.itemData, 'overtime_in')"
            >
              {{ getTime(props.itemData.overtime_in) }}
            </span>
            <span v-else>-</span>
          </v-col>

          <v-col
            cols="12"
            sm="6"
            class="d-flex align-center my-2"
            :class="mobile ? 'justify-space-between' : 'justify-start'"
          >
            <span class="text-body-2 font-weight-bold me-2">Overtime - Time Out:</span>
            <span
              v-if="
                props.itemData.overtime_out &&
                !hasAttendanceImage(props.itemData.attendance_images, 'overtime_out')
              "
              class="font-weight-bold"
            >
              {{ getTime(props.itemData.overtime_out) }}
            </span>
            <span
              v-else-if="
                props.itemData.overtime_out &&
                hasAttendanceImage(props.itemData.attendance_images, 'overtime_out')
              "
              class="font-weight-bold cursor-pointer text-decoration-underline"
              @click="onView(props.itemData, 'overtime_out')"
            >
              {{ getTime(props.itemData.overtime_out) }}
            </span>
            <span v-else>-</span>
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

  <AttendanceViewDialog
    v-model:is-dialog-visible="isViewDialogVisible"
    :item-data="itemData"
    :view-type="viewType"
  ></AttendanceViewDialog>
</template>
