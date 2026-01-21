<script setup lang="ts">
import ConfirmFieldDialog from '@/components/common/ConfirmFieldDialog.vue'
import { useAttendanceRequestsTable } from './attendanceRequestsTable'
import { getDateWithWeekday } from '@/utils/helpers/dates'
// import OvertimeFormDialog from '../overtime/OvertimeFormDialog.vue'
// import AttendanceExpandedRow from './AttendanceExpandedRow.vue'
// import AttendanceTimeValue from './AttendanceTimeValue.vue'
import LeaveFormDialog from '../leave/LeaveFormDialog.vue'
import AppAlert from '@/components/common/AppAlert.vue'
import { getRandomCode } from '@/utils/helpers/others'
import { useDisplay } from 'vuetify'

const props = defineProps<{
  componentView: 'leave-requests' | 'overtime-requests'
}>()

const { smAndDown } = useDisplay()

const {
  tableHeaders,
  tableOptions,
  tableFilters,
  isLeaveDialogVisible,
  // isOvertimeDialogVisible,
  isConfirmDeleteDialog,
  itemData,
  formAction,
  onLeave,
  onOvertime,
  onDelete,
  onConfirmDelete,
  onFilterDate,
  onFilterItems,
  onLoadItems,
  attendanceRequestsStore,
  employeesStore,
} = useAttendanceRequestsTable(props)
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
        :items="attendanceRequestsStore.attendanceRequestsTable"
        :items-length="attendanceRequestsStore.attendanceRequestsTableTotal"
        @update:options="onLoadItems"
        :hide-default-header="smAndDown"
        :mobile="smAndDown"
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

            <v-col cols="12" sm="3">
              <v-date-input
                v-model="tableFilters.attendance_at"
                prepend-icon=""
                prepend-inner-icon="mdi-calendar"
                density="compact"
                label="Attendance Date"
                multiple="range"
                clearable
                @click:clear="onFilterDate(true)"
                @update:model-value="onFilterDate(false)"
              ></v-date-input>
            </v-col>

            <template v-if="props.componentView === 'leave-requests'">
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

            <template v-else-if="props.componentView === 'overtime-requests'">
              <v-col cols="12" sm="3">
                <v-btn
                  class="my-1"
                  prepend-icon="mdi-clock-plus"
                  color="primary"
                  block
                  @click="onOvertime(null)"
                >
                  Apply Overtime
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

        <template #item.actions="{ item }">
          <div class="d-flex align-center" :class="smAndDown ? 'justify-end' : 'justify-center'">
            <template v-if="props.componentView === 'leave-requests'">
              <v-btn variant="text" density="comfortable" icon @click="onLeave(item)">
                <v-icon icon="mdi-account-arrow-left"></v-icon>
                <v-tooltip activator="parent" location="top">Edit Leave</v-tooltip>
              </v-btn>

              <v-btn variant="text" density="comfortable" @click="onDelete(item.id)" icon>
                <v-icon icon="mdi-trash-can" color="secondary"></v-icon>
                <v-tooltip activator="parent" location="top">Delete Leave</v-tooltip>
              </v-btn>
            </template>

            <template v-else-if="props.componentView === 'overtime-requests'">
              <v-btn variant="text" density="comfortable" @click="onOvertime(item)" icon>
                <v-icon icon="mdi-clock-plus"></v-icon>
                <v-tooltip activator="parent" location="top">Edit Overtime</v-tooltip>
              </v-btn>
            </template>
          </div>
        </template>
      </v-data-table-server>
    </v-card-text>
  </v-card>

  <LeaveFormDialog
    v-model:is-dialog-visible="isLeaveDialogVisible"
    :item-data="itemData"
    :table-options="tableOptions"
    :table-filters="tableFilters"
  ></LeaveFormDialog>

  <!-- <OvertimeFormDialog
    v-model:is-dialog-visible="isOvertimeDialogVisible"
    :item-data="itemData"
    :table-options="tableOptions"
    :table-filters="tableFilters"
  ></OvertimeFormDialog> -->

  <ConfirmFieldDialog
    v-model:is-dialog-visible="isConfirmDeleteDialog"
    title="Confirm Delete"
    subtitle="Are you sure you want to delete this attendance request?"
    :confirm-text="getRandomCode(6, true)"
    @confirm="onConfirmDelete"
  ></ConfirmFieldDialog>
</template>
