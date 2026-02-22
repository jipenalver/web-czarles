/* eslint-disable @typescript-eslint/no-unused-vars */
import { type TableOptions, tablePagination } from '@/utils/helpers/tables'
import { prepareDateRange, prepareFormDates } from '@/utils/helpers/dates'
import { type PostgrestFilterBuilder } from '@supabase/postgrest-js'
import { supabase } from '@/utils/supabase'
import { type Employee } from './employees'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export type CashAdvanceRequest = {
  id: number
  created_at: string
  request_at: string | Date
  amount: number
  description: string
  status: 'Pending' | 'Approved' | 'Rejected'
  employee_id: number | null
  employee: Employee
}

export type CashAdvanceTableFilter = {
  employee_id: number | null
  request_at: Date[] | null
}

export const useCashAdvanceRequestsStore = defineStore('cashAdvanceRequests', () => {
  const selectQuery = '*, employee:employee_id (id, firstname, lastname, middlename)'

  // States
  const cashAdvanceRequestsTable = ref<CashAdvanceRequest[]>([])
  const cashAdvanceRequestsTableTotal = ref(0)

  // Reset State
  function $reset() {
    cashAdvanceRequestsTable.value = []
    cashAdvanceRequestsTableTotal.value = 0
  }

  // Actions
  async function getCashAdvanceRequestsTable(
    tableOptions: TableOptions,
    tableFilters: CashAdvanceTableFilter,
  ) {
    const { rangeStart, rangeEnd, column, order } = tablePagination(
      tableOptions,
      'request_at',
      false,
    )

    let query = supabase
      .from('cash_advance_requests')
      .select(selectQuery)
      .order(column, { ascending: order })
      .range(rangeStart, rangeEnd)

    query = getCashAdvanceRequestsFilter(query, tableFilters)

    const { data } = await query

    const { count } = await getCashAdvanceRequestsCount(tableFilters)

    cashAdvanceRequestsTable.value = data as CashAdvanceRequest[]
    cashAdvanceRequestsTableTotal.value = count as number
  }

  async function getCashAdvanceRequestsCount(tableFilters: CashAdvanceTableFilter) {
    let query = supabase.from('cash_advance_requests').select('*', { count: 'exact', head: true })

    query = getCashAdvanceRequestsFilter(query, tableFilters)

    return await query
  }

  function getCashAdvanceRequestsFilter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query: PostgrestFilterBuilder<any, any, any, any>,
    { employee_id, request_at }: CashAdvanceTableFilter,
  ) {
    if (employee_id) query = query.eq('employee_id', employee_id)

    if (request_at) {
      const { startDate, endDate } = prepareDateRange(request_at, request_at.length > 1)

      if (startDate && endDate) query = query.gte('request_at', startDate).lt('request_at', endDate)
    }

    return query
  }

  async function addCashAdvanceRequest(formData: Partial<CashAdvanceRequest>) {
    const preparedData = prepareFormDates(formData, ['request_at'])

    return await supabase.from('cash_advance_requests').insert(preparedData).select()
  }

  async function updateCashAdvanceRequest(formData: Partial<CashAdvanceRequest>) {
    const { employee, ...updateData } = prepareFormDates(formData, ['request_at'])

    return await supabase
      .from('cash_advance_requests')
      .update(updateData)
      .eq('id', formData.id)
      .select()
  }

  async function deleteCashAdvanceRequest(id: number) {
    return await supabase.from('cash_advance_requests').delete().eq('id', id).select()
  }

  // Expose States and Actions
  return {
    cashAdvanceRequestsTable,
    cashAdvanceRequestsTableTotal,
    $reset,
    getCashAdvanceRequestsTable,
    addCashAdvanceRequest,
    updateCashAdvanceRequest,
    deleteCashAdvanceRequest,
  }
})
