import { type TableOptions, tablePagination, tableSearch } from '@/utils/helpers/tables'
import { type PostgrestFilterBuilder } from '@supabase/postgrest-js'
import { supabase } from '@/utils/supabase'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export type Area = {
  id: number
  created_at: string
  area: string
  description: string
}

export type AreaTableFilter = {
  search: string | null
}

export const useAreasStore = defineStore('areas', () => {
  // States
  const areas = ref<Area[]>([])
  const areasTable = ref<Area[]>([])
  const areasTableTotal = ref(0)

  // Reset State
  function $reset() {
    areas.value = []
    areasTable.value = []
    areasTableTotal.value = 0
  }

  // Actions
  async function getAreas() {
    const { data } = await supabase.from('areas').select()

    areas.value = data as Area[]
  }

  async function getAreasTable(tableOptions: TableOptions, { search }: AreaTableFilter) {
    const { rangeStart, rangeEnd, column, order } = tablePagination(tableOptions, 'area')
    search = tableSearch(search)

    let query = supabase
      .from('areas')
      .select()
      .order(column, { ascending: order })
      .range(rangeStart, rangeEnd)

    query = getDesignationsFilter(query, { search })

    const { data } = await query

    const { count } = await getDesignationsCount({ search })

    areasTable.value = data as Area[]
    areasTableTotal.value = count as number
  }

  async function getDesignationsCount({ search }: AreaTableFilter) {
    let query = supabase.from('designations').select('*', { count: 'exact', head: true })

    query = getDesignationsFilter(query, { search })

    return await query
  }

  function getDesignationsFilter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query: PostgrestFilterBuilder<any, any, any>,
    { search }: AreaTableFilter,
  ) {
    if (search) query = query.or(`area.ilike.%${search}%, description.ilike.%${search}%`)

    return query
  }

  async function addArea(formData: Partial<Area>) {
    return await supabase.from('areas').insert(formData).select()
  }

  async function updateArea(formData: Partial<Area>) {
    return await supabase.from('areas').update(formData).eq('id', formData.id).select()
  }

  async function deleteArea(id: number) {
    return await supabase.from('areas').delete().eq('id', id).select()
  }

  // Expose States and Actions
  return {
    areas,
    areasTable,
    areasTableTotal,
    $reset,
    getAreas,
    getAreasTable,
    addArea,
    updateArea,
    deleteArea,
  }
})
