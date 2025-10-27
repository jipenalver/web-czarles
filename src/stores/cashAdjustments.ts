/* eslint-disable @typescript-eslint/no-unused-vars */
import { type TableOptions, tablePagination } from '@/utils/helpers/tables'
import { prepareDateRange, prepareFormDates } from '@/utils/helpers/dates'
import { type PostgrestFilterBuilder } from '@supabase/postgrest-js'
import { supabase } from '@/utils/supabase'
import { type Employee } from './employees'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export type CashAdjustment = {
  id: number
  created_at: string
  adjustment_at: string | Date
  name: string
  remarks: string
  amount: number
  is_deduction: boolean
  employee_id: number | null
  employee: Employee
}

export type CashAdjustmentTableFilter = {
  employee_id: number | null
  adjustment_at: Date[] | null
}

export const useCashAdjustmentsStore = defineStore('cashAdjustment', () => {
  const selectQuery = '*, employee:employee_id (id, firstname, lastname, middlename)'

  // States
  const cashAdjustment = ref<CashAdjustment[]>([])
  const cashAdjustmentTable = ref<CashAdjustment[]>([])
  const cashAdjustmentTableTotal = ref(0)
  const cashAdjustmentExport = ref<CashAdjustment[]>([])

  // Reset State
  function $reset() {
    cashAdjustment.value = []
    cashAdjustmentTable.value = []
    cashAdjustmentTableTotal.value = 0
    cashAdjustmentExport.value = []
  }

  // Actions
  async function getCashAdjustments() {
    const { data } = await supabase
      .from('cash_adjustments')
      .select(selectQuery)
      .order('adjustment_at', { ascending: false })

    cashAdjustment.value = data as CashAdjustment[]
  }

  async function getCashAdjustmentsExport(
    tableOptions: TableOptions,
    tableFilters: CashAdjustmentTableFilter,
  ) {
    const { column, order } = tablePagination(tableOptions, 'adjustment_at', false)

    let query = supabase
      .from('cash_adjustments')
      .select(selectQuery)
      .order(column, { ascending: order })

    query = getCashAdjustmentsFilter(query, tableFilters)

    const { data } = await query

    cashAdjustmentExport.value = data as CashAdjustment[]
  }

  async function getCashAdjustmentsTable(
    tableOptions: TableOptions,
    tableFilters: CashAdjustmentTableFilter,
  ) {
    const { rangeStart, rangeEnd, column, order } = tablePagination(
      tableOptions,
      'adjustment_at',
      false,
    )

    let query = supabase
      .from('cash_adjustments')
      .select(selectQuery)
      .order(column, { ascending: order })
      .range(rangeStart, rangeEnd)

    query = getCashAdjustmentsFilter(query, tableFilters)

    const { data } = await query

    const { count } = await getCashAdjustmentsCount(tableFilters)

    cashAdjustmentTable.value = data as CashAdjustment[]
    cashAdjustmentTableTotal.value = count as number
  }

  async function getCashAdjustmentsCount(tableFilters: CashAdjustmentTableFilter) {
    let query = supabase.from('cash_adjustments').select('*', { count: 'exact', head: true })

    query = getCashAdjustmentsFilter(query, tableFilters)

    return await query
  }

  function getCashAdjustmentsFilter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query: PostgrestFilterBuilder<any, any, any, any>,
    { employee_id, adjustment_at }: CashAdjustmentTableFilter,
  ) {
    if (employee_id) query = query.eq('employee_id', employee_id)

    if (adjustment_at) {
      const { startDate, endDate } = prepareDateRange(adjustment_at, adjustment_at.length > 1)

      if (startDate && endDate)
        query = query.gte('adjustment_at', startDate).lt('adjustment_at', endDate)
    }

    return query
  }

  async function addCashAdjustment(formData: Partial<CashAdjustment>) {
    const preparedData = prepareFormDates(formData, ['adjustment_at'])

    return await supabase.from('cash_adjustments').insert(preparedData).select()
  }

  async function updateCashAdjustment(formData: Partial<CashAdjustment>) {
    const { employee, ...updatedData } = prepareFormDates(formData, ['adjustment_at'])

    return await supabase
      .from('cash_adjustments')
      .update(updatedData)
      .eq('id', formData.id)
      .select()
  }

  async function deleteCashAdjustment(id: number) {
    return await supabase.from('cash_adjustments').delete().eq('id', id).select()
  }

  // Expose States and Actions
  return {
    cashAdjustment,
    cashAdjustmentTable,
    cashAdjustmentTableTotal,
    cashAdjustmentExport,
    $reset,
    getCashAdjustments,
    getCashAdjustmentsExport,
    getCashAdjustmentsTable,
    addCashAdjustment,
    updateCashAdjustment,
    deleteCashAdjustment,
  }
})
