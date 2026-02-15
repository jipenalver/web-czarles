<script setup lang="ts">
import ConfirmFieldDialog from '@/components/common/ConfirmFieldDialog.vue'
import { useAttendanceRequestsTable } from './attendanceRequestsTable'
import { getAvatarText, getRandomCode } from '@/utils/helpers/others'
// import OvertimeFormDialog from '../overtime/OvertimeFormDialog.vue'
import StatusFormDialog from '../status/StatusFormDialog.vue'
import LeaveFormDialog from '../leave/LeaveFormDialog.vue'
import { getDateWithWeekday } from '@/utils/helpers/dates'
import LogsFormDialog from '../status/LogsFormDialog.vue'
import AppAlert from '@/components/common/AppAlert.vue'
import { useDisplay } from 'vuetify'

const props = defineProps<{
  componentView: 'leave-requests' | 'overtime-requests'
}>()

const { smAndDown } = useDisplay()

const {
  tableHeaders,
  tableOptions,
  tableFilters,
  isApprover,
  isRequestor,
  isStatusDialogVisible,
  isLogsDialogVisible,
  isLeaveDialogVisible,
  // isOvertimeDialogVisible,
  isConfirmDeleteDialog,
  itemData,
  formAction,
  onStatus,
  onLogs,
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
              <v-col v-if="isRequestor" cols="12" sm="3">
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
                  prepend-icon="mdi-refresh"
                  color="primary"
                  block
                  @click="onOvertime(null)"
                >
                  Sync Overtime
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

        <template #item.leave_type="{ item }">
          <div class="d-flex flex-column">
            <span class="font-weight-bold">
              {{ item.leave_type }}
            </span>
            <span class="text-secondary text-caption">
              <span v-if="item.is_am_leave"> AM </span>
              <span v-if="item.is_am_leave && item.is_pm_leave"> & </span>
              <span v-if="item.is_pm_leave"> PM </span>
            </span>
          </div>
        </template>

        <template #item.user_fullname="{ item }">
          <div
            class="d-flex align-center my-5"
            :class="smAndDown ? 'justify-end' : 'justify-start'"
          >
            <v-avatar
              v-if="item?.user_avatar"
              :image="item.user_avatar"
              color="primary"
              size="large"
            >
            </v-avatar>

            <v-avatar v-else color="primary" size="large">
              <span class="text-h5">
                {{ getAvatarText(item.user_fullname) }}
              </span>
            </v-avatar>

            <span class="ms-2 font-weight-bold"> {{ item.user_fullname }} </span>
          </div>
        </template>

        <template #item.leave_status="{ item }">
          <v-chip
            :color="
              item.leave_status === 'Approved'
                ? 'success'
                : item.leave_status === 'Rejected'
                  ? 'error'
                  : 'warning'
            "
            class="font-weight-bold"
            variant="flat"
            size="small"
          >
            {{ item.leave_status.charAt(0).toUpperCase() + item.leave_status.slice(1) }}
          </v-chip>
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex align-center" :class="smAndDown ? 'justify-end' : 'justify-center'">
            <template v-if="props.componentView === 'leave-requests'">
              <template v-if="item.leave_status === 'Pending'">
                <template v-if="isApprover">
                  <v-btn variant="text" density="comfortable" @click="onStatus(item)" icon>
                    <v-icon icon="mdi-thumbs-up-down" color="warning"></v-icon>
                    <v-tooltip activator="parent" location="top">Approve or Reject</v-tooltip>
                  </v-btn>
                </template>

                <template v-if="isRequestor">
                  <v-btn variant="text" density="comfortable" @click="onLeave(item)" icon>
                    <v-icon icon="mdi-account-arrow-left"></v-icon>
                    <v-tooltip activator="parent" location="top">Edit Leave</v-tooltip>
                  </v-btn>

                  <v-btn variant="text" density="comfortable" @click="onDelete(item.id)" icon>
                    <v-icon icon="mdi-trash-can" color="secondary"></v-icon>
                    <v-tooltip activator="parent" location="top">Delete Leave</v-tooltip>
                  </v-btn>
                </template>
              </template>

              <template v-if="item.leave_status === 'Rejected'">
                <template v-if="isRequestor">
                  <v-btn variant="text" density="comfortable" @click="onLogs(item)" icon>
                    <v-icon icon="mdi-information-outline" color="warning"></v-icon>
                    <v-tooltip activator="parent" location="top">Resubmit Request</v-tooltip>
                  </v-btn>

                  <v-btn variant="text" density="comfortable" @click="onLeave(item)" icon>
                    <v-icon icon="mdi-account-arrow-left"></v-icon>
                    <v-tooltip activator="parent" location="top">Edit Leave</v-tooltip>
                  </v-btn>

                  <v-btn variant="text" density="comfortable" @click="onDelete(item.id)" icon>
                    <v-icon icon="mdi-trash-can" color="secondary"></v-icon>
                    <v-tooltip activator="parent" location="top">Delete Leave</v-tooltip>
                  </v-btn>
                </template>
              </template>
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

  <StatusFormDialog
    v-model:is-dialog-visible="isStatusDialogVisible"
    :item-data="itemData"
    :table-options="tableOptions"
    :table-filters="tableFilters"
  ></StatusFormDialog>

  <LogsFormDialog
    v-model:is-dialog-visible="isLogsDialogVisible"
    :item-data="itemData"
    :table-options="tableOptions"
    :table-filters="tableFilters"
  ></LogsFormDialog>

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
