<script setup lang="ts">
import { getDateWithWeekday, getTime, getRandomCode } from '@/utils/helpers/others'
import ConfirmFieldDialog from '@/components/common/ConfirmFieldDialog.vue'
import OvertimeFormDialog from '../overtime/OvertimeFormDialog.vue'
import AttendanceExpandedRow from './AttendanceExpandedRow.vue'
import AttendanceFormDialog from './AttendanceFormDialog.vue'
import AttendanceViewDialog from './AttendanceViewDialog.vue'
import LeaveFormDialog from '../leave/LeaveFormDialog.vue'
import AppAlert from '@/components/common/AppAlert.vue'
import { useAttendanceTable } from './attendanceTable'
import { useDisplay } from 'vuetify'

const props = defineProps<{
  componentView: 'attendance' | 'leave' | 'overtime'
}>()

const { mobile } = useDisplay()

const {
  tableHeaders,
  tableOptions,
  tableFilters,
  isDialogVisible,
  isViewDialogVisible,
  isLeaveDialogVisible,
  isOvertimeDialogVisible,
  isConfirmDeleteDialog,
  itemData,
  formAction,
  viewType,
  onAdd,
  onView,
  onUpdate,
  onLeave,
  onOvertime,
  onDelete,
  onConfirmDelete,
  onFilterItems,
  onLoadItems,
  hasAttendanceImage,
  attendancesStore,
  employeesStore,
} = useAttendanceTable(props)
</script>

<template>
  <AppAlert
    v-model:is-alert-visible="formAction.formAlert"
    :form-message="formAction.formMessage"
    :form-status="formAction.formStatus"
  ></AppAlert>

  <v-card>
    <v-card-text>
      <!-- eslint-disable vue/valid-v-slot -->
      <v-data-table-server
        v-model:items-per-page="tableOptions.itemsPerPage"
        v-model:page="tableOptions.page"
        v-model:sort-by="tableOptions.sortBy"
        :loading="tableOptions.isLoading"
        :headers="tableHeaders"
        :items="attendancesStore.attendancesTable"
        :items-length="attendancesStore.attendancesTableTotal"
        @update:options="onLoadItems"
        :hide-default-header="mobile"
        :mobile="mobile"
        show-expand
      >
        <template #top>
          <v-row dense>
            <v-spacer></v-spacer>

            <v-col cols="12" sm="4">
              <v-autocomplete
                v-model="tableFilters.employee_id"
                :items="employeesStore.employees"
                density="compact"
                label="Filter by Employee"
                item-title="label"
                item-value="id"
                clearable
                @update:model-value="onFilterItems"
              ></v-autocomplete>
            </v-col>

            <template v-if="props.componentView === 'attendance'">
              <v-col cols="12" sm="3">
                <v-btn class="my-1" prepend-icon="mdi-plus" color="primary" block @click="onAdd">
                  Add Attendance
                </v-btn>
              </v-col>
            </template>
            <template v-else-if="props.componentView === 'leave'">
              <v-col cols="12" sm="3">
                <v-btn
                  class="my-1"
                  prepend-icon="mdi-account-arrow-left"
                  color="primary"
                  block
                  @click="onLeave(null)"
                >
                  Apply Leave
                </v-btn>
              </v-col>
            </template>
          </v-row>

          <v-divider class="my-5"></v-divider>
        </template>

        <template #item.employee="{ item }">
          <span class="font-weight-bold">
            {{ item.employee.lastname + ', ' + item.employee.firstname }}
          </span>
        </template>

        <template #item.date="{ item }">
          <span class="font-weight-bold">
            {{ item.date ? getDateWithWeekday(item.date) : '-' }}
          </span>
        </template>

        <template #item.am_time_in="{ item }">
          <span v-if="item.is_pm_leave && !item.is_am_leave">-</span>
          <span v-else-if="item.is_am_leave" class="font-weight-bold text-secondary">
            {{ item.leave_type }}
          </span>
          <span
            v-else-if="item.am_time_in && !hasAttendanceImage(item.attendance_images, 'am_time_in')"
            class="font-weight-bold"
          >
            {{ getTime(item.am_time_in) }}
          </span>
          <span
            v-else-if="item.am_time_in && hasAttendanceImage(item.attendance_images, 'am_time_in')"
            class="font-weight-bold cursor-pointer text-decoration-underline"
            @click="onView(item, 'am_time_in')"
          >
            {{ getTime(item.am_time_in) }}
          </span>
          <span v-else>-</span>
        </template>

        <template #item.am_time_out="{ item }">
          <span v-if="item.is_am_leave" class="font-weight-bold text-secondary">
            {{ item.leave_type }}
          </span>
          <span
            v-else-if="
              item.am_time_out && !hasAttendanceImage(item.attendance_images, 'am_time_out')
            "
            class="font-weight-bold"
          >
            {{ getTime(item.am_time_out) }}
          </span>
          <span
            v-else-if="
              item.am_time_out && hasAttendanceImage(item.attendance_images, 'am_time_out')
            "
            class="font-weight-bold cursor-pointer text-decoration-underline"
            @click="onView(item, 'am_time_out')"
          >
            {{ getTime(item.am_time_out) }}
          </span>
          <span v-else>-</span>
        </template>

        <template #item.pm_time_in="{ item }">
          <span v-if="item.is_pm_leave" class="font-weight-bold text-secondary">
            {{ item.leave_type }}
          </span>
          <span
            v-else-if="item.pm_time_in && !hasAttendanceImage(item.attendance_images, 'pm_time_in')"
            class="font-weight-bold cursor-pointer"
          >
            {{ getTime(item.pm_time_in) }}
          </span>
          <span
            v-else-if="item.pm_time_in && hasAttendanceImage(item.attendance_images, 'pm_time_in')"
            class="font-weight-bold cursor-pointer text-decoration-underline"
            @click="onView(item, 'pm_time_in')"
          >
            {{ getTime(item.pm_time_in) }}
          </span>
          <span v-else>-</span>
        </template>

        <template #item.pm_time_out="{ item }">
          <span v-if="item.is_pm_leave" class="font-weight-bold text-secondary">
            {{ item.leave_type }}
          </span>
          <span
            v-else-if="
              item.pm_time_out && !hasAttendanceImage(item.attendance_images, 'pm_time_out')
            "
            class="font-weight-bold"
          >
            {{ getTime(item.pm_time_out) }}
          </span>
          <span
            v-else-if="
              item.pm_time_out && hasAttendanceImage(item.attendance_images, 'pm_time_out')
            "
            class="font-weight-bold cursor-pointer text-decoration-underline"
            @click="onView(item, 'pm_time_out')"
          >
            {{ getTime(item.pm_time_out) }}
          </span>
          <span v-else>-</span>
        </template>

        <template #item.is_overtime_applied="{ item }">
          <span
            class="font-weight-bold"
            :class="item.is_overtime_applied ? 'text-success' : 'text-error'"
          >
            {{ item.is_overtime_applied ? 'Yes' : 'No' }}
          </span>
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex align-center" :class="mobile ? 'justify-end' : 'justify-center'">
            <template v-if="props.componentView === 'attendance'">
              <v-btn variant="text" density="comfortable" @click="onUpdate(item)" icon>
                <v-icon icon="mdi-pencil"></v-icon>
                <v-tooltip activator="parent" location="top">Rectify Attendance</v-tooltip>
              </v-btn>

              <v-btn variant="text" density="comfortable" @click="onDelete(item.id)" icon>
                <v-icon icon="mdi-trash-can" color="secondary"></v-icon>
                <v-tooltip activator="parent" location="top">Delete Attendance</v-tooltip>
              </v-btn>
            </template>

            <template v-else-if="props.componentView === 'leave'">
              <v-btn
                v-if="
                  !(item.am_time_in && item.am_time_out) || !(item.pm_time_in && item.pm_time_out)
                "
                variant="text"
                density="comfortable"
                icon
                @click="onLeave(item)"
              >
                <v-icon icon="mdi-pencil"></v-icon>
                <v-tooltip activator="parent" location="top">Apply Leave</v-tooltip>
              </v-btn>
            </template>

            <template v-else-if="props.componentView === 'overtime'">
              <v-btn
                v-if="!item.is_am_leave || !item.is_pm_leave"
                variant="text"
                density="comfortable"
                @click="onOvertime(item)"
                icon
              >
                <v-icon icon="mdi-clock-plus" color="secondary"></v-icon>
                <v-tooltip activator="parent" location="top">Apply Overtime</v-tooltip>
              </v-btn>
            </template>
          </div>
        </template>

        <template #item.data-table-expand="{ internalItem, isExpanded, toggleExpand }">
          <v-btn
            class="text-none"
            size="small"
            variant="text"
            :append-icon="isExpanded(internalItem) ? 'mdi-chevron-up' : 'mdi-chevron-down'"
            :text="isExpanded(internalItem) ? 'Collapse' : 'More Info'"
            @click="toggleExpand(internalItem)"
            border
            slim
          ></v-btn>
        </template>

        <template #expanded-row="{ columns, item }">
          <AttendanceExpandedRow
            :component-view="props.componentView"
            :columns-length="columns.length"
            :item-data="item"
          ></AttendanceExpandedRow>
        </template>
      </v-data-table-server>
    </v-card-text>
  </v-card>

  <AttendanceFormDialog
    v-model:is-dialog-visible="isDialogVisible"
    :item-data="itemData"
    :table-options="tableOptions"
    :table-filters="tableFilters"
  ></AttendanceFormDialog>

  <LeaveFormDialog
    v-model:is-dialog-visible="isLeaveDialogVisible"
    :item-data="itemData"
    :table-options="tableOptions"
    :table-filters="tableFilters"
  ></LeaveFormDialog>

  <OvertimeFormDialog
    v-model:is-dialog-visible="isOvertimeDialogVisible"
    :item-data="itemData"
    :table-options="tableOptions"
    :table-filters="tableFilters"
  ></OvertimeFormDialog>

  <AttendanceViewDialog
    v-model:is-dialog-visible="isViewDialogVisible"
    :item-data="itemData"
    :view-type="viewType"
  ></AttendanceViewDialog>

  <ConfirmFieldDialog
    v-model:is-dialog-visible="isConfirmDeleteDialog"
    title="Confirm Delete"
    subtitle="Are you sure you want to delete this attendance?"
    :confirm-text="getRandomCode(6, true)"
    @confirm="onConfirmDelete"
  ></ConfirmFieldDialog>
</template>
