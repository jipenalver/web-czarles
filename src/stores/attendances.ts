import { MILLISECONDS_PER_DAY, getDate, prepareDate } from '@/utils/helpers/dates'
import { type TableOptions, tablePagination } from '@/utils/helpers/tables'
import { type PostgrestFilterBuilder } from '@supabase/postgrest-js'
import { type Employee } from './employees'
import { supabase } from '@/utils/supabase'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export type Attendance = {
  id: number
  created_at: string
  date: string | null
  am_time_in: string | null
  am_time_out: string | null
  pm_time_in: string | null
  pm_time_out: string | null
  is_am_in_rectified: boolean
  is_am_out_rectified: boolean
  is_pm_in_rectified: boolean
  is_pm_out_rectified: boolean
  is_overtime_applied: boolean
  overtime_in: string | null
  overtime_out: string | null
  is_overtime_in_rectified: boolean
  is_overtime_out_rectified: boolean
  employee_id: number | null
  employee: Employee
  attendance_images: AttendanceImage[]
  is_am_leave: boolean
  is_pm_leave: boolean
  is_leave_with_pay: boolean
  leave_type: string | null
  leave_reason: string
}

export type AttendanceImage = {
  image_path: string
  image_type: string
  created_at: string
}

export type AttendanceTableFilter = {
  employee_id: number | null
  attendance_at: Date[] | null
}

export const useAttendancesStore = defineStore('attendances', () => {
  const selectQuery =
    '*, employee:employee_id (id, firstname, lastname, middlename), attendance_images (*)'

  // States
  const attendances = ref<Attendance[]>([])
  const attendancesTable = ref<Attendance[]>([])
  const attendancesTableTotal = ref(0)
  const attendancesCSV = ref<Attendance[]>([])

  // Reset State
  function $reset() {
    attendances.value = []
    attendancesTable.value = []
    attendancesTableTotal.value = 0
    attendancesCSV.value = []
  }

  // Actions
  async function getAttendances() {
    const { data } = await supabase
      .from('attendances')
      .select(selectQuery)
      .order('am_time_in', { ascending: false })

    attendances.value = data as Attendance[]
  }

  async function getAttendancesCSV(
    tableOptions: TableOptions,
    tableFilters: AttendanceTableFilter,
  ) {
    const { column, order } = tablePagination(tableOptions, 'am_time_in', false)

    let query = supabase.from('attendances').select(selectQuery).order(column, { ascending: order })

    query = getAttendancesFilter(query, tableFilters)

    const { data } = await query

    attendancesCSV.value = data as Attendance[]
  }

  async function getAttendancesTable(
    tableOptions: TableOptions,
    tableFilters: AttendanceTableFilter,
  ) {
    const { rangeStart, rangeEnd, column, order } = tablePagination(
      tableOptions,
      'am_time_in',
      false,
    )

    let query = supabase
      .from('attendances')
      .select(selectQuery)
      .order(column, { ascending: order })
      .range(rangeStart, rangeEnd)

    query = getAttendancesFilter(query, tableFilters)

    const { data } = await query

    const { count } = await getAttendancesCount(tableFilters)

    attendancesTable.value = data?.map((item) => {
      return {
        ...item,
        date: item.am_time_in ? getDate(item.am_time_in) : null,
      }
    }) as Attendance[]
    attendancesTableTotal.value = count as number
  }

  async function getAttendancesCount(tableFilters: AttendanceTableFilter) {
    let query = supabase.from('attendances').select('*', { count: 'exact', head: true })

    query = getAttendancesFilter(query, tableFilters)

    return await query
  }

  function getAttendancesFilter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query: PostgrestFilterBuilder<any, any, any>,
    { employee_id, attendance_at }: AttendanceTableFilter,
  ) {
    if (employee_id) query = query.eq('employee_id', employee_id)

    if (attendance_at) {
      const dateQuery = (dates: Date[], isRange = false) => {
        const startDate = dates[0]
        const endDate = isRange
          ? new Date(dates[dates.length - 1].getTime() + MILLISECONDS_PER_DAY)
          : new Date(startDate.getTime() + MILLISECONDS_PER_DAY)

        return query
          .gte('am_time_in', prepareDate(startDate))
          .lt('am_time_in', prepareDate(endDate))
      }

      query = dateQuery(attendance_at, attendance_at.length > 1)
    }

    return query
  }

  async function addAttendance(formData: Partial<Attendance>) {
    return await supabase.from('attendances').insert(formData).select()
  }

  async function updateAttendance(formData: Partial<Attendance>) {
    return await supabase.from('attendances').update(formData).eq('id', formData.id).select()
  }

  async function deleteAttendance(id: number) {
    const { data, error: deleteImagesError } = await supabase
      .from('attendance_images')
      .delete()
      .eq('attendance_id', id)

    if (deleteImagesError) return { data, error: deleteImagesError }

    return await supabase.from('attendances').delete().eq('id', id).select()
  }

  // Expose States and Actions
  return {
    attendances,
    attendancesTable,
    attendancesTableTotal,
    attendancesCSV,
    $reset,
    getAttendances,
    getAttendancesCSV,
    getAttendancesTable,
    addAttendance,
    updateAttendance,
    deleteAttendance,
  }
})
