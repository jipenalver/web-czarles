<script setup lang="ts">
import { getDateWithWeekday, getTime } from '@/utils/helpers/others'
import AttendanceExpandedRow from './AttendanceExpandedRow.vue'
import { type TableHeader } from '@/utils/helpers/tables'
import AppAlert from '@/components/common/AppAlert.vue'
import { useAttendanceTable } from './attendanceTable'
import { useDisplay } from 'vuetify'

const { mobile } = useDisplay()

const tableHeaders: TableHeader[] = [
  {
    title: 'Employee',
    key: 'employee',
    sortable: false,
    align: 'start',
  },
  {
    title: 'Date',
    key: 'created_at',
    align: 'start',
  },
  {
    title: 'AM - Time In',
    key: 'am_time_in',
    sortable: false,
    align: 'start',
  },
  {
    title: 'AM - Time Out',
    key: 'am_time_out',
    sortable: false,
    align: 'start',
  },
  {
    title: 'PM - Time In',
    key: 'pm_time_in',
    sortable: false,
    align: 'start',
  },
  {
    title: 'PM - Time Out',
    key: 'pm_time_out',
    sortable: false,
    align: 'start',
  },
  {
    title: 'Actions',
    key: 'actions',
    sortable: false,
    align: 'center',
  },
]

const {
  tableOptions,
  tableFilters,
  // isDialogVisible,
  // itemData,
  formAction,
  onAdd,
  onUpdate,
  onFilterItems,
  onLoadItems,
  attendanceStore,
  employeeStore,
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
        :items="attendanceStore.attendancesTable"
        :items-length="attendanceStore.attendancesTableTotal"
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
                :items="employeeStore.employees"
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

        <template #item.created_at="{ item }">
          <span class="font-weight-bold">
            {{ getDateWithWeekday(item.created_at) }}
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
</template>
