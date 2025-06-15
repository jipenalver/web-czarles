<script setup lang="ts">
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import EmployeesFormDialog from './EmployeesFormDialog.vue'
import { type TableHeader } from '@/utils/helpers/tables'
import AppAlert from '@/components/common/AppAlert.vue'
import { getPadLeftText } from '@/utils/helpers/others'
import { useEmployeesTable } from './employeesTable'
import { useDisplay } from 'vuetify'
import { useDate } from 'vuetify'

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
    key: 'designations',
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
          </v-row>

          <v-divider class="my-5"></v-divider>
        </template>

        <template #item.lastname="{ item }">
          <span class="font-weight-bold"> {{ item.lastname }}, {{ item.firstname }} </span>
        </template>

        <template #item.phone="{ item }">
          {{ item.phone ? '+63 ' + item.phone : '' }}
        </template>

        <template #item.designations="{ item }">
          <v-chip class="font-weight-bold" color="secondary" variant="flat" size="small">
            {{ item.designations.designation }}
          </v-chip>
        </template>

        <template #item.created_at="{ item }">
          <span class="font-weight-bold">
            {{ date.format(item.created_at, 'fullDateTime') }}
          </span>
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex align-center" :class="mobile ? 'justify-end' : 'justify-center'">
            <v-btn variant="text" density="comfortable" @click="onUpdate(item)" icon>
              <v-icon icon="mdi-pencil"></v-icon>
              <v-tooltip activator="parent" location="top">Edit Employee</v-tooltip>
            </v-btn>

            <v-btn variant="text" density="comfortable" @click="onDelete(item.id)" icon>
              <v-icon icon="mdi-trash-can" color="secondary"></v-icon>
              <v-tooltip activator="parent" location="top">Delete Employee</v-tooltip>
            </v-btn>
          </div>
        </template>

        <template #item.data-table-expand="{ internalItem, isExpanded, toggleExpand }">
          <v-btn
            :append-icon="isExpanded(internalItem) ? 'mdi-chevron-up' : 'mdi-chevron-down'"
            :text="isExpanded(internalItem) ? 'Collapse' : 'More Info'"
            class="text-none"
            size="small"
            variant="text"
            border
            slim
            @click="toggleExpand(internalItem)"
          ></v-btn>
        </template>

        <template #expanded-row="{ columns, item }">
          <tr>
            <td :colspan="columns.length" class="py-2">
              <v-row dense>
                <v-col
                  cols="12"
                  class="d-flex align-center my-2"
                  :class="mobile ? 'justify-space-between' : 'justify-start'"
                >
                  <span class="text-body-2 font-weight-bold me-2">ID No.:</span>
                  <p class="text-body-2 font-weight-black">{{ getPadLeftText(item.id) }}</p>
                </v-col>

                <v-col
                  cols="12"
                  sm="6"
                  class="d-flex align-center my-2"
                  :class="mobile ? 'justify-space-between' : 'justify-start'"
                >
                  <p class="text-body-2 font-weight-bold me-2">Birthdate:</p>
                  <p class="text-body-2">{{ date.format(item.birthdate, 'fullDate') }}</p>
                </v-col>

                <v-col
                  cols="12"
                  sm="6"
                  class="d-flex align-center my-2"
                  :class="mobile ? 'justify-space-between' : 'justify-start'"
                >
                  <p class="text-body-2 font-weight-bold me-2">Address:</p>
                  <p class="text-body-2">{{ item.address }}</p>
                </v-col>

                <v-col
                  cols="12"
                  sm="3"
                  class="d-flex align-center my-2"
                  :class="mobile ? 'justify-space-between' : 'justify-start'"
                >
                  <span class="text-body-2 font-weight-bold me-2">Hired Date:</span>
                  <p class="text-body-2">{{ date.format(item.hired_at, 'fullDate') }}</p>
                </v-col>

                <v-col
                  cols="12"
                  sm="3"
                  class="d-flex align-center my-2"
                  :class="mobile ? 'justify-space-between' : 'justify-start'"
                >
                  <span class="text-body-2 font-weight-bold me-2">Is Field Staff?:</span>
                  <p class="text-body-2">{{ item.is_field_staff ? 'Yes' : 'No' }}</p>
                </v-col>

                <v-col
                  cols="12"
                  sm="3"
                  class="d-flex align-center my-2"
                  :class="mobile ? 'justify-space-between' : 'justify-start'"
                >
                  <span class="text-body-2 font-weight-bold me-2">Contract Status:</span>
                  <p class="text-body-2">{{ item.is_permanent ? 'Permanent' : 'Contractual' }}</p>
                </v-col>

                <v-col
                  cols="12"
                  sm="3"
                  class="d-flex align-center my-2"
                  :class="mobile ? 'justify-space-between' : 'justify-start'"
                >
                  <span class="text-body-2 font-weight-bold me-2">With Accident Insurance:</span>
                  <p class="text-body-2">{{ item.is_insured ? 'Yes' : 'No' }}</p>
                </v-col>

                <v-col
                  cols="12"
                  sm="3"
                  class="d-flex align-center my-2"
                  :class="mobile ? 'justify-space-between' : 'justify-start'"
                >
                  <span class="text-body-2 font-weight-bold me-2">TIN No.:</span>
                  <p class="text-body-2">{{ item.tin_no }}</p>
                </v-col>

                <v-col
                  cols="12"
                  sm="3"
                  class="d-flex align-center my-2"
                  :class="mobile ? 'justify-space-between' : 'justify-start'"
                >
                  <span class="text-body-2 font-weight-bold me-2">SSS No.:</span>
                  <p class="text-body-2">{{ item.sss_no }}</p>
                </v-col>

                <v-col
                  cols="12"
                  sm="3"
                  class="d-flex align-center my-2"
                  :class="mobile ? 'justify-space-between' : 'justify-start'"
                >
                  <span class="text-body-2 font-weight-bold me-2">Philhealth No.:</span>
                  <p class="text-body-2">{{ item.philhealth_no }}</p>
                </v-col>

                <v-col
                  cols="12"
                  sm="3"
                  class="d-flex align-center my-2"
                  :class="mobile ? 'justify-space-between' : 'justify-start'"
                >
                  <span class="text-body-2 font-weight-bold me-2">Pag-ibig No.:</span>
                  <p class="text-body-2">{{ item.philhealth_no }}</p>
                </v-col>
              </v-row>

              <v-divider class="my-3" thickness="1"></v-divider>
            </td>
          </tr>
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
