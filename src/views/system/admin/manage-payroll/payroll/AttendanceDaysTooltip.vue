<script setup lang="ts">
import { computed } from 'vue'
import { formatHoursOneDecimal } from './helpers'

interface AttendanceRecord {
  am_time_in?: string | null
  am_time_out?: string | null
  pm_time_in?: string | null
  pm_time_out?: string | null
  attendance_date?: string
  date?: string
  _debug_dayHours?: number
}

const props = defineProps<{
  attendanceRecords: AttendanceRecord[]
  totalHoursWorked: number
  isFieldStaff?: boolean
}>()

const shouldHideHours = computed(() => !props.isFieldStaff)

// Calculate full days and half days count
const attendanceStats = computed(() => {
  if (!props.attendanceRecords || props.attendanceRecords.length === 0) {
    return {
      fullDaysCount: 0,
      halfDaysCount: 0,
      mergedHalfDays: 0,
      totalCount: 0,
      records: []
    }
  }

  let fullDaysCount = 0
  let halfDaysCount = 0
  const records: Array<{
    date: string
    amIn: string
    amOut: string
    pmIn: string
    pmOut: string
    hours: string
    type: 'full' | 'half-am' | 'half-pm'
  }> = []

  props.attendanceRecords.forEach((attendance) => {
    const hasAmData =
      attendance.am_time_in !== null &&
      attendance.am_time_in !== undefined &&
      attendance.am_time_in !== '' &&
      attendance.am_time_out !== null &&
      attendance.am_time_out !== undefined &&
      attendance.am_time_out !== ''

    const hasPmData =
      attendance.pm_time_in !== null &&
      attendance.pm_time_in !== undefined &&
      attendance.pm_time_in !== '' &&
      attendance.pm_time_out !== null &&
      attendance.pm_time_out !== undefined &&
      attendance.pm_time_out !== ''

    const date = attendance.attendance_date || attendance.date || 'N/A'
    const hours = (attendance._debug_dayHours || 0).toFixed(1)

    if (hasAmData && hasPmData) {
      fullDaysCount += 1
      records.push({
        date,
        amIn: attendance.am_time_in || '-',
        amOut: attendance.am_time_out || '-',
        pmIn: attendance.pm_time_in || '-',
        pmOut: attendance.pm_time_out || '-',
        hours,
        type: 'full'
      })
    } else if (hasAmData) {
      halfDaysCount += 1
      records.push({
        date,
        amIn: attendance.am_time_in || '-',
        amOut: attendance.am_time_out || '-',
        pmIn: '-',
        pmOut: '-',
        hours,
        type: 'half-am'
      })
    } else if (hasPmData) {
      halfDaysCount += 1
      records.push({
        date,
        amIn: '-',
        amOut: '-',
        pmIn: attendance.pm_time_in || '-',
        pmOut: attendance.pm_time_out || '-',
        hours,
        type: 'half-pm'
      })
    }
  })

  const mergedHalfDays = Math.floor(halfDaysCount / 2)
  const remainingHalfDays = halfDaysCount % 2
  const totalCount = fullDaysCount + mergedHalfDays + (remainingHalfDays * 0.5)

  return {
    fullDaysCount,
    halfDaysCount,
    mergedHalfDays,
    remainingHalfDays,
    totalCount,
    records
  }
})

const daysCount = computed(() => {
  const total = attendanceStats.value.totalCount
  // Format the display: show 0.5 for half days, whole numbers for full/merged
  return total % 1 === 0 ? total : total.toFixed(1)
})
</script>

<template>
  <v-tooltip max-width="600" location="bottom">
    <template v-slot:activator="{ props: tooltipProps }">
      <span
        v-bind="tooltipProps"
        class="attendance-link"
      >
        {{ daysCount }} day{{ daysCount !== 1 ? 's' : '' }}<template v-if="!shouldHideHours"> ({{ formatHoursOneDecimal(totalHoursWorked) }} hrs)</template>
      </span>
    </template>

    <div class="pa-3">


      <div v-if="attendanceStats.records.length > 0" class="text-caption">
        <div class="font-weight-bold mb-1">Daily Records:</div>
        <div
          v-for="(record, index) in attendanceStats.records"
          :key="index"
          class="d-flex justify-space-between mb-1"
        >
          <span><strong>{{ index + 1 }}.</strong> {{ record.date }}</span>
          <span>
            <v-chip
              size="x-small"
              :color="record.type === 'full' ? 'success' : 'warning'"
              variant="flat"
              class="mx-1"
            >
              {{ record.type === 'full' ? 'Full' : record.type === 'half-am' ? 'AM' : 'PM' }}
            </v-chip>
            <template v-if="!shouldHideHours">{{ record.hours }}h</template>
          </span>
        </div>
      </div>

      <div v-if="!shouldHideHours" class="text-caption mt-2">
        Total: {{ formatHoursOneDecimal(totalHoursWorked) }} hrs
        <span v-if="attendanceStats.halfDaysCount > 0">
          • {{ attendanceStats.halfDaysCount }} half day{{ attendanceStats.halfDaysCount !== 1 ? 's' : '' }} = {{ attendanceStats.mergedHalfDays }} merged
        </span>
      </div>
      <div v-else class="text-caption mt-2">
        <span v-if="attendanceStats.halfDaysCount > 0">
          {{ attendanceStats.halfDaysCount }} half day{{ attendanceStats.halfDaysCount !== 1 ? 's' : '' }} = {{ attendanceStats.mergedHalfDays }} merged
        </span>
      </div>
    </div>
  </v-tooltip>
</template><style scoped>
.attendance-link {
  color: rgb(var(--v-theme-primary));
  text-decoration: underline;
  text-decoration-style: dotted;
  text-underline-offset: 2px;
  cursor: help;
  transition: opacity 0.2s;
}

.attendance-link:hover {
  opacity: 0.8;
}

.gap-3 {
  gap: 0.75rem;
}
</style>
