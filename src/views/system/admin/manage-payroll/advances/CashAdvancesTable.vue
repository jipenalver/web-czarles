<script setup lang="ts">
import CashAdvancesFormDialog from './CashAdvancesFormDialog.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import LoadingDialog from '@/components/common/LoadingDialog.vue'
import { useCashAdvancesTable } from './cashAdvancesTable'
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
  onExportPDFHandler,
  isPrinting,
  pdfFormAction,
  cashAdvancesStore,
  employeesStore,
} = useCashAdvancesTable()
</script>

<template>
  <AppAlert
    v-model:is-alert-visible="formAction.formAlert"
    :form-message="formAction.formMessage"
    :form-status="formAction.formStatus"
  ></AppAlert>

  <AppAlert
    v-model:is-alert-visible="pdfFormAction.formAlert"
    :form-message="pdfFormAction.formMessage"
    :form-status="pdfFormAction.formStatus"
  ></AppAlert>

  <!-- Loading dialog para sa PDF generation -->
  <LoadingDialog
    v-model:is-visible="isPrinting"
    title="Generating PDF..."
    subtitle="Please wait while we prepare your report"
    description="This may take a few moments"
  ></LoadingDialog>

  <v-card>
    <v-card-text>
      <!-- eslint-disable vue/valid-v-slot -->
      <v-data-table-server
        v-model:items-per-page="tableOptions.itemsPerPage"
        v-model:page="tableOptions.page"
        v-model:sort-by="tableOptions.sortBy"
        :loading="tableOptions.isLoading"
        :headers="tableHeaders"
        :items="cashAdvancesStore.cashAdvancesTable"
        :items-length="cashAdvancesStore.cashAdvancesTableTotal"
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

                <v-list>
                  <v-list-item @click="onExportCSV">
                    <v-list-item-title>Export to CSV</v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="onExportPDFHandler">
                    <v-list-item-title>Export to PDF</v-list-item-title>
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
                v-model="tableFilters.request_at"
                prepend-icon=""
                prepend-inner-icon="mdi-calendar"
                density="compact"
                label="Request Date"
                multiple="range"
                clearable
                @click:clear="onFilterDate(true)"
                @update:model-value="onFilterDate(false)"
              ></v-date-input>
            </v-col>

            <v-col cols="12" sm="3">
              <v-btn class="my-1" prepend-icon="mdi-plus" color="primary" block @click="onAdd">
                Add Cash Advance
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

        <template #item.amount="{ item }">
          <span class="font-weight-black">
            {{ getMoneyText(item.amount) }}
          </span>
        </template>

        <template #item.request_at="{ item }">
          <span class="font-weight-bold">
            {{ date.format(item.request_at, 'fullDateTime') }}
          </span>
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex align-center" :class="mobile ? 'justify-end' : 'justify-center'">
            <v-btn variant="text" density="comfortable" @click="onUpdate(item)" icon>
              <v-icon icon="mdi-pencil"></v-icon>
              <v-tooltip activator="parent" location="top">Edit Cash Advance</v-tooltip>
            </v-btn>

            <v-btn variant="text" density="comfortable" @click="onDelete(item.id)" icon>
              <v-icon icon="mdi-trash-can" color="secondary"></v-icon>
              <v-tooltip activator="parent" location="top">Delete Cash Advance</v-tooltip>
            </v-btn>
          </div>
        </template>

        <!-- PDF Export Container - wraps the table content only -->
        <template #bottom>
          <div style="display: none;" id="cash-advances-table">
            <h2 class="text-center mb-4">CASH ADVANCES REPORT</h2>
            <table class="w-100" style="border-collapse: collapse;">
              <thead>
                <tr v-if="tableFilters.employee_id">
                  <th colspan="4" style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f5f5f5;">
                    Employee: 
                    {{
                      (employeesStore.employees.find(e => e.id === tableFilters.employee_id)?.lastname || '') +
                      ', ' +
                      (employeesStore.employees.find(e => e.id === tableFilters.employee_id)?.firstname || '')
                    }}
                  </th>
                </tr>
                <tr>
                  <th v-for="header in tableHeaders.filter(h => h.key !== 'actions' && (tableFilters.employee_id ? h.key !== 'employee' : true))" :key="header.key" 
                      style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f5f5f5;">
                    {{ header.title }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in cashAdvancesStore.cashAdvancesTable" :key="item.id">
                  <td v-if="!tableFilters.employee_id" style="border: 1px solid #ddd; padding: 6px;">
                    {{ item.employee.lastname + ', ' + item.employee.firstname }}
                  </td>
                  <td style="border: 1px solid #ddd; padding: 6px; font-weight: bold;">
                    {{ getMoneyText(item.amount) }}
                  </td>
                  <td style="border: 1px solid #ddd; padding: 6px;">{{ item.description }}</td>
                  <td style="border: 1px solid #ddd; padding: 6px;">
                    {{ date.format(item.request_at, 'fullDateTime') }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </v-data-table-server>
    </v-card-text>
  </v-card>

  <CashAdvancesFormDialog
    v-model:is-dialog-visible="isDialogVisible"
    :item-data="itemData"
    :table-options="tableOptions"
    :table-filters="tableFilters"
  ></CashAdvancesFormDialog>

  <ConfirmDialog
    v-model:is-dialog-visible="isConfirmDeleteDialog"
    title="Confirm Delete"
    text="Are you sure you want to delete this cash advance?"
    @confirm="onConfirmDelete"
  ></ConfirmDialog>
</template>
