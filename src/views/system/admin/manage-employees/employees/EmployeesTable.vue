<script setup lang="ts">
import AddonsDeductionsFormDialog from '../addons-deductions/AddonsDeductionsFormDialog.vue'
import PayrollTableDialog from '../../manage-payroll/payroll/PayrollTableDialog.vue'
import ConfirmFieldDialog from '@/components/common/ConfirmFieldDialog.vue'
import EmployeesExpandedRow from './EmployeesExpandedRow.vue'
import EmployeesFormDialog from './EmployeesFormDialog.vue'
import RatesFormDialog from '../rates/RatesFormDialog.vue'
import { type TableHeader } from '@/utils/helpers/tables'
import AppAlert from '@/components/common/AppAlert.vue'
import LoadingDialog from '@/components/common/LoadingDialog.vue'
import { getRandomCode, getIDNumber, getMoneyText } from '@/utils/helpers/others'
import { getYearsOfService } from '@/utils/helpers/dates'
import { useEmployeesTable } from './employeesTable'
import { useDisplay } from 'vuetify'
import { useDate } from 'vuetify'

const props = defineProps<{
  componentView: 'employees' | 'benefits' | 'payroll'
}>()

const date = useDate()
const { mobile, xs } = useDisplay()

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
    title: 'Hired Date',
    key: 'hired_at',
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
  isRateDialogVisible,
  isDeductionsDialogVisible,
  isPayrollDialogVisible,
  isConfirmDeleteDialog,
  itemData,
  formAction,
  onAdd,
  onUpdate,
  onRate,
  onDeductions,
  onPayroll,
  onDelete,
  onConfirmDelete,
  onSearchItems,
  onFilterItems,
  onLoadItems,
  onExportCSV,
  onExportPDFHandler,
  isPrinting,
  pdfFormAction,
  employeesStore,
  designationsStore,
} = useEmployeesTable(props, tableHeaders)
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
        :items="employeesStore.employeesTable"
        :items-length="employeesStore.employeesTableTotal"
        @update:options="onLoadItems"
        :hide-default-header="mobile"
        :mobile="mobile"
        show-expand
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
                label="Filter by Designation"
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

        <!-- PDF Export Container - wraps the table content only -->
        <template #bottom>
          <div style="display: none;" id="employees-table">
            <h2 class="text-center mb-4" style="font-size: 14px; margin-bottom: 8px; page-break-after: avoid; font-weight: bold;">
              {{ props.componentView.toUpperCase() }} EMPLOYEES REPORT
            </h2>
            <table class="w-100" style="border-collapse: collapse; font-size: 7px; width: 100%; page-break-inside: auto; table-layout: fixed;">
              <thead style="page-break-inside: avoid; page-break-after: auto;">
                <tr>
                  <th v-for="header in tableHeaders.filter(h => h.key !== 'actions')" :key="header.key"
                      style="border: 1px solid #ddd; padding: 2px; text-align: left; background-color: #f5f5f5; font-size: 7px; font-weight: bold; width: 8%;">
                    {{ header.title }}
                  </th>
                  <th style="border: 1px solid #ddd; padding: 2px; text-align: left; background-color: #f5f5f5; font-size: 7px; font-weight: bold; width: 6%;">
                    ID No.
                  </th>
                  <th style="border: 1px solid #ddd; padding: 2px; text-align: left; background-color: #f5f5f5; font-size: 7px; font-weight: bold; width: 8%;">
                    Birthdate
                  </th>
                  <th style="border: 1px solid #ddd; padding: 2px; text-align: left; background-color: #f5f5f5; font-size: 7px; font-weight: bold; width: 12%;">
                    Address
                  </th>
                  <th style="border: 1px solid #ddd; padding: 2px; text-align: left; background-color: #f5f5f5; font-size: 7px; font-weight: bold; width: 12%;">
                    Years of Service
                  </th>
                  <th style="border: 1px solid #ddd; padding: 2px; text-align: left; background-color: #f5f5f5; font-size: 7px; font-weight: bold; width: 12%;">
                    Contract Status
                  </th>
                  <th style="border: 1px solid #ddd; padding: 2px; text-align: left; background-color: #f5f5f5; font-size: 7px; font-weight: bold; width: 12%;">
                    Field Staff
                  </th>
                  <th style="border: 1px solid #ddd; padding: 2px; text-align: left; background-color: #f5f5f5; font-size: 7px; font-weight: bold; width: 6%;">
                    TIN No.
                  </th>
                  <th style="border: 1px solid #ddd; padding: 2px; text-align: left; background-color: #f5f5f5; font-size: 7px; font-weight: bold; width: 6%;">
                    SSS No.
                  </th>
                  <th style="border: 1px solid #ddd; padding: 2px; text-align: left; background-color: #f5f5f5; font-size: 7px; font-weight: bold; width: 12%;">
                    PhilHealth No.
                  </th>
                  <th style="border: 1px solid #ddd; padding: 2px; text-align: left; background-color: #f5f5f5; font-size: 7px; font-weight: bold; width: 12%;">
                    Pag-IBIG No.
                  </th>
                  <th style="border: 1px solid #ddd; padding: 2px; text-align: left; background-color: #f5f5f5; font-size: 7px; font-weight: bold; width: 12%;">
                    Area Origin
                  </th>
                  <th style="border: 1px solid #ddd; padding: 2px; text-align: left; background-color: #f5f5f5; font-size: 7px; font-weight: bold; width: 12%;">
                    Area Assignment
                  </th>
                  <template v-if="props.componentView === 'benefits' || props.componentView === 'payroll'">
                    <th style="border: 1px solid #ddd; padding: 2px; text-align: left; background-color: #f5f5f5; font-size: 7px; font-weight: bold; width: 12%;">
                      Daily Rate
                    </th>
                    <th style="border: 1px solid #ddd; padding: 2px; text-align: left; background-color: #f5f5f5; font-size: 7px; font-weight: bold; width: 12%;">
                      Accident Insurance
                    </th>
                  </template>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in employeesStore.employeesTable" :key="item.id" style="page-break-inside: avoid;">
                  <td style="border: 1px solid #ddd; padding: 1px; font-weight: bold; font-size: 7px; width: 8%; word-wrap: break-word; overflow-wrap: break-word;">
                    {{ item.lastname }}, {{ item.firstname }}
                  </td>
                  <td style="border: 1px solid #ddd; padding: 1px; font-size: 7px; width: 8%; word-wrap: break-word; overflow-wrap: break-word;">{{ item.phone }}</td>
                  <td style="border: 1px solid #ddd; padding: 1px; font-size: 7px; width: 8%; word-wrap: break-word; overflow-wrap: break-word;">{{ item.email }}</td>
                  <td style="border: 1px solid #ddd; padding: 1px; font-size: 7px; width: 8%; word-wrap: break-word; overflow-wrap: break-word;">{{ item.designation.designation }}</td>
                  <td style="border: 1px solid #ddd; padding: 1px; font-weight: bold; font-size: 7px; width: 8%; word-wrap: break-word; overflow-wrap: break-word;">
                    {{ date.format(item.hired_at, 'fullDate') }}
                  </td>
                  <td style="border: 1px solid #ddd; padding: 1px; font-weight: bold; font-size: 7px; width: 6%; word-wrap: break-word; overflow-wrap: break-word;">
                    {{ getIDNumber(item.hired_at, item.id) }}
                  </td>
                  <td style="border: 1px solid #ddd; padding: 1px; font-size: 7px; width: 8%; word-wrap: break-word; overflow-wrap: break-word;">
                    {{ item.birthdate ? date.format(item.birthdate, 'fullDate') : 'n/a' }}
                  </td>
                  <td style="border: 1px solid #ddd; padding: 1px; font-size: 7px; width: 12%; word-wrap: break-word; overflow-wrap: break-word;">{{ item.address }}</td>
                  <td style="border: 1px solid #ddd; padding: 1px; font-weight: bold; font-size: 7px; width: 6%; word-wrap: break-word; overflow-wrap: break-word;">
                    {{ getYearsOfService(item.hired_at) }}
                  </td>
                  <td style="border: 1px solid #ddd; padding: 1px; font-size: 7px; width: 6%; word-wrap: break-word; overflow-wrap: break-word;">
                    {{ item.is_permanent ? 'Permanent' : 'Contractual' }}
                  </td>
                  <td style="border: 1px solid #ddd; padding: 1px; font-size: 7px; width: 5%; word-wrap: break-word; overflow-wrap: break-word;">
                    {{ item.is_field_staff ? 'Yes' : 'No' }}
                  </td>
                  <td style="border: 1px solid #ddd; padding: 1px; font-size: 7px; width: 6%; word-wrap: break-word; overflow-wrap: break-word;">{{ item.tin_no }}</td>
                  <td style="border: 1px solid #ddd; padding: 1px; font-size: 7px; width: 6%; word-wrap: break-word; overflow-wrap: break-word;">{{ item.sss_no }}</td>
                  <td style="border: 1px solid #ddd; padding: 1px; font-size: 7px; width: 6%; word-wrap: break-word; overflow-wrap: break-word;">{{ item.philhealth_no }}</td>
                  <td style="border: 1px solid #ddd; padding: 1px; font-size: 7px; width: 6%; word-wrap: break-word; overflow-wrap: break-word;">{{ item.pagibig_no }}</td>
                  <td style="border: 1px solid #ddd; padding: 1px; font-size: 7px; width: 6%; word-wrap: break-word; overflow-wrap: break-word;">
                    {{ item.area_origin ? item.area_origin.area : 'n/a' }}
                  </td>
                  <td style="border: 1px solid #ddd; padding: 1px; font-size: 7px; width: 6%; word-wrap: break-word; overflow-wrap: break-word;">
                    {{ item.area_assignment ? item.area_assignment.area : 'n/a' }}
                  </td>
                  <template v-if="props.componentView === 'benefits' || props.componentView === 'payroll'">
                    <td style="border: 1px solid #ddd; padding: 1px; font-weight: bold; font-size: 7px; width: 6%; word-wrap: break-word; overflow-wrap: break-word;">
                      {{ item.daily_rate ? getMoneyText(item.daily_rate) : 'n/a' }}
                    </td>
                    <td style="border: 1px solid #ddd; padding: 1px; font-size: 7px; width: 6%; word-wrap: break-word; overflow-wrap: break-word;">
                      {{ item.is_insured ? 'Yes' : 'No' }}
                    </td>
                  </template>
                </tr>
              </tbody>
            </table>
          </div>
        </template>

        <template #item.lastname="{ item }">
          <span class="font-weight-bold"> {{ item.lastname }}, {{ item.firstname }} </span>
        </template>

        <template #item.designation="{ item }">
          <v-chip class="font-weight-bold" color="secondary" variant="flat" size="small">
            {{ item.designation.designation }}
          </v-chip>
        </template>

        <template #item.hired_at="{ item }">
          <span class="font-weight-bold">
            {{ date.format(item.hired_at, 'fullDate') }}
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

            <template v-else-if="props.componentView === 'benefits'">
              <v-btn variant="text" density="comfortable" @click="onRate(item)" icon>
                <v-icon icon="mdi-cash-edit" color="warning"></v-icon>
                <v-tooltip activator="parent" location="top">Edit Employee Rate</v-tooltip>
              </v-btn>

              <v-btn variant="text" density="comfortable" @click="onDeductions(item)" icon>
                <v-icon icon="mdi-account-cash" color="info"></v-icon>
                <v-tooltip activator="parent" location="top"> Edit Employee Benefits </v-tooltip>
              </v-btn>
            </template>

            <template v-else-if="props.componentView === 'payroll'">
              <v-btn variant="text" density="comfortable" @click="onPayroll(item)" icon>
                <v-icon icon="mdi-cash-fast" color="warning"></v-icon>
                <v-tooltip activator="parent" location="top"> View Employee Payroll </v-tooltip>
              </v-btn>
            </template>
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
            :component-view="props.componentView"
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

  <RatesFormDialog
    v-model:is-dialog-visible="isRateDialogVisible"
    :item-data="itemData"
    :table-options="tableOptions"
    :table-filters="tableFilters"
  ></RatesFormDialog>

  <AddonsDeductionsFormDialog
    v-model:is-dialog-visible="isDeductionsDialogVisible"
    :item-id="itemData?.id"
    :table-options="tableOptions"
    :table-filters="tableFilters"
  ></AddonsDeductionsFormDialog>

  <PayrollTableDialog
    v-model:is-dialog-visible="isPayrollDialogVisible"
    :item-data="itemData"
  ></PayrollTableDialog>

  <ConfirmFieldDialog
    v-model:is-dialog-visible="isConfirmDeleteDialog"
    title="Confirm Delete"
    subtitle="Are you sure you want to delete this employee?"
    :confirm-text="getRandomCode(6, true)"
    @confirm="onConfirmDelete"
  ></ConfirmFieldDialog>
</template>
