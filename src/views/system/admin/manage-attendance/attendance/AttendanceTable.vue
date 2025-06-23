<script setup lang="ts">
import { getDateWithWeekday, getTime } from '@/utils/helpers/others'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import AttendanceExpandedRow from './AttendanceExpandedRow.vue'
import AttendanceFormDialog from './AttendanceFormDialog.vue'
import AppAlert from '@/components/common/AppAlert.vue'
import { useAttendanceTable } from './attendanceTable'
import { useDisplay } from 'vuetify'

const { mobile } = useDisplay()

const {
  tableHeaders,
  tableOptions,
  tableFilters,
  isDialogVisible,
  isConfirmDeleteDialog,
  itemData,
  formAction,
  onAdd,
  onUpdate,
  onDelete,
  onConfirmDelete,
  onFilterItems,
  onLoadItems,
  attendancesStore,
  employeesStore,
} = useAttendanceTable()
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

            <v-col cols="12" sm="3">
              <v-btn class="my-1" prepend-icon="mdi-plus" color="primary" block @click="onAdd">
                Add Attendance
              </v-btn>
            </v-col>
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
          <span class="font-weight-bold">
            {{ item.am_time_in ? getTime(item.am_time_in) : '-' }}
          </span>
        </template>

        <template #item.am_time_out="{ item }">
          <span class="font-weight-bold">
            {{ item.am_time_out ? getTime(item.am_time_out) : '-' }}
          </span>
        </template>

        <template #item.pm_time_in="{ item }">
          <span class="font-weight-bold">
            {{ item.pm_time_in ? getTime(item.pm_time_in) : '-' }}
          </span>
        </template>

        <template #item.pm_time_out="{ item }">
          <span class="font-weight-bold">
            {{ item.pm_time_out ? getTime(item.pm_time_out) : '-' }}
          </span>
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex align-center" :class="mobile ? 'justify-end' : 'justify-center'">
            <v-btn variant="text" density="comfortable" @click="onUpdate(item)" icon>
              <v-icon icon="mdi-pencil"></v-icon>
              <v-tooltip activator="parent" location="top">Rectify Attendance</v-tooltip>
            </v-btn>

            <v-btn variant="text" density="comfortable" @click="onDelete(item.id)" icon>
              <v-icon icon="mdi-trash-can" color="secondary"></v-icon>
              <v-tooltip activator="parent" location="top">Delete Attendance</v-tooltip>
            </v-btn>
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

  <ConfirmDialog
    v-model:is-dialog-visible="isConfirmDeleteDialog"
    title="Confirm Delete"
    text="Are you sure you want to delete this attendance?"
    @confirm="onConfirmDelete"
  ></ConfirmDialog>
</template>
