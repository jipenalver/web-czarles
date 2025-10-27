import { type TableOptions, tablePagination, tableSearch } from '@/utils/helpers/tables'
import { type PostgrestFilterBuilder } from '@supabase/postgrest-js'
import { type Employee } from './employees'
import { supabase } from '@/utils/supabase'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export type Memo = {
  id: number
  created_at: string
  name: string
  description: string
  file_path: string
  employee_memos: EmployeeMemo[]
}

export type MemoForm = Omit<Memo, 'employee_memos'> & {
  file: File | null
  employee_ids: number[]
}

type EmployeeMemo = {
  id: number
  created_at: string
  memo_id: number
  employee_id: number
  employee: Employee
}

export type MemoTableFilter = {
  search: string | null
}

export const useMemosStore = defineStore('memos', () => {
  const selectQuery =
    '*, employee_memos (*, employee:employee_id (id, firstname, lastname, middlename, email))'

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

  async function addMemo(formData: Partial<MemoForm>) {
    const { employee_ids, file, ...memoData } = formData

    const { data, error } = await supabase.from('memos').insert(memoData).select()

    if (data) {
      await addEmployeeMemos(data[0].id, employee_ids as number[])

      const { data: fileData } = await updateMemoFile(data[0].id, file as File)

      await updateMemo({ id: data[0].id, file_path: fileData?.publicUrl })
    }

    return { data, error }
  }

  async function updateMemo(formData: Partial<MemoForm>) {
    const { employee_ids, file, ...memoData } = formData

    const { data, error } = await supabase
      .from('memos')
      .update(memoData)
      .eq('id', memoData.id)
      .select()

    await updateEmployeeMemos(memoData.id as number, employee_ids as number[])

    if (file) {
      const { data: fileData } = await updateMemoFile(memoData.id as number, file as File)

      await updateMemo({ id: memoData.id, file_path: fileData?.publicUrl })
    }

    return { data, error }
  }

  async function deleteMemo(id: number) {
    const { data, error: deleteError } = await deleteEmployeeMemos(id)

    if (deleteError) return { data, error: deleteError }

    const { data: memoData, error: memoError } = await supabase
      .from('memos')
      .delete()
      .eq('id', id)
      .select()

    const { data: fileData, error: fileError } = await supabase.storage
      .from('avatars')
      .remove(['memos/' + memoData?.[0].file_path])

    if (fileError) return { data: fileData, error: fileError }

    return { data: memoData, error: memoError }
  }

  async function addEmployeeMemos(id: number, employeeIds: number[]) {
    const employeeData = employeeIds.map((employeeId) => ({ employee_id: employeeId, memo_id: id }))

    return await supabase.from('employee_memos').insert(employeeData).select()
  }

  async function updateEmployeeMemos(id: number, employeeIds: number[]) {
    const { data, error: deleteError } = await deleteEmployeeMemos(id)

    if (deleteError) return { data, error: deleteError }

    return await addEmployeeMemos(id, employeeIds)
  }

  async function deleteEmployeeMemos(id: number) {
    return await supabase.from('employee_memos').delete().eq('memo_id', id).select()
  }

  async function updateMemoFile(id: number, file: File) {
    const { data, error } = await supabase.storage
      .from('czarles')
      .upload('memos/' + id + '-memo.' + file.name.split('.').pop(), file, {
        cacheControl: '3600',
        upsert: true,
      })

    if (error) return { data, error }

    const { data: imageData } = supabase.storage.from('czarles').getPublicUrl(data.path)

    return { data: imageData, error: null }
  }

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
