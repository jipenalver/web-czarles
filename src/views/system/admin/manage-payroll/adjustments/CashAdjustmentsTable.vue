<script setup lang="ts">
import CashAdjustmentsFormDialog from './CashAdjustmentsDialog.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import { useCashAdjustmentsTable } from './cashAdjustmentsTable'
import AppAlert from '@/components/common/AppAlert.vue'
import { getMoneyText } from '@/utils/helpers/others'
import { useDisplay } from 'vuetify'
import { useDate } from 'vuetify'

const date = useDate()
const { smAndDown, xs } = useDisplay()

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
  cashAdjustmentsStore,
  employeesStore,
} = useCashAdjustmentsTable()
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
        :items="cashAdjustmentsStore.cashAdjustmentsTable"
        :items-length="cashAdjustmentsStore.cashAdjustmentsTableTotal"
        @update:options="onLoadItems"
        :hide-default-header="smAndDown"
        :mobile="smAndDown"
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
                v-model="tableFilters.adjustment_at"
                prepend-icon=""
                prepend-inner-icon="mdi-calendar"
                density="compact"
                label="Trip Date"
                multiple="range"
                clearable
                @click:clear="onFilterDate(true)"
                @update:model-value="onFilterDate(false)"
              ></v-date-input>
            </v-col>

            <v-col cols="12" sm="3">
              <v-btn class="my-1" prepend-icon="mdi-plus" color="primary" block @click="onAdd">
                Add Add-on
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

        <template #item.adjustment_at="{ item }">
          <span class="font-weight-bold">
            {{ date.format(item.adjustment_at, 'fullDate') }}
          </span>
        </template>

        <template #item.amount="{ item }">
          <span class="font-weight-black">
            {{ getMoneyText(item.amount) }}
          </span>
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex align-center" :class="smAndDown ? 'justify-end' : 'justify-center'">
            <v-btn variant="text" density="comfortable" @click="onUpdate(item)" icon>
              <v-icon icon="mdi-pencil"></v-icon>
              <v-tooltip activator="parent" location="top">Edit Add-on</v-tooltip>
            </v-btn>

            <v-btn variant="text" density="comfortable" @click="onDelete(item.id)" icon>
              <v-icon icon="mdi-trash-can" color="secondary"></v-icon>
              <v-tooltip activator="parent" location="top">Delete Add-on</v-tooltip>
            </v-btn>
          </div>
        </template>
      </v-data-table-server>
    </v-card-text>
  </v-card>

  <CashAdjustmentsFormDialog
    v-model:is-dialog-visible="isDialogVisible"
    :item-data="itemData"
    :table-options="tableOptions"
    :table-filters="tableFilters"
  ></CashAdjustmentsFormDialog>

  <ConfirmDialog
    v-model:is-dialog-visible="isConfirmDeleteDialog"
    title="Confirm Delete"
    text="Are you sure you want to delete this add-on?"
    @confirm="onConfirmDelete"
  ></ConfirmDialog>
</template>
