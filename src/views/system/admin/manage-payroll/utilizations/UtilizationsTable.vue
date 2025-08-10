<script setup lang="ts">
import UtilizationsExpandedRow from './UtilizationsExpandedRow.vue'
import UtilizationsFormDialog from './UtilizationsFormDialog.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import { useUtilizationsTable } from './utilizationsTable'
import AppAlert from '@/components/common/AppAlert.vue'
import { getMoneyText } from '@/utils/helpers/others'
import { useDisplay } from 'vuetify'
import { useDate } from 'vuetify'

const date = useDate()
const { mobile, xs } = useDisplay()

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
  onFilterDate,
  onFilterItems,
  onLoadItems,
  onExportCSV,
  // onExportPDF,
  utilizationsStore,
  employeesStore,
  // isLoadingPDF,
  // formActionPDF,
} = useUtilizationsTable()
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
        :items="utilizationsStore.utilizationsTable"
        :items-length="utilizationsStore.utilizationsTableTotal"
        @update:options="onLoadItems"
        :hide-default-header="mobile"
        :mobile="mobile"
      >
        <template #top>
          <v-row dense>
            <v-col cols="12" sm="1" :class="xs ? 'd-flex justify-end' : ''">
              <v-menu>
                <template v-slot:activator="{ props }">
                  <v-btn icon="mdi-dots-vertical" variant="text" v-bind="props"></v-btn>
                </template>

                <v-list slim>
                  <v-list-item @click="onExportCSV" prepend-icon="mdi-file-delimited">
                    <v-list-item-title>Export to CSV</v-list-item-title>
                  </v-list-item>
                  <!-- <v-list-item @click="onExportPDF" prepend-icon="mdi-file-pdf-box">
                    <v-list-item-title>Export to PDF</v-list-item-title>
                  </v-list-item> -->
                </v-list>
              </v-menu>
            </v-col>

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
                v-model="tableFilters.utilization_at"
                prepend-icon=""
                prepend-inner-icon="mdi-calendar"
                density="compact"
                label="Utilization Date"
                multiple="range"
                clearable
                @click:clear="onFilterDate(true)"
                @update:model-value="onFilterDate(false)"
              ></v-date-input>
            </v-col>

            <v-col cols="12" sm="3">
              <v-btn class="my-1" prepend-icon="mdi-plus" color="primary" block @click="onAdd">
                Add Utilization
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

        <template #item.unit="{ item }">
          {{ item.unit.name }}
        </template>

        <template #item.utilization_at="{ item }">
          <span class="font-weight-bold">
            {{ date.format(item.utilization_at, 'fullDate') }}
          </span>
        </template>

        <template #item.trip_location="{ item }">
          {{ item.trip_location.location }}
        </template>

        <template #item.per_hour="{ item }">
          {{ getMoneyText(item.per_hour) }}
        </template>

        <template #item.amount="{ item }">
          <span class="font-weight-black">
            {{ getMoneyText(item.hours * item.per_hour) }}
          </span>
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex align-center" :class="mobile ? 'justify-end' : 'justify-center'">
            <v-btn variant="text" density="comfortable" @click="onUpdate(item)" icon>
              <v-icon icon="mdi-pencil"></v-icon>
              <v-tooltip activator="parent" location="top">Edit Utilization</v-tooltip>
            </v-btn>

            <v-btn variant="text" density="comfortable" @click="onDelete(item.id)" icon>
              <v-icon icon="mdi-trash-can" color="secondary"></v-icon>
              <v-tooltip activator="parent" location="top">Delete Utilization</v-tooltip>
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
          <UtilizationsExpandedRow
            :columns-length="columns.length"
            :item-data="item"
          ></UtilizationsExpandedRow>
        </template>
      </v-data-table-server>
    </v-card-text>
  </v-card>

  <UtilizationsFormDialog
    v-model:is-dialog-visible="isDialogVisible"
    :item-data="itemData"
    :table-options="tableOptions"
    :table-filters="tableFilters"
  ></UtilizationsFormDialog>

  <ConfirmDialog
    v-model:is-dialog-visible="isConfirmDeleteDialog"
    title="Confirm Delete"
    text="Are you sure you want to delete this fuel utilization?"
    @confirm="onConfirmDelete"
  ></ConfirmDialog>
</template>
