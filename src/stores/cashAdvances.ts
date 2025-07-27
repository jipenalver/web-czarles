import { type TableOptions, tablePagination, tableSearch } from '@/utils/helpers/tables'
import { MILLISECONDS_PER_DAY, prepareDate } from '@/utils/helpers/dates'
import { type PostgrestFilterBuilder } from '@supabase/postgrest-js'
import { supabase } from '@/utils/supabase'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export type CashAdvance = {
  id: number
  created_at: string
  date_at: string
  employee_id: number
  amount: number
  description: string
}

export type CashAdvanceTableFilter = {
  search: string | null
  date_at: Date[] | null
}

export const useCashAdvancesStore = defineStore('cashAdvances', () => {
  // States
  const cashAdvances = ref<CashAdvance[]>([])
  const cashAdvancesTable = ref<CashAdvance[]>([])
  const cashAdvancesTableTotal = ref(0)

  // Reset State
  function $reset() {
    cashAdvances.value = []
    cashAdvancesTable.value = []
    cashAdvancesTableTotal.value = 0
  }

  // Actions
  async function getCashAdvances() {
    const { data } = await supabase.from('cash_advances').select()

    cashAdvances.value = data as CashAdvance[]
  }

  async function getCashAdvancesTable(
    tableOptions: TableOptions,
    { search, date_at }: CashAdvanceTableFilter,
  ) {
    const { rangeStart, rangeEnd, column, order } = tablePagination(tableOptions)
    search = tableSearch(search)

    let query = supabase
      .from('cash_advances')
      .select('*, employee:employee_id (id, firstname, lastname, middlename)')
      .order(column, { ascending: order })
      .range(rangeStart, rangeEnd)

    query = getCashAdvancesFilter(query, { search, date_at })

    const { data } = await query

    const { count } = await getCashAdvancesCount({ search, date_at })

    cashAdvancesTable.value = data as CashAdvance[]
    cashAdvancesTableTotal.value = count as number
  }

  async function getCashAdvancesCount({ search, date_at }: CashAdvanceTableFilter) {
    let query = supabase.from('cash_advances').select('*', { count: 'exact', head: true })

    query = getCashAdvancesFilter(query, { search, date_at })

    return await query
  }

  function getCashAdvancesFilter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query: PostgrestFilterBuilder<any, any, any>,
    { search, date_at }: CashAdvanceTableFilter,
  ) {
    if (search) query = query.or(`designation.ilike.%${search}%, description.ilike.%${search}%`)

    if (date_at) {
      const dateQuery = (dates: Date[], isRange = false) => {
        const startDate = dates[0]
        const endDate = isRange
          ? new Date(dates[dates.length - 1].getTime() + MILLISECONDS_PER_DAY)
          : new Date(startDate.getTime() + MILLISECONDS_PER_DAY)

        return query.gte('date_at', prepareDate(startDate)).lt('date_at', prepareDate(endDate))
      }

      query = dateQuery(date_at, date_at.length > 1)
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
    $reset,
    getCashAdvances,
    getCashAdvancesTable,
    addCashAdvance,
    updateCashAdvance,
    deleteCashAdvance,
  }
})
