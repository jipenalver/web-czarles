import { type TableOptions, tablePagination } from '@/utils/helpers/tables'
import { type PostgrestFilterBuilder } from '@supabase/postgrest-js'
import { supabase } from '@/utils/supabase'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export type Holiday = {
  id: number
  created_at: string
  name: string
  description: string
  holiday_at: string
}

export type DesignationTableFilter = {
  year: string | null
}

export const useHolidaysStore = defineStore('holidays', () => {
  // States
  const holidays = ref<Holiday[]>([])
  const holidaysTable = ref<Holiday[]>([])
  const holidaysTableTotal = ref(0)

  // Reset State
  function $reset() {
    holidays.value = []
    holidaysTable.value = []
    holidaysTableTotal.value = 0
  }

  // Actions
  async function getHolidays() {
    const { data } = await supabase.from('holidays').select()

    holidays.value = data as Holiday[]
  }

  async function getHolidaysTable(tableOptions: TableOptions, { year }: DesignationTableFilter) {
    const { rangeStart, rangeEnd, column, order } = tablePagination(
      tableOptions,
      'holiday_at',
      false,
    )

    let query = supabase
      .from('holidays')
      .select()
      .order(column, { ascending: order })
      .range(rangeStart, rangeEnd)

    query = getHolidaysFilter(query, { year })

    const { data } = await query

    const { count } = await getHolidaysCount({ year })

    holidaysTable.value = data as Holiday[]
    holidaysTableTotal.value = count as number
  }

  async function getHolidaysCount({ year }: DesignationTableFilter) {
    let query = supabase.from('holidays').select('*', { count: 'exact', head: true })

    query = getHolidaysFilter(query, { year })

    return await query
  }

  function getHolidaysFilter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query: PostgrestFilterBuilder<any, any, any>,
    { year }: DesignationTableFilter,
  ) {
    if (year) query = query.eq('holiday_at', year)

    return query
  }

  async function addHoliday(formData: Partial<Holiday>) {
    return await supabase.from('holidays').insert(formData).select()
  }

  async function updateHoliday(formData: Partial<Holiday>) {
    return await supabase.from('holidays').update(formData).eq('id', formData.id).select()
  }

  async function deleteHoliday(id: number) {
    return await supabase.from('holidays').delete().eq('id', id).select()
  }

  // Expose States and Actions
  return {
    holidays,
    holidaysTable,
    holidaysTableTotal,
    $reset,
    getHolidays,
    getHolidaysTable,
    addHoliday,
    updateHoliday,
    deleteHoliday,
  }
})
