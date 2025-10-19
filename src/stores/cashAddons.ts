/* eslint-disable @typescript-eslint/no-unused-vars */
import { type TableOptions, tablePagination } from '@/utils/helpers/tables'
import { prepareDateRange, prepareFormDates } from '@/utils/helpers/dates'
import { type PostgrestFilterBuilder } from '@supabase/postgrest-js'
import { supabase } from '@/utils/supabase'
import { type Employee } from './employees'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export type CashAddon = {
  id: number
  created_at: string
  addon_at: string | Date
  name: string
  remarks: string
  amount: number
  employee_id: number | null
  employee: Employee
}

export type CashAddonTableFilter = {
  employee_id: number | null
  addon_at: Date[] | null
}

export const useCashAddonsStore = defineStore('cashAddons', () => {
  const selectQuery = '*, employee:employee_id (id, firstname, lastname, middlename)'

  // States
  const cashAddons = ref<CashAddon[]>([])
  const cashAddonsTable = ref<CashAddon[]>([])
  const cashAddonsTableTotal = ref(0)
  const cashAddonsExport = ref<CashAddon[]>([])

  // Reset State
  function $reset() {
    cashAddons.value = []
    cashAddonsTable.value = []
    cashAddonsTableTotal.value = 0
    cashAddonsExport.value = []
  }

  // Actions
  async function getCashAddons() {
    const { data } = await supabase
      .from('cash_addons')
      .select(selectQuery)
      .order('addon_at', { ascending: false })

    cashAddons.value = data as CashAddon[]
  }

  async function getCashAddonsExport(
    tableOptions: TableOptions,
    tableFilters: CashAddonTableFilter,
  ) {
    const { column, order } = tablePagination(tableOptions, 'addon_at', false)

    let query = supabase.from('cash_addons').select(selectQuery).order(column, { ascending: order })

    query = getCashAddonsFilter(query, tableFilters)

    const { data } = await query

    cashAddonsExport.value = data as CashAddon[]
  }

  async function getCashAddonsTable(
    tableOptions: TableOptions,
    tableFilters: CashAddonTableFilter,
  ) {
    const { rangeStart, rangeEnd, column, order } = tablePagination(tableOptions, 'addon_at', false)

    let query = supabase
      .from('cash_addons')
      .select(selectQuery)
      .order(column, { ascending: order })
      .range(rangeStart, rangeEnd)

    query = getCashAddonsFilter(query, tableFilters)

    const { data } = await query

    const { count } = await getCashAddonsCount(tableFilters)

    cashAddonsTable.value = data as CashAddon[]
    cashAddonsTableTotal.value = count as number
  }

  async function getCashAddonsCount(tableFilters: CashAddonTableFilter) {
    let query = supabase.from('cash_addons').select('*', { count: 'exact', head: true })

    query = getCashAddonsFilter(query, tableFilters)

    return await query
  }

  function getCashAddonsFilter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query: PostgrestFilterBuilder<any, any, any, any>,
    { employee_id, addon_at }: CashAddonTableFilter,
  ) {
    if (employee_id) query = query.eq('employee_id', employee_id)

    if (addon_at) {
      const { startDate, endDate } = prepareDateRange(addon_at, addon_at.length > 1)

      if (startDate && endDate) query = query.gte('addon_at', startDate).lt('addon_at', endDate)
    }

    return query
  }

  async function addCashAddon(formData: Partial<CashAddon>) {
    const preparedData = prepareFormDates(formData, ['addon_at'])

    return await supabase.from('cash_addons').insert(preparedData).select()
  }

  async function updateCashAddon(formData: Partial<CashAddon>) {
    const { employee, ...updatedData } = prepareFormDates(formData, ['addon_at'])

    return await supabase.from('cash_addons').update(updatedData).eq('id', formData.id).select()
  }

  async function deleteCashAddon(id: number) {
    return await supabase.from('cash_addons').delete().eq('id', id).select()
  }

  // Expose States and Actions
  return {
    cashAddons,
    cashAddonsTable,
    cashAddonsTableTotal,
    cashAddonsExport,
    $reset,
    getCashAddons,
    getCashAddonsExport,
    getCashAddonsTable,
    addCashAddon,
    updateCashAddon,
    deleteCashAddon,
  }
})
