import { type TableOptions, tablePagination, tableSearch } from '@/utils/helpers/tables'
import { type PostgrestFilterBuilder } from '@supabase/postgrest-js'
import { supabase } from '@/utils/supabase'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export type Unit = {
  id: number
  created_at: string
  name: string
  description: string
}

export type UnitTableFilter = {
  search: string | null
}

export const useUnitsStore = defineStore('units', () => {
  // States
  const units = ref<Unit[]>([])
  const unitsTable = ref<Unit[]>([])
  const unitsTableTotal = ref(0)

  // Reset State
  function $reset() {
    units.value = []
    unitsTable.value = []
    unitsTableTotal.value = 0
  }

  // Actions
  async function getUnits() {
    const { data } = await supabase.from('units').select()

    units.value = data as Unit[]
  }

  async function getUnitsTable(tableOptions: TableOptions, { search }: UnitTableFilter) {
    const { rangeStart, rangeEnd, column, order } = tablePagination(tableOptions, 'name')
    search = tableSearch(search)

    let query = supabase
      .from('units')
      .select()
      .order(column, { ascending: order })
      .range(rangeStart, rangeEnd)

    query = getUnitsFilter(query, { search })

    const { data } = await query

    const { count } = await getUnitsCount({ search })

    unitsTable.value = data as Unit[]
    unitsTableTotal.value = count as number
  }

  async function getUnitsCount({ search }: UnitTableFilter) {
    let query = supabase.from('units').select('*', { count: 'exact', head: true })

    query = getUnitsFilter(query, { search })

    return await query
  }

  function getUnitsFilter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query: PostgrestFilterBuilder<any, any, any>,
    { search }: UnitTableFilter,
  ) {
    if (search) query = query.or(`name.ilike.%${search}%, description.ilike.%${search}%`)

    return query
  }

  async function addUnit(formData: Partial<Unit>) {
    return await supabase.from('units').insert(formData).select()
  }

  async function updateUnit(formData: Partial<Unit>) {
    return await supabase.from('units').update(formData).eq('id', formData.id).select()
  }

  async function deleteUnit(id: number) {
    return await supabase.from('units').delete().eq('id', id).select()
  }

  // Expose States and Actions
  return {
    units,
    unitsTable,
    unitsTableTotal,
    $reset,
    getUnits,
    getUnitsTable,
    addUnit,
    updateUnit,
    deleteUnit,
  }
})
