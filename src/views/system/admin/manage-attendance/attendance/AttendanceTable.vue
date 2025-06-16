<script setup lang="ts">
import { type TableHeader } from '@/utils/helpers/tables'
import AppAlert from '@/components/common/AppAlert.vue'
import { useAttendanceTable } from './attendanceTable'
import { useDisplay } from 'vuetify'
import { useDate } from 'vuetify'

const date = useDate()
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
    key: 'date',
    sortable: false,
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

        <template #item.date="{ item }">
          <span class="font-weight-bold">
            {{ date.format(item.am_time_in, 'fullDateWithWeekday') }}
          </span>
        </template>

        <template #item.am_time_in="{ item }">
          <span class="font-weight-bold">
            {{ date.format(item.am_time_in, 'fullTime12h') }}
          </span>
        </template>

        <template #item.am_time_out="{ item }">
          <span class="font-weight-bold">
            {{ date.format(item.am_time_in, 'fullTime12h') }}
          </span>
        </template>

        <template #item.pm_time_in="{ item }">
          <span class="font-weight-bold">
            {{ date.format(item.pm_time_in, 'fullTime12h') }}
          </span>
        </template>

        <template #item.pm_time_out="{ item }">
          <span class="font-weight-bold">
            {{ date.format(item.pm_time_out, 'fullTime12h') }}
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
      </v-data-table-server>
    </v-card-text>
  </v-card>
</template>
