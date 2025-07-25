
import { type TableOptions, tablePagination } from '@/utils/helpers/tables'
import { type PostgrestFilterBuilder } from '@supabase/postgrest-js'
import { prepareFormDates, getNextMonth } from '@/utils/helpers/others'
import { supabase } from '@/utils/supabase'
import { defineStore } from 'pinia'
import { ref } from 'vue'


export type Holiday = {
  id: number 
  created_at: string
  name: string
  type: string | null
  description: string
  holiday_at: string
}
interface GetNextMonthFn {
  (dateString: string): string
}
export type HolidayTableFilter = {
  year: string | null
}

export async function fetchHolidaysByDateString(dateString: string, employeeId?: string): Promise<Holiday[]> {
  console.log('Fetching holidays for dateString:', dateString, 'and employeeId:', employeeId)
  // Query sa holidays table gamit ang %ilike% sa holiday_at column

  const { data: holidays, error: holidaysError } = await supabase
  .from('holidays')
  .select()
 .gte('holiday_at', `${dateString}-01`)
  .lt('holiday_at', getNextMonth(dateString))

  if (holidaysError || !holidays) {
    // Handle error if needed, for now return empty array
    return []
  }

  // If no employeeId, return all holidays for the dateString
  if (!employeeId) {
    return holidays as Holiday[]
  }

  // Fetch attendances for the employee within the dateString month
const { data: attendances, error: attendancesError } = await supabase
  .from('attendances')
  .select('am_time_in')
  // For any month in YYYY-MM format
  .gte('am_time_in', `${dateString}-01`)
  .lt('am_time_in', getNextMonth(dateString))
  .eq('employee_id', employeeId)

if (attendancesError || !attendances) return []

// Helper function to get the next month




  // Create a Set of attendance dates (YYYY-MM-DD only)
  const attendanceDates = new Set(
    attendances
      .map((a: { am_time_in: string | null }) => a.am_time_in?.slice(0, 10))
      .filter(Boolean)
  )

  // Filter holidays where holiday_at matches any attendance date
  const matchedHolidays = (holidays as Holiday[]).filter(h => attendanceDates.has(h.holiday_at.slice(0, 10)))

  console.log('Matched Holidays:', matchedHolidays)
  return matchedHolidays
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

  async function getHolidaysTable(tableOptions: TableOptions, { year }: HolidayTableFilter) {
    const { rangeStart, rangeEnd, column, order } = tablePagination(tableOptions, 'holiday_at')

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

  async function getHolidaysCount({ year }: HolidayTableFilter) {
    let query = supabase.from('holidays').select('*', { count: 'exact', head: true })

    query = getHolidaysFilter(query, { year })

    return await query
  }

  function getHolidaysFilter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query: PostgrestFilterBuilder<any, any, any>,
    { year }: HolidayTableFilter,
  ) {
    if (year) query = query.gte('holiday_at', `${year}-01-01`).lt('holiday_at', `${year + 1}-01-01`)

    return query
  }

  async function addHoliday(formData: Partial<Holiday>) {
    const preparedData = prepareFormDates(formData, ['holiday_at'])

    return await supabase.from('holidays').insert(preparedData).select()
  }

  async function updateHoliday(formData: Partial<Holiday>) {
    const preparedData = prepareFormDates(formData, ['holiday_at'])

    return await supabase.from('holidays').update(preparedData).eq('id', formData.id).select()
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
