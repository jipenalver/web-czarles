/* eslint-disable @typescript-eslint/no-unused-vars */
import { type TableOptions, tablePagination } from '@/utils/helpers/tables'
import { prepareDateRange, prepareFormDates } from '@/utils/helpers/dates'
import { type PostgrestFilterBuilder } from '@supabase/postgrest-js'
import { useAuthUserStore } from './authUser'
import { type Employee } from './employees'
import { supabase } from '@/utils/supabase'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export type AttendanceRequest = {
  id: number
  created_at: string
  date: string | null
  employee_id: number | null
  employee: Employee
  is_am_leave: boolean
  is_pm_leave: boolean
  is_leave_with_pay: boolean
  leave_type: string | null
  leave_reason: string
  leave_status: 'Pending' | 'Approved' | 'Rejected'
  requestor_id: string
  user_avatar: string | null
  user_fullname: string
  overtime_status: 'Pending' | 'Approved' | 'Rejected'
  overtime_in: string | null
  overtime_out: string | null
  type: 'Leave' | 'Overtime'
}

export type AttendanceRequestTableFilter = {
  employee_id: number | null
  attendance_at: Date[] | null
  component_view: 'leave-requests' | 'overtime-requests'
}

export const useAttendanceRequestsStore = defineStore('attendanceRequests', () => {
  const authUserStore = useAuthUserStore()

  const selectQuery = '*, employee:employee_id (id, firstname, lastname, middlename)'

  // States
  const attendanceRequests = ref<AttendanceRequest[]>([])
  const attendanceRequestsTable = ref<AttendanceRequest[]>([])
  const attendanceRequestsTableTotal = ref(0)

  // Reset State
  function $reset() {
    attendanceRequests.value = []
    attendanceRequestsTable.value = []
    attendanceRequestsTableTotal.value = 0
  }

  // Actions
  async function getAttendanceRequests() {
    const { data } = await supabase
      .from('attendance_requests')
      .select(selectQuery)
      .order('created_at', { ascending: false })

    attendanceRequests.value = data as AttendanceRequest[]
  }

  async function getAttendanceRequestsTable(
    tableOptions: TableOptions,
    tableFilters: AttendanceRequestTableFilter,
  ) {
    const { rangeStart, rangeEnd, column, order } = tablePagination(
      tableOptions,
      'created_at',
      false,
    )

    let query = supabase
      .from('attendance_requests')
      .select(selectQuery)
      .order(column, { ascending: order })
      .range(rangeStart, rangeEnd)

    query = getAttendanceRequestsFilter(query, tableFilters)

    const { data } = await query

    const { count } = await getAttendanceRequestsCount(tableFilters)

    attendanceRequestsTable.value = data as AttendanceRequest[]
    attendanceRequestsTableTotal.value = count as number
  }

  async function getAttendanceRequestsCount(tableFilters: AttendanceRequestTableFilter) {
    let query = supabase.from('attendance_requests').select('*', { count: 'exact', head: true })

    query = getAttendanceRequestsFilter(query, tableFilters)

    return await query
  }

  function getAttendanceRequestsFilter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query: PostgrestFilterBuilder<any, any, any, any>,
    { employee_id, attendance_at, component_view }: AttendanceRequestTableFilter,
  ) {
    if (employee_id) query = query.eq('employee_id', employee_id)

    if (attendance_at) {
      const { startDate, endDate } = prepareDateRange(attendance_at, attendance_at.length > 1)

      if (startDate && endDate) query = query.or(`and(date.gte.${startDate},date.lt.${endDate})`)
    }

    if (component_view === 'leave-requests') query = query.eq('type', 'leave')
    else if (component_view === 'overtime-requests') query = query.eq('type', 'overtime')

    return query
  }

  async function addAttendanceRequest(formData: Partial<AttendanceRequest>) {
    const preparedData = prepareFormDates(
      {
        ...formData,
        requestor_id: authUserStore.userData?.id as string,
        user_avatar: authUserStore.userData?.avatar || null,
        user_fullname: authUserStore.userData?.firstname + ' ' + authUserStore.userData?.lastname,
      },
      ['date'],
    )

    return await supabase.from('attendance_requests').insert(preparedData).select()
  }

  async function updateAttendanceRequest(formData: Partial<AttendanceRequest>) {
    const { employee, ...updatedData } = prepareFormDates(formData, ['date'])

    return await supabase
      .from('attendance_requests')
      .update(updatedData)
      .eq('id', formData.id)
      .select()
  }

  async function deleteAttendanceRequest(id: number) {
    return await supabase.from('attendance_requests').delete().eq('id', id).select()
  }

  // Expose States and Actions
  return {
    attendanceRequests,
    attendanceRequestsTable,
    attendanceRequestsTableTotal,
    $reset,
    getAttendanceRequests,
    getAttendanceRequestsTable,
    addAttendanceRequest,
    updateAttendanceRequest,
    deleteAttendanceRequest,
  }
})
