import { type TableOptions, tablePagination } from '@/utils/helpers/tables'
import { type PostgrestFilterBuilder } from '@supabase/postgrest-js'
import { getDate, prepareDateRange } from '@/utils/helpers/dates'
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
  user_id: string
  user_avatar: string | null
  user_fullname: string
}

export type AttendanceImage = {
  image_path: string
  image_type: string
  created_at: string
  coordinates: string | null
  is_from_offline: boolean | null
}

export type AttendanceTableFilter = {
  employee_id: number | null
  attendance_at: Date[] | null
  component_view: 'attendance' | 'leave' | 'overtime'
}

export const useAttendancesStore = defineStore('attendances', () => {
  const selectQuery =
    '*, employee:employee_id (id, firstname, lastname, middlename), attendance_images (*)'

  // States
  const attendances = ref<Attendance[]>([])
  const attendancesTable = ref<Attendance[]>([])
  const attendancesTableTotal = ref(0)
  const attendancesExport = ref<Attendance[]>([])

  // Reset State
  function $reset() {
    attendances.value = []
    attendancesTable.value = []
    attendancesTableTotal.value = 0
    attendancesExport.value = []
  }

  // Actions
  async function getAttendances() {
    const { data } = await supabase
      .from('attendances')
      .select(selectQuery)
      .order('created_at', { ascending: false })

    attendances.value = getAttendanceMap((data as Attendance[]) ?? [])
  }

  async function getAttendancesExport(
    tableOptions: TableOptions,
    tableFilters: AttendanceTableFilter,
  ) {
    const { column, order } = tablePagination(tableOptions, 'created_at', false)

    let query = supabase.from('attendances').select(selectQuery).order(column, { ascending: order })

    query = getAttendancesFilter(query, tableFilters)

    const { data } = await query

    attendancesExport.value = getAttendanceMap((data as Attendance[]) ?? [])
  }

  async function getAttendancesTable(
    tableOptions: TableOptions,
    tableFilters: AttendanceTableFilter,
  ) {
    const { rangeStart, rangeEnd, column, order } = tablePagination(
      tableOptions,
      'created_at',
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

    attendancesTable.value = getAttendanceMap((data as Attendance[]) ?? [])
    attendancesTableTotal.value = count as number
  }

  function getAttendanceMap(attendancesList: Attendance[]) {
    if (!attendancesList) {
      return []
    }

    return attendancesList
      .map((item) => ({
        ...item,
        date: item.am_time_in
          ? getDate(item.am_time_in)
          : item.pm_time_in
            ? getDate(item.pm_time_in)
            : null,
      }))
      .sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : -Infinity
        const dateB = b.date ? new Date(b.date).getTime() : -Infinity
        return dateB - dateA
      })
  }

  async function getAttendancesCount(tableFilters: AttendanceTableFilter) {
    let query = supabase.from('attendances').select('*', { count: 'exact', head: true })

    query = getAttendancesFilter(query, tableFilters)

    return await query
  }

  function getAttendancesFilter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query: PostgrestFilterBuilder<any, any, any, any>,
    { employee_id, attendance_at, component_view }: AttendanceTableFilter,
  ) {
    if (employee_id) query = query.eq('employee_id', employee_id)

    if (attendance_at) {
      const { startDate, endDate } = prepareDateRange(attendance_at, attendance_at.length > 1)

      if (startDate && endDate) {
        query = query.or(
          `and(am_time_in.gte.${startDate},am_time_in.lt.${endDate}),and(am_time_in.is.null,pm_time_in.gte.${startDate},pm_time_in.lt.${endDate})`,
        )
      }
    }

    if (component_view === 'leave') query = query.eq('is_am_leave', true).eq('is_pm_leave', true)
    else if (component_view === 'overtime' || component_view === 'attendance')
      query = query.or('is_am_leave.eq.false, is_pm_leave.eq.false')

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
    attendancesExport,
    $reset,
    getAttendances,
    getAttendancesExport,
    getAttendancesTable,
    addAttendance,
    updateAttendance,
    deleteAttendance,
  }
})
