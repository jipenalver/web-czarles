/* eslint-disable @typescript-eslint/no-unused-vars */
import { type TableOptions, tablePagination } from '@/utils/helpers/tables'
import { prepareDateRange, prepareFormDates } from '@/utils/helpers/dates'
import { type PostgrestFilterBuilder } from '@supabase/postgrest-js'
import { supabase } from '@/utils/supabase'
import { type Employee } from './employees'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export type Addon = {
  id: number
  created_at: string
  addon_at: string | Date
  name: string
  remarks: number
  amount: number
  employee_id: number | null
  employee: Employee
}

export type AddonTableFilter = {
  employee_id: number | null
  addon_at: Date[] | null
}

export const useCashAddonsStore = defineStore('cash_addons', () => {
  const selectQuery = '*, employee:employee_id (id, firstname, lastname, middlename)'

  // States
  const addons = ref<Addon[]>([])
  const addonsTable = ref<Addon[]>([])
  const addonsTableTotal = ref(0)
  const addonsExport = ref<Addon[]>([])

  // Reset State
  function $reset() {
    addons.value = []
    addonsTable.value = []
    addonsTableTotal.value = 0
    addonsExport.value = []
  }

  // Actions
  async function getAddons() {
    const { data } = await supabase
      .from('cash_addons')
      .select(selectQuery)
      .order('addon_at', { ascending: false })

    addons.value = data as Addon[]
  }

  async function getAddonsExport(tableOptions: TableOptions, tableFilters: AddonTableFilter) {
    const { column, order } = tablePagination(tableOptions, 'addon_at', false)

    let query = supabase.from('cash_addons').select(selectQuery).order(column, { ascending: order })

    query = getAddonsFilter(query, tableFilters)

    const { data } = await query

    addonsExport.value = data as Addon[]
  }

  async function getAddonsTable(tableOptions: TableOptions, tableFilters: AddonTableFilter) {
    const { rangeStart, rangeEnd, column, order } = tablePagination(tableOptions, 'addon_at', false)

    let query = supabase
      .from('cash_addons')
      .select(selectQuery)
      .order(column, { ascending: order })
      .range(rangeStart, rangeEnd)

    query = getAddonsFilter(query, tableFilters)

    const { data } = await query

    const { count } = await getAddonsCount(tableFilters)

    addonsTable.value = data as Addon[]
    addonsTableTotal.value = count as number
  }

  async function getAddonsCount(tableFilters: AddonTableFilter) {
    let query = supabase.from('cash_addons').select('*', { count: 'exact', head: true })

    query = getAddonsFilter(query, tableFilters)

    return await query
  }

  function getAddonsFilter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query: PostgrestFilterBuilder<any, any, any, any>,
    { employee_id, addon_at }: AddonTableFilter,
  ) {
    if (employee_id) query = query.eq('employee_id', employee_id)

    if (addon_at) {
      const { startDate, endDate } = prepareDateRange(addon_at, addon_at.length > 1)

      if (startDate && endDate) query = query.gte('addon_at', startDate).lt('addon_at', endDate)
    }

    return query
  }

  async function addAddon(formData: Partial<Addon>) {
    const preparedData = prepareFormDates(formData, ['addon_at'])

    return await supabase.from('cash_addons').insert(preparedData).select()
  }

  async function updateAddon(formData: Partial<Addon>) {
    const { employee, ...updatedData } = prepareFormDates(formData, ['addon_at'])

    return await supabase.from('cash_addons').update(updatedData).eq('id', formData.id).select()
  }

  async function deleteAddon(id: number) {
    return await supabase.from('cash_addons').delete().eq('id', id).select()
  }

  // Expose States and Actions
  return {
    addons,
    addonsTable,
    addonsTableTotal,
    addonsExport,
    $reset,
    getAddons,
    getAddonsExport,
    getAddonsTable,
    addAddon,
    updateAddon,
    deleteAddon,
  }
})
