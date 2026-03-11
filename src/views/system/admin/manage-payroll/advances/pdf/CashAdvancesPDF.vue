<script setup lang="ts">
import { type CashAdvanceTableFilter, useCashAdvancesStore } from '@/stores/cashAdvances'
import { type TableHeader } from '@/utils/helpers/tables'
import { useEmployeesStore } from '@/stores/employees'
import { getMoneyText } from '@/utils/helpers/others'
import { useDate } from 'vuetify'

const props = defineProps<{
  tableHeaders: TableHeader[]
  tableFilters: CashAdvanceTableFilter
}>()

const date = useDate()

const employeesStore = useEmployeesStore()
const cashAdvancesStore = useCashAdvancesStore()

const getEmployeeName = (id: number) => {
  const employee = employeesStore.employees.find((e) => e.id === id)
  return employee ? `${employee.lastname}, ${employee.firstname}` : ''
}
</script>

<template>
  <!-- PDF Export Container - hidden table para sa PDF generation -->
  <div style="display: none" id="cash-advances-table">
    <h2 class="report-title">CASH ADVANCES REPORT</h2>
    <table class="pdf-table">
      <thead>
        <tr v-if="props.tableFilters.employee_id">
          <th colspan="4" class="pdf-th">
            Employee:
            {{ getEmployeeName(props.tableFilters.employee_id) }}
          </th>
        </tr>
        <tr>
          <th
            v-for="header in props.tableHeaders.filter(
              (h) =>
                h.key !== 'actions' &&
                (props.tableFilters.employee_id ? h.key !== 'employee' : true),
            )"
            :key="header.key"
            class="pdf-th"
          >
            {{ header.title }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in cashAdvancesStore.cashAdvancesExport" :key="item.id">
          <td v-if="!props.tableFilters.employee_id" class="pdf-td">
            {{ item.employee.lastname + ', ' + item.employee.firstname }}
          </td>
          <td class="pdf-td pdf-td--bold">
            {{ getMoneyText(item.amount) }}
          </td>
          <td class="pdf-td">{{ item.description }}</td>
          <td class="pdf-td">
            {{ date.format(item.request_at, 'fullDateTime') }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.report-title {
  text-align: center;
  margin-bottom: 1rem;
}

.pdf-table {
  width: 100%;
  border-collapse: collapse;
}

.pdf-th {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
  background-color: #f5f5f5;
}

.pdf-td {
  border: 1px solid #ddd;
  padding: 6px;
}

.pdf-td--bold {
  font-weight: bold;
}
</style>
