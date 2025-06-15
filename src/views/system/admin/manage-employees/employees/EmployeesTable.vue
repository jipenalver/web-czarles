<script setup lang="ts">
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import EmployeesExpandedRow from './EmployeesExpandedRow.vue'
import EmployeesFormDialog from './EmployeesFormDialog.vue'
import { type TableHeader } from '@/utils/helpers/tables'
import AppAlert from '@/components/common/AppAlert.vue'
import { useEmployeesTable } from './employeesTable'
import { useDisplay } from 'vuetify'
import { useDate } from 'vuetify'

const props = defineProps<{
  componentView: 'benefits' | 'employees' | 'attendance' | 'payroll'
}>()

const date = useDate()
const { mobile } = useDisplay()

const tableHeaders: TableHeader[] = [
  {
    title: 'Fullname',
    key: 'lastname',
    align: 'start',
  },
  {
    title: 'Phone',
    key: 'phone',
    align: 'start',
  },
  {
    title: 'Email',
    key: 'email',
    align: 'start',
  },
  {
    title: 'Designation',
    key: 'designation',
    sortable: false,
    align: 'start',
  },
  {
    title: 'Onboard Date',
    key: 'created_at',
    align: 'center',
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
  isDialogVisible,
  isConfirmDeleteDialog,
  itemData,
  formAction,
  onAdd,
  onUpdate,
  onDelete,
  onConfirmDelete,
  onSearchItems,
  onFilterItems,
  onLoadItems,
  employeesStore,
  designationsStore,
} = useEmployeesTable()
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
        :items="employeesStore.employeesTable"
        :items-length="employeesStore.employeesTableTotal"
        @update:options="onLoadItems"
        :hide-default-header="mobile"
        :mobile="mobile"
        show-expand
      >
        <template #top>
          <v-row dense>
            <v-spacer></v-spacer>

            <v-col cols="12" sm="4">
              <v-text-field
                v-model="tableFilters.search"
                density="compact"
                prepend-inner-icon="mdi-magnify"
                placeholder="Search Firstname, Lastname, Email"
                clearable
                @click:clear="onSearchItems"
                @input="onSearchItems"
              ></v-text-field>
            </v-col>

            <v-col cols="12" sm="3">
              <v-autocomplete
                v-model="tableFilters.designation_id"
                :items="designationsStore.designations"
                density="compact"
                label="Filter Designation"
                item-title="designation"
                item-value="id"
                clearable
                @update:model-value="onFilterItems"
              ></v-autocomplete>
            </v-col>

            <template v-if="props.componentView === 'employees'">
              <v-col cols="12" sm="3">
                <v-btn
                  class="my-1"
                  prepend-icon="mdi-account-plus"
                  color="primary"
                  block
                  @click="onAdd"
                >
                  Onboard Employee
                </v-btn>
              </v-col>
            </template>
          </v-row>

          <v-divider class="my-5"></v-divider>
        </template>

        <template #item.lastname="{ item }">
          <span class="font-weight-bold"> {{ item.lastname }}, {{ item.firstname }} </span>
        </template>

        <template #item.phone="{ item }">
          {{ item.phone ? '+63 ' + item.phone : '' }}
        </template>

        <template #item.designation="{ item }">
          <v-chip class="font-weight-bold" color="secondary" variant="flat" size="small">
            {{ item.designation.designation }}
          </v-chip>
        </template>

        <template #item.created_at="{ item }">
          <span class="font-weight-bold">
            {{ date.format(item.created_at, 'fullDateTime') }}
          </span>
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex align-center" :class="mobile ? 'justify-end' : 'justify-center'">
            <template v-if="props.componentView === 'employees'">
              <v-btn variant="text" density="comfortable" @click="onUpdate(item)" icon>
                <v-icon icon="mdi-pencil"></v-icon>
                <v-tooltip activator="parent" location="top">Edit Employee</v-tooltip>
              </v-btn>

              <v-btn variant="text" density="comfortable" @click="onDelete(item.id)" icon>
                <v-icon icon="mdi-trash-can" color="secondary"></v-icon>
                <v-tooltip activator="parent" location="top">Delete Employee</v-tooltip>
              </v-btn>
            </template>
            <template v-else-if="props.componentView === 'benefits'"></template>
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
          <EmployeesExpandedRow
            :columns-length="columns.length"
            :item-data="item"
          ></EmployeesExpandedRow>
        </template>
      </v-data-table-server>
    </v-card-text>
  </v-card>

  <EmployeesFormDialog
    v-model:is-dialog-visible="isDialogVisible"
    :item-data="itemData"
    :table-options="tableOptions"
    :table-filters="tableFilters"
  ></EmployeesFormDialog>

  <ConfirmDialog
    v-model:is-dialog-visible="isConfirmDeleteDialog"
    title="Confirm Delete"
    text="Are you sure you want to delete this employee?"
    @confirm="onConfirmDelete"
  ></ConfirmDialog>
</template>
