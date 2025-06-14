import { tablePagination, tableSearch, type TableOptions } from '@/utils/helpers/tables'
import { supabase } from '@/utils/supabase'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export type Designation = {
  id: number
  created_at: string
  designation: string
  description: string
}

export const useDesignationsStore = defineStore('designations', () => {
  // States
  const designationsTable = ref<Designation[]>([])
  const designationsTableTotal = ref(0)

  // Reset State
  function $reset() {
    designationsTable.value = []
    designationsTableTotal.value = 0
  }

  // Actions
  async function getDesignationsTable(
    tableOptions: TableOptions,
    { search }: { search: string | null },
  ) {
    const { rangeStart, rangeEnd, column, order } = tablePagination(tableOptions, 'lastname')
    search = tableSearch(search)

    const query = supabase
      .from('designations')
      .select()
      .or(`designation.ilike.%${search}%, description.ilike.%${search}%`)
      .order(column, { ascending: order })
      .range(rangeStart, rangeEnd)

    const { data } = await query

    const { count } = await getDesignationsCount({ search })

    designationsTable.value = data as Designation[]
    designationsTableTotal.value = count as number
  }

  async function getDesignationsCount({ search }: { search: string | null }) {
    return await supabase
      .from('designations')
      .select('*', { count: 'exact', head: true })
      .or(`designation.ilike.%${search}%, description.ilike.%${search}%`)
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
    designationsTable,
    designationsTableTotal,
    $reset,
    getDesignationsTable,
    addDesignation,
    updateDesignation,
    deleteDesignation,
  }
})
