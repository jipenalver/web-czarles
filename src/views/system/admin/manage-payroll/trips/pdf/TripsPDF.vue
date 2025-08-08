<script setup lang="ts">
import { type TripTableFilter, useTripsStore } from '@/stores/trips'
import { useEmployeesStore } from '@/stores/employees'
import { getMoneyText } from '@/utils/helpers/others'
import { useDate } from 'vuetify'

const props = defineProps<{
  tableFilters: TripTableFilter
}>()

const date = useDate()

const employeesStore = useEmployeesStore()
const tripsStore = useTripsStore()

const getEmployeeName = (id: number) => {
  const employee = employeesStore.employees.find((e) => e.id === id)
  return employee ? `${employee.lastname}, ${employee.firstname}` : ''
}
</script>

<template>
  <!-- PDF Export Container - hidden table para sa PDF generation -->
  <div style="display: none" id="trips-table">
    <div class="report-header">
      <h2 class="report-title">TRIPS REPORT</h2>
      <p class="report-subtitle">Generated on {{ date.format(new Date(), 'fullDate') }}</p>
    </div>

    <!-- Employee filter info para sa PDF -->
    <div v-if="props.tableFilters.employee_id" class="employee-filter">
      <strong class="employee-label">Employee: </strong>
      <span class="employee-name">
        {{ getEmployeeName(props.tableFilters.employee_id) }}
      </span>
    </div>

    <div class="table-container">
      <table class="pdf-table">
        <thead>
          <tr>
            <th v-if="!props.tableFilters.employee_id" class="pdf-th">Employee</th>
            <th class="pdf-th">Unit</th>
            <th class="pdf-th">Trip Date</th>
            <th class="pdf-th">Location</th>
            <th class="pdf-th">Materials</th>
            <th class="pdf-th pdf-th--center">KM</th>
            <th class="pdf-th pdf-th--center">Trips</th>
            <th class="pdf-th pdf-th--right">Rate</th>
            <th class="pdf-th pdf-th--right">Total Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in tripsStore.tripsCSV" :key="item.id">
            <td v-if="!props.tableFilters.employee_id" class="pdf-td">
              <div class="employee-name-cell">
                {{ item.employee.lastname + ', ' + item.employee.firstname }}
              </div>
            </td>
            <td class="pdf-td pdf-td--small">{{ item.unit.name }}</td>
            <td class="pdf-td pdf-td--small">
              {{ date.format(item.trip_at, 'fullDate') }}
            </td>
            <td class="pdf-td pdf-td--small pdf-td--break-word">
              {{ item.trip_location.location }}
            </td>
            <td class="pdf-td pdf-td--small pdf-td--break-word">
              {{ item.materials }}
            </td>
            <td class="pdf-td pdf-td--small pdf-td--center">{{ item.km }}</td>
            <td class="pdf-td pdf-td--small pdf-td--center pdf-td--bold">
              {{ item.trip_no }}
            </td>
            <td class="pdf-td pdf-td--small pdf-td--right">
              {{ getMoneyText(item.per_trip) }}
            </td>
            <td class="pdf-td pdf-td--small pdf-td--right pdf-td--bold">
              {{ getMoneyText(item.trip_no * item.per_trip) }}
            </td>
          </tr>
          <!-- Summary row para sa total -->
          <tr v-if="tripsStore.tripsCSV.length > 0" class="pdf-summary-row">
            <td
              :colspan="props.tableFilters.employee_id ? 7 : 8"
              class="pdf-td pdf-td--summary-label"
            >
              <strong>TOTAL AMOUNT:</strong>
            </td>
            <td class="pdf-td pdf-td--summary-total">
              {{
                getMoneyText(
                  tripsStore.tripsCSV.reduce((sum, item) => sum + item.trip_no * item.per_trip, 0),
                )
              }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.report-header {
  text-align: center;
  margin-bottom: 20px;
}

.report-title {
  margin: 0;
  font-size: 18px;
  font-weight: bold;
}

.report-subtitle {
  margin: 5px 0;
  font-size: 12px;
  color: #666;
}

.employee-filter {
  margin-bottom: 15px;
  padding: 10px;
  background-color: #f5f5f5;
  border-left: 4px solid #ddd;
}

.employee-label,
.employee-name {
  font-size: 14px;
}

.table-container {
  width: 100%;
  display: flex;
  justify-content: center;
}

.pdf-table {
  border-collapse: collapse;
  font-size: 11px;
  font-family: Arial, sans-serif;
  background-color: #f5f5f5;
  margin: 0 auto;
}

.pdf-th {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
  font-weight: bold;
  background-color: #f5f5f5;
}

.pdf-th--center {
  text-align: center;
}

.pdf-th--right {
  text-align: right;
}

.pdf-td {
  border: 1px solid #ddd;
  padding: 6px;
  vertical-align: top;
  background-color: #f5f5f5;
}

.pdf-td--small {
  font-size: 10px;
}

.pdf-td--center {
  text-align: center;
}

.pdf-td--right {
  text-align: right;
}

.pdf-td--bold {
  font-weight: bold;
}

.pdf-td--break-word {
  word-break: break-word;
}

.employee-name-cell {
  font-weight: bold;
  font-size: 10px;
}

.pdf-summary-row {
  font-weight: bold;
  background-color: #f5f5f5;
}

.pdf-td--summary-label {
  text-align: right;
  font-size: 12px;
}

.pdf-td--summary-total {
  text-align: right;
  font-size: 12px;
  font-weight: bold;
}
</style>
