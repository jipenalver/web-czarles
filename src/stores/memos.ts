import { type TableOptions, tablePagination, tableSearch } from '@/utils/helpers/tables'
import { type PostgrestFilterBuilder } from '@supabase/postgrest-js'
import { supabase } from '@/utils/supabase'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export type Memo = {
  id: number
  created_at: string
  name: string
  description: string
  file_path: string
}

export type MemoTableFilter = {
  search: string | null
}

export const useMemosStore = defineStore('memos', () => {
  const selectQuery =
    '*, employee_memos (*, employee:employee_id (id, firstname, lastname, middlename))'

  // States
  const memos = ref<Memo[]>([])
  const memosTable = ref<Memo[]>([])
  const memosTableTotal = ref(0)

  // Reset State
  function $reset() {
    memos.value = []
    memosTable.value = []
    memosTableTotal.value = 0
  }

  // Actions
  async function getMemos() {
    const { data } = await supabase.from('memos').select(selectQuery)

    memos.value = data as Memo[]
  }

  async function getMemosTable(tableOptions: TableOptions, { search }: MemoTableFilter) {
    const { rangeStart, rangeEnd, column, order } = tablePagination(tableOptions, 'name')
    search = tableSearch(search)

    let query = supabase
      .from('memos')
      .select(selectQuery)
      .order(column, { ascending: order })
      .range(rangeStart, rangeEnd)

    query = getMemosFilter(query, { search })

    const { data } = await query

    const { count } = await getMemosCount({ search })

    memosTable.value = data as Memo[]
    memosTableTotal.value = count as number
  }

  async function getMemosCount({ search }: MemoTableFilter) {
    let query = supabase.from('memos').select('*', { count: 'exact', head: true })

    query = getMemosFilter(query, { search })

    return await query
  }

  function getMemosFilter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query: PostgrestFilterBuilder<any, any, any, any>,
    { search }: MemoTableFilter,
  ) {
    if (search) query = query.or(`name.ilike.%${search}%, description.ilike.%${search}%`)

    return query
  }

  async function addMemo(formData: Partial<Memo>) {
    return await supabase.from('memos').insert(formData).select()
  }

  async function updateMemo(formData: Partial<Memo>) {
    return await supabase.from('memos').update(formData).eq('id', formData.id).select()
  }

  async function deleteMemo(id: number) {
    return await supabase.from('memos').delete().eq('id', id).select()
  }

  // Expose States and Actions
  return {
    memos,
    memosTable,
    memosTableTotal,
    $reset,
    getMemos,
    getMemosTable,
    addMemo,
    updateMemo,
    deleteMemo,
  }
})
