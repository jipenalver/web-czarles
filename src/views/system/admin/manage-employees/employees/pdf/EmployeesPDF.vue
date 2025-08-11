<script setup lang="ts">
import { getIDNumber, getMoneyText } from '@/utils/helpers/others'
import { getYearsOfService } from '@/utils/helpers/dates'
import { type TableHeader } from '@/utils/helpers/tables'
import { useEmployeesStore } from '@/stores/employees'
import { useDate } from 'vuetify'

const props = defineProps<{
  componentView: 'employees' | 'benefits' | 'payroll'
  tableHeaders: TableHeader[]
}>()

const date = useDate()

const employeesStore = useEmployeesStore()
</script>

<template>
  <!-- PDF Export Container - hidden table para sa PDF generation -->
  <div style="/* display: none */" id="employees-table">
    <h2 class="report-title ">{{ props.componentView.toUpperCase() }} EMPLOYEES REPORT</h2>
    <table class="pdf-table pa-2">
      <thead class="pdf-thead">
        <tr>
          <th
            v-for="header in props.tableHeaders.filter((h) => h.key !== 'actions')"
            :key="header.key"
            class="pdf-th pdf-th--wide"
          >
            {{ header.title }}
          </th>
          <th class="pdf-th pdf-th--narrow justify-center align-center">ID No.</th>
          <th class="pdf-th justify-center align-center">Birthdate</th>
          <th class="pdf-th pdf-th--wide">Address</th>
          <th class="pdf-th pdf-th--wide">Years of Service</th>
          <th class="pdf-th pdf-th--wide">Contract Status</th>
          <th class="pdf-th pdf-th--narrow">Field Staff</th>
          <th class="pdf-th pdf-th--narrow">TIN No.</th>
          <th class="pdf-th pdf-th--narrow">SSS No.</th>
          <th class="pdf-th pdf-th--wide">PhilHealth No.</th>
          <th class="pdf-th pdf-th--wide">Pag-IBIG No.</th>
          <th class="pdf-th pdf-th--wide">Area Origin</th>
          <th class="pdf-th pdf-th--wide">Area Assignment</th>
          <template v-if="props.componentView === 'benefits' || props.componentView === 'payroll'">
            <th class="pdf-th pdf-th--narrow">Daily Rate</th>
            <th class="pdf-th pdf-th--narrow">Acc. Ins.</th>
          </template>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in employeesStore.employeesExport" :key="item.id" class="pdf-tr">
          <td class="pdf-td pdf-td--bold ">{{ item.lastname }}, {{ item.firstname }}</td>
          <td class="pdf-td">{{ item.phone }}</td>
          <td class="pdf-td">{{ item.email }}</td>
          <td class="pdf-td">{{ item.designation.designation }}</td>
          <td class="pdf-td pdf-td--bold">
            {{ date.format(item.hired_at, 'fullDate') }}
          </td>
          <td class="pdf-td pdf-td--bold pdf-td--narrow">
            {{ getIDNumber(item.hired_at, item.id) }}
          </td>
          <td class="pdf-td">
            {{ item.birthdate ? date.format(item.birthdate, 'fullDate') : 'n/a' }}
          </td>
          <td class="pdf-td pdf-td--wide">{{ item.address }}</td>
          <td class="pdf-td pdf-td--bold pdf-td--narrow">
            {{ getYearsOfService(item.hired_at) }}
          </td>
          <td class="pdf-td pdf-td--narrow">
            {{ item.is_permanent ? 'Permanent' : 'Contractual' }}
          </td>
          <td class="pdf-td pdf-td--extra-narrow">
            {{ item.is_field_staff ? 'Yes' : 'No' }}
          </td>
          <td class="pdf-td pdf-td--narrow">{{ item.tin_no }}</td>
          <td class="pdf-td pdf-td--narrow">{{ item.sss_no }}</td>
          <td class="pdf-td pdf-td--narrow">{{ item.philhealth_no }}</td>
          <td class="pdf-td pdf-td--narrow">{{ item.pagibig_no }}</td>
          <td class="pdf-td pdf-td--narrow">
            {{ item.area_origin ? item.area_origin.area : 'n/a' }}
          </td>
          <td class="pdf-td pdf-td--narrow">
            {{ item.area_assignment ? item.area_assignment.area : 'n/a' }}
          </td>
          <template v-if="props.componentView === 'benefits' || props.componentView === 'payroll'">
            <td class="pdf-td pdf-td--bold pdf-td--narrow">
              {{ item.daily_rate ? getMoneyText(item.daily_rate) : 'n/a' }}
            </td>
            <td class="pdf-td pdf-td--narrow ">
              {{ item.is_insured ? 'Yes' : 'No' }}
            </td>
          </template>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.report-title {
  text-align: center;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: bold;
  page-break-after: avoid;
}

.pdf-table {
  border-collapse: collapse;
  font-size: 7px;
  width: 100%;
  page-break-inside: auto;
  table-layout: fixed;
}

.pdf-thead {
  page-break-inside: avoid;
  page-break-after: auto;
}

.pdf-th {
  border: 1px solid #ddd;
  padding: 0px;
  text-align: center;
  background-color: #f5f5f5;
  font-size: 7px;
  font-weight: bold;
  width: 8%;
}

.pdf-th--narrow {
  width: 6%;
}

.pdf-th--wide {
  width: 12%;
}

.pdf-tr {
  page-break-inside: avoid;
}

.pdf-td {
  border: 1px solid #ddd;
  padding: 1px;
  font-size: 7px;
  word-wrap: break-word;
  overflow-wrap: break-word;
  width: 8%;
  text-align: center;
}

.pdf-td--bold {
  font-weight: bold;
}

.pdf-td--narrow {
  width: 6%;
}

.pdf-td--wide {
  width: 12%;
}

.pdf-td--extra-narrow {
  width: 5%;
}
</style>
