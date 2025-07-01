import { type TableOptions, tablePagination } from '@/utils/helpers/tables'
import { type PostgrestFilterBuilder } from '@supabase/postgrest-js'
import { getDate } from '@/utils/helpers/others'
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
  employee_id: string | null
  is_am_in_rectified: boolean
  is_am_out_rectified: boolean
  is_pm_in_rectified: boolean
  is_pm_out_rectified: boolean
  is_am_absent: boolean
  is_pm_absent: boolean
  is_overtime_applied: boolean
  overtime_in: string | null
  overtime_out: string | null
  is_overtime_in_rectified: boolean
  is_overtime_out_rectified: boolean
  employee: Employee
  attendance_images: AttendanceImage[]
}

export type AttendanceImage = {
  image_path: string
  image_type: string
  created_at: string
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
  async function getAttendancesTable(
    tableOptions: TableOptions,
    { employee_id }: AttendanceTableFilter,
  ) {
    const { rangeStart, rangeEnd, column, order } = tablePagination(
      tableOptions,
      'am_time_in',
      false,
    )

    let query = supabase
      .from('attendances')
      .select(
        '*, employee:employee_id (id, firstname, lastname), attendance_images (image_path, image_type, created_at)',
      )
      .order(column, { ascending: order })
      .range(rangeStart, rangeEnd)

    query = getAttendancesFilter(query, { employee_id })

    const { data } = await query

    const { count } = await getAttendancesCount({ employee_id })

    attendancesTable.value = data?.map((item) => {
      return {
        ...item,
        date: item.am_time_in ? getDate(item.am_time_in) : null,
      }
    }) as Attendance[]
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

  async function deleteAttendance(id: number) {
    return await supabase.from('attendances').delete().eq('id', id).select()
  }

  // Expose States and Actions
  return {
    attendances,
    attendancesTable,
    attendancesTableTotal,
    $reset,
    getAttendancesTable,
    addAttendance,
    updateAttendance,
    deleteAttendance,
  }
})
