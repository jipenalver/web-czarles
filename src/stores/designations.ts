import { type TableOptions, tablePagination, tableSearch } from '@/utils/helpers/tables'
import { type PostgrestFilterBuilder } from '@supabase/postgrest-js'
import { supabase } from '@/utils/supabase'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export type Designation = {
  id: number
  created_at: string
  designation: string
  description: string
}

export type DesignationTableFilter = {
  search: string | null
}

export const useDesignationsStore = defineStore('designations', () => {
  // States
  const designations = ref<Designation[]>([])
  const designationsTable = ref<Designation[]>([])
  const designationsTableTotal = ref(0)

  // Reset State
  function $reset() {
    designations.value = []
    designationsTable.value = []
    designationsTableTotal.value = 0
  }

  // Actions
  async function getDesignations() {
    const { data } = await supabase.from('designations').select()

    designations.value = data as Designation[]
  }

  async function getDesignationsTable(
    tableOptions: TableOptions,
    { search }: DesignationTableFilter,
  ) {
    const { rangeStart, rangeEnd, column, order } = tablePagination(tableOptions, 'designation')
    search = tableSearch(search)

    let query = supabase
      .from('designations')
      .select()
      .order(column, { ascending: order })
      .range(rangeStart, rangeEnd)

    query = getDesignationsFilter(query, { search })

    const { data } = await query

    const { count } = await getDesignationsCount({ search })

    designationsTable.value = data as Designation[]
    designationsTableTotal.value = count as number
  }

  async function getDesignationsCount({ search }: DesignationTableFilter) {
    let query = supabase.from('designations').select('*', { count: 'exact', head: true })

    query = getDesignationsFilter(query, { search })

    return await query
  }

  function getDesignationsFilter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query: PostgrestFilterBuilder<any, any, any>,
    { search }: DesignationTableFilter,
  ) {
    if (search) query = query.or(`designation.ilike.%${search}%, description.ilike.%${search}%`)

    return query
  }

  async function addDesignation(formData: Partial<Designation>) {
    return await supabase.from('designations').insert(formData).select()
  }

  async function updateDesignation(formData: Partial<Designation>) {
    return await supabase.from('designations').update(formData).eq('id', formData.id).select()
  }

  async function deleteDesignation(id: number) {
    return await supabase.from('designations').delete().eq('id', id).select()
  }

  // Expose States and Actions
  return {
    designations,
    designationsTable,
    designationsTableTotal,
    $reset,
    getDesignations,
    getDesignationsTable,
    addDesignation,
    updateDesignation,
    deleteDesignation,
  }
})
