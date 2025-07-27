import { type TableOptions, tablePagination } from '@/utils/helpers/tables'
import { MILLISECONDS_PER_DAY, prepareDate } from '@/utils/helpers/dates'
import { type PostgrestFilterBuilder } from '@supabase/postgrest-js'
import { supabase } from '@/utils/supabase'
import { type Employee } from './employees'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export type CashAdvance = {
  id: number
  created_at: string
  request_at: string
  amount: number
  description: string
  employee_id: number | null
  employee: Employee
}

export type CashAdvanceTableFilter = {
  employee_id: number | null
  request_at: Date[] | null
}

export const useCashAdvancesStore = defineStore('cashAdvances', () => {
  const selectQuery = '*, employee:employee_id (id, firstname, lastname, middlename)'

  // States
  const cashAdvances = ref<CashAdvance[]>([])
  const cashAdvancesTable = ref<CashAdvance[]>([])
  const cashAdvancesTableTotal = ref(0)
  const cashAdvancesCSV = ref<CashAdvance[]>([])

  // Reset State
  function $reset() {
    cashAdvances.value = []
    cashAdvancesTable.value = []
    cashAdvancesTableTotal.value = 0
  }

  // Actions
  async function getCashAdvances() {
    const { data } = await supabase
      .from('cash_advances')
      .select(selectQuery)
      .order('request_at', { ascending: false })

    cashAdvances.value = data as CashAdvance[]
  }

  async function getCashAdvancesCSV(
    tableOptions: TableOptions,
    tableFilters: CashAdvanceTableFilter,
  ) {
    const { column, order } = tablePagination(tableOptions, 'request_at', false)

    let query = supabase
      .from('cash_advances')
      .select(selectQuery)
      .order(column, { ascending: order })

    query = getCashAdvancesFilter(query, tableFilters)

    const { data } = await query

    cashAdvancesCSV.value = data as CashAdvance[]
  }

  async function getCashAdvancesTable(
    tableOptions: TableOptions,
    tableFilters: CashAdvanceTableFilter,
  ) {
    const { rangeStart, rangeEnd, column, order } = tablePagination(
      tableOptions,
      'request_at',
      false,
    )

    let query = supabase
      .from('cash_advances')
      .select('*, employee:employee_id (id, firstname, lastname, middlename)')
      .order(column, { ascending: order })
      .range(rangeStart, rangeEnd)

    query = getCashAdvancesFilter(query, tableFilters)

    const { data } = await query

    const { count } = await getCashAdvancesCount(tableFilters)

    cashAdvancesTable.value = data as CashAdvance[]
    cashAdvancesTableTotal.value = count as number
  }

  async function getCashAdvancesCount({ employee_id, request_at }: CashAdvanceTableFilter) {
    let query = supabase.from('cash_advances').select('*', { count: 'exact', head: true })

    query = getCashAdvancesFilter(query, { employee_id, request_at })

    return await query
  }

  function getCashAdvancesFilter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query: PostgrestFilterBuilder<any, any, any>,
    { employee_id, request_at }: CashAdvanceTableFilter,
  ) {
    if (employee_id) query = query.eq('employee_id', employee_id)

    if (request_at) {
      const dateQuery = (dates: Date[], isRange = false) => {
        const startDate = dates[0]
        const endDate = isRange
          ? new Date(dates[dates.length - 1].getTime() + MILLISECONDS_PER_DAY)
          : new Date(startDate.getTime() + MILLISECONDS_PER_DAY)

        return query
          .gte('request_at', prepareDate(startDate))
          .lt('request_at', prepareDate(endDate))
      }

      query = dateQuery(request_at, request_at.length > 1)
    }

    return query
  }

  async function addCashAdvance(formData: Partial<CashAdvance>) {
    return await supabase.from('cash_advances').insert(formData).select()
  }

  async function updateCashAdvance(formData: Partial<CashAdvance>) {
    return await supabase.from('cash_advances').update(formData).eq('id', formData.id).select()
  }

  async function deleteCashAdvance(id: number) {
    return await supabase.from('cash_advances').delete().eq('id', id).select()
  }

  // Expose States and Actions
  return {
    cashAdvances,
    cashAdvancesTable,
    cashAdvancesTableTotal,
    cashAdvancesCSV,
    $reset,
    getCashAdvances,
    getCashAdvancesCSV,
    getCashAdvancesTable,
    addCashAdvance,
    updateCashAdvance,
    deleteCashAdvance,
  }
})
