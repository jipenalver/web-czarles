import { type TableOptions, tablePagination } from '@/utils/helpers/tables'
import { type PostgrestFilterBuilder } from '@supabase/postgrest-js'
import { type Employee } from './employees'
import { supabase } from '@/utils/supabase'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export type Attendance = {
  id: number
  created_at: string
  am_time_in: string
  am_time_out: string
  pm_time_in: string
  pm_time_out: string
  employee_id: string | null
  employee: Employee
}

export type AttendanceForm = Omit<Attendance, 'employee'> & {
  date: string | null
}

export type AttendanceTableFilter = {
  employee_id: string | null
}

export const useAttendancesStore = defineStore('attendances', () => {
  // States
  const attendances = ref<Attendance[]>([])
  const attendancesTable = ref<Attendance[]>([])
  const attendancesTableTotal = ref(0)

  // Reset State
  function $reset() {
    attendances.value = []
    attendancesTable.value = []
    attendancesTableTotal.value = 0
  }

  // Actions
  async function getAttendances() {
    const { data } = await supabase.from('attendances').select()

    attendances.value = data as Attendance[]
  }

  async function getAttendancesTable(
    tableOptions: TableOptions,
    { employee_id }: AttendanceTableFilter,
  ) {
    const { rangeStart, rangeEnd, column, order } = tablePagination(tableOptions, 'id', false)

    let query = supabase
      .from('attendances')
      .select('*, employee:employee_id (*)')
      .order(column, { ascending: order })
      .range(rangeStart, rangeEnd)

    query = getAttendancesFilter(query, { employee_id })

    const { data } = await query

    const { count } = await getAttendancesCount({ employee_id })

    attendancesTable.value = data as Attendance[]
    attendancesTableTotal.value = count as number
  }

  async function getAttendancesCount({ employee_id }: AttendanceTableFilter) {
    let query = supabase.from('attendances').select('*', { count: 'exact', head: true })

    query = getAttendancesFilter(query, { employee_id })

    return await query
  }

  function getAttendancesFilter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query: PostgrestFilterBuilder<any, any, any>,
    { employee_id }: AttendanceTableFilter,
  ) {
    if (employee_id) query = query.eq('employee_id', employee_id)

    return query
  }

  async function addAttendance(formData: Partial<Attendance>) {
    return await supabase.from('attendances').insert(formData).select()
  }

  async function updateAttendance(formData: Partial<Attendance>) {
    return await supabase.from('attendances').update(formData).eq('id', formData.id).select()
  }

  // Expose States and Actions
  return {
    attendances,
    attendancesTable,
    attendancesTableTotal,
    $reset,
    getAttendances,
    getAttendancesTable,
    addAttendance,
    updateAttendance,
  }
})
