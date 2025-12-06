<script setup lang="ts">
import { computed } from 'vue'
import { formatHoursOneDecimal } from './helpers'
import { getExcessMinutes, getUndertimeMinutes, type AttendanceRecord as BaseAttendanceRecord } from './computation/computation'
import { isFridayOrSaturday } from './computation/attendance'

// Extend AttendanceRecord to include optional debug field
interface AttendanceRecord extends BaseAttendanceRecord {
  _debug_dayHours?: number
}

interface Holiday {
  id?: number
  holiday_at?: string
  type?: string | null
  description?: string
  attendance_fraction?: number
}

interface AttendanceWithLateness {
  date: string
  amIn: string
  amOut: string
  pmIn: string
  pmOut: string
  hours: string
  type: 'full' | 'half-am' | 'half-pm'
  amLate: number
  pmLate: number
  amUndertime: number
  pmUndertime: number
  hasLateness: boolean
  isRegularHoliday?: boolean
  holidayDescription?: string
}

const props = defineProps<{
  attendanceRecords: AttendanceRecord[]
  totalHoursWorked: number
  isFieldStaff?: boolean
  monthLateDeduction?: number
  monthUndertimeDeduction?: number
  holidays?: Holiday[]
}>()

// Hide hours for all staff types since both now use days-based calculation
const shouldHideHours = computed(() => true)

// Calculate full days and half days count with late/undertime data
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
  const records: AttendanceWithLateness[] = []

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

    // Format date as "Nov 15" or "Oct 1" for compact display
    const dateValue = attendance.attendance_date || attendance.date
    let date = 'N/A'
    if (dateValue) {
      const d = new Date(dateValue)
      const month = d.toLocaleDateString('en-US', { month: 'short' })
      const day = d.getDate()
      date = `${month} ${day}`
    }
    const hours = (attendance._debug_dayHours || 0).toFixed(1)

    // Check if this date is a Regular Holiday
    const attendanceDate = attendance.attendance_date || attendance.date
    const holiday = props.holidays?.find(h => {
      if (!h.holiday_at || !attendanceDate) return false
      const holidayDate = new Date(h.holiday_at).toISOString().split('T')[0]
      const attDate = new Date(attendanceDate).toISOString().split('T')[0]
      return holidayDate === attDate
    })
    const isRegularHoliday = holiday?.type?.toUpperCase().includes('RH') || false
    const holidayDescription = isRegularHoliday ? holiday?.description : undefined

    // Calculate late and undertime for this attendance record
    const isFriSat = attendanceDate ? isFridayOrSaturday(attendanceDate) : false

    // Determine time rules based on staff type and day of week
    let amStartTime, pmStartTime, amEndTime, pmEndTime

    if (props.isFieldStaff) {
      // Field staff time rules: 7:20 AM start, 11:50 AM end, PM same as office
      amStartTime = '07:20'
      pmStartTime = isFriSat ? '13:00' : '13:00'
      amEndTime = '11:50'
      pmEndTime = isFriSat ? '16:30' : '17:00'
    } else {
      // Office staff time rules: 8:12 AM start
      amStartTime = isFriSat ? '08:12' : '08:12'
      pmStartTime = isFriSat ? '13:00' : '13:00'
      amEndTime = isFriSat ? '11:50' : '11:50'
      pmEndTime = isFriSat ? '16:30' : '17:00'
    }

    // Calculate late minutes
    let amLate = 0
    let pmLate = 0
    let amUndertime = 0
    let pmUndertime = 0

    if (attendance.am_time_in) {
      amLate = getExcessMinutes(amStartTime, attendance.am_time_in)
    }
    if (attendance.pm_time_in) {
      pmLate = getExcessMinutes(pmStartTime, attendance.pm_time_in)
    }
    if (attendance.am_time_out) {
      amUndertime = getUndertimeMinutes(amEndTime, attendance.am_time_out)
    }
    if (attendance.pm_time_out) {
      pmUndertime = getUndertimeMinutes(pmEndTime, attendance.pm_time_out)
    }

    const hasLateness = amLate > 0 || pmLate > 0 || amUndertime > 0 || pmUndertime > 0

    // Console log the late and undertime data for each day
    if (hasLateness) {
      // console.log(`[ATTENDANCE LATE/UNDERTIME] ${date} (${dateValue}):`, {
      //   amLate: amLate > 0 ? `${amLate} minutes` : 'None',
      //   pmLate: pmLate > 0 ? `${pmLate} minutes` : 'None',
      //   amUndertime: amUndertime > 0 ? `${amUndertime} minutes` : 'None',
      //   pmUndertime: pmUndertime > 0 ? `${pmUndertime} minutes` : 'None',
      //   timeIn: { am: attendance.am_time_in, pm: attendance.pm_time_in },
      //   timeOut: { am: attendance.am_time_out, pm: attendance.pm_time_out },
      //   expectedTimes: { amStart: amStartTime, pmStart: pmStartTime, amEnd: amEndTime, pmEnd: pmEndTime },
      //   dayType: isFriSat ? 'Friday/Saturday' : 'Weekday'
      // })
    }

    // For Regular Holidays, any attendance counts as full day
    const hasAnyAttendance = hasAmData || hasPmData

    if (isRegularHoliday && hasAnyAttendance) {
      // RH: Any attendance = Full day (even if only AM or PM)
      fullDaysCount += 1
      records.push({
        date,
        amIn: attendance.am_time_in || '-',
        amOut: attendance.am_time_out || '-',
        pmIn: attendance.pm_time_in || '-',
        pmOut: attendance.pm_time_out || '-',
        hours,
        type: 'full',
        amLate,
        pmLate,
        amUndertime,
        pmUndertime,
        hasLateness,
        isRegularHoliday: true,
        holidayDescription
      })
    } else if (hasAmData && hasPmData) {
      fullDaysCount += 1
      records.push({
        date,
        amIn: attendance.am_time_in || '-',
        amOut: attendance.am_time_out || '-',
        pmIn: attendance.pm_time_in || '-',
        pmOut: attendance.pm_time_out || '-',
        hours,
        type: 'full',
        amLate,
        pmLate,
        amUndertime,
        pmUndertime,
        hasLateness,
        isRegularHoliday: false
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
        type: 'half-am',
        amLate,
        pmLate: 0,
        amUndertime,
        pmUndertime: 0,
        hasLateness: amLate > 0 || amUndertime > 0,
        isRegularHoliday: false
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
        type: 'half-pm',
        amLate: 0,
        pmLate,
        amUndertime: 0,
        pmUndertime,
        hasLateness: pmLate > 0 || pmUndertime > 0,
        isRegularHoliday: false
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

// Calculate total late and undertime minutes
const totals = computed(() => {
  const records = attendanceStats.value.records
  let totalLateMinutes = 0
  let totalUndertimeMinutes = 0

  records.forEach(record => {
    totalLateMinutes += record.amLate + record.pmLate
    totalUndertimeMinutes += record.amUndertime + record.pmUndertime
  })

  // console.warn(`[TOOLTIP TOTALS] Late: ${totalLateMinutes} minutes, Undertime: ${totalUndertimeMinutes} minutes`)
  // console.warn(`[TOOLTIP DATA DEBUG] Total attendance records: ${props.attendanceRecords.length}, Processed records: ${records.length}`)
  // console.warn(`[TOOLTIP ATTENDANCE DATA]`, props.attendanceRecords.map(r => ({
  //   date: r.attendance_date || r.date,
  //   amIn: r.am_time_in,
  //   amOut: r.am_time_out,
  //   pmIn: r.pm_time_in,
  //   pmOut: r.pm_time_out
  // })))

  return {
    totalLateMinutes,
    totalUndertimeMinutes
  }
})

// Chunk records into groups of 3 for table rows
const chunkedRecords = computed(() => {
  const records = attendanceStats.value.records
  const chunks: (AttendanceWithLateness | null)[][] = []
  for (let i = 0; i < records.length; i += 3) {
    const chunk: (AttendanceWithLateness | null)[] = records.slice(i, i + 3)
    // Fill empty slots with null to maintain 3-column structure
    while (chunk.length < 3) {
      chunk.push(null)
    }
    chunks.push(chunk)
  }
  return chunks
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

    <div class="pa-1">
      <div v-if="attendanceStats.records.length > 0" class="text-caption">
        <div class="font-weight-bold mb-1">Daily Records:</div>
        <table class="attendance-table">
          <template v-for="(chunk, chunkIndex) in chunkedRecords" :key="`chunk-${chunkIndex}`">
            <tr>
              <td v-for="(record, index) in chunk" :key="record ? `record-${index}` : `empty-${index}`" class="attendance-cell">
                <div v-if="record" class="record-content">
                  <div class="record-header">
                    <span class="record-number">{{ (chunkIndex * 3) + index + 1 }}.</span>
                    <span class="record-date">{{ record!.date }}</span>
                  </div>
                  <div class="chips-row">
                    <v-chip
                      size="x-small"
                      :color="record!.type === 'full' ? 'success' : 'warning'"
                      variant="flat"
                      class="mr-1"
                    >
                      {{ record!.type === 'full' ? 'Full' : record!.type === 'half-am' ? 'AM' : 'PM' }}
                    </v-chip>
                    <v-chip
                      v-if="record!.isRegularHoliday"
                      size="x-small"
                      color="blue"
                      variant="flat"
                      class="mr-1"
                    >
                      RH
                    </v-chip>
                    <v-chip
                      v-if="record!.hasLateness"
                      size="x-small"
                      color="error"
                      variant="flat"
                      class="mr-1"
                    >
                      Late
                    </v-chip>
                    <span v-if="!shouldHideHours" class="hours-text">{{ record!.hours }}h</span>
                  </div>
                  <div v-if="record!.isRegularHoliday" class="holiday-info">
                    <div class="text-blue text-xs font-italic">
                      {{ record!.holidayDescription || 'Regular Holiday' }}
                    </div>
                    <div class="text-blue-lighten-2 text-xs">
                      Counted as full day
                    </div>
                  </div>
                  <div v-if="record!.hasLateness" class="lateness-info">
                    <div v-if="record!.amLate > 0 || record!.pmLate > 0" class="text-red text-xs">
                      <span v-if="record!.amLate > 0">AM Late: {{ record!.amLate }}min</span>
                      <span v-if="record!.amLate > 0 && record!.pmLate > 0"> | </span>
                      <span v-if="record!.pmLate > 0">PM Late: {{ record!.pmLate }}min</span>
                    </div>
                    <div v-if="record!.amUndertime > 0 || record!.pmUndertime > 0" class="text-orange text-xs">
                      <span v-if="record!.amUndertime > 0">AM UT: {{ record!.amUndertime }}min</span>
                      <span v-if="record!.amUndertime > 0 && record!.pmUndertime > 0"> | </span>
                      <span v-if="record!.pmUndertime > 0">PM UT: {{ record!.pmUndertime }}min</span>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </template>
        </table>
      </div>

      <!-- Summary Section -->
      <div class="text-caption mt-2 pt-2" style="border-top: 1px solid rgba(255,255,255,0.1);">
        <div>
          <strong>Summary:</strong>
        </div>
        <div v-if="!shouldHideHours">
          Total: {{ formatHoursOneDecimal(totalHoursWorked) }} hrs
        </div>
        <div v-if="attendanceStats.halfDaysCount > 0">
          {{ attendanceStats.halfDaysCount }} half day{{ attendanceStats.halfDaysCount !== 1 ? 's' : '' }} = {{ attendanceStats.mergedHalfDays }} merged
        </div>
        <div v-if="attendanceStats.records.some(r => r.isRegularHoliday)" class="text-blue-lighten-1 mt-1">
          <v-icon icon="mdi-information" size="x-small" class="me-1"></v-icon>
          <strong>Note:</strong> Regular Holiday (RH) attendance with any record counts as full day
        </div>
        <div v-if="totals.totalLateMinutes > 0 || (monthLateDeduction !== undefined && monthLateDeduction > 0)" class="text-red">
          <strong>Late Minutes:</strong> {{ totals.totalLateMinutes }}
          <span v-if="monthLateDeduction !== undefined && monthLateDeduction !== totals.totalLateMinutes" class="text-yellow">
            (Payroll: {{ monthLateDeduction }})
          </span>
        </div>
        <div v-if="totals.totalUndertimeMinutes > 0 || (monthUndertimeDeduction !== undefined && monthUndertimeDeduction > 0)" class="text-orange">
          <strong>Undertime Minutes:</strong> {{ totals.totalUndertimeMinutes }}
          <span v-if="monthUndertimeDeduction !== undefined && monthUndertimeDeduction !== totals.totalUndertimeMinutes" class="text-yellow">
            (Payroll: {{ monthUndertimeDeduction }})
          </span>
        </div>
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

.gap-1 {
  gap: 0.25rem;
}

.text-xs {
  font-size: 0.75rem;
  line-height: 1rem;
}

.attendance-table {
  width: 100%;
  border-collapse: collapse;
}

.attendance-cell {
  width: 33.33%;
  vertical-align: top;
  padding: 2px;
}

.record-content {
  font-size: 0.65rem;
}

.record-header {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-bottom: 2px;
  font-weight: 500;
}

.record-number {
  font-weight: bold;
  min-width: 14px;
}

.record-date {
  flex: 1;
}

.chips-row {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-bottom: 2px;
  flex-wrap: wrap;
}

.hours-text {
  font-size: 0.6rem;
  color: rgba(255, 255, 255, 0.7);
  margin-left: 2px;
}

.holiday-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  margin-bottom: 2px;
}

.holiday-info .text-xs {
  font-size: 0.6rem;
  line-height: 0.85;
}

.lateness-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.lateness-info .text-xs {
  font-size: 0.6rem;
  line-height: 0.85;
}


</style>
