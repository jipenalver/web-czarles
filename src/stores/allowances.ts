/* eslint-disable @typescript-eslint/no-unused-vars */
import { type TableOptions, tablePagination } from '@/utils/helpers/tables'
import { prepareDateRange, prepareFormDates } from '@/utils/helpers/dates'
import { type PostgrestFilterBuilder } from '@supabase/postgrest-js'
import { type TripLocation } from './tripLocations'
import { supabase } from '@/utils/supabase'
import { type Employee } from './employees'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export type Allowance = {
  id: number
  created_at: string
  trip_location_id: number | null
  trip_location: TripLocation
  trip_at: string | Date
  activities: string
  amount: number
  employee_id: number | null
  employee: Employee
}

export type AllowanceForm = Omit<Allowance, 'trip_at'> & {
  trip_range_at: Date[]
}

export type AllowanceTableFilter = {
  employee_id: number | null
  trip_at: Date[] | null
}

export const useAllowancesStore = defineStore('allowances', () => {
  const selectQuery =
    '*, employee:employee_id (id, firstname, lastname, middlename), trip_location:trip_location_id (*)'

  // States
  const allowances = ref<Allowance[]>([])
  const allowancesTable = ref<Allowance[]>([])
  const allowancesTableTotal = ref(0)
  const allowancesExport = ref<Allowance[]>([])

  // Reset State
  function $reset() {
    allowances.value = []
    allowancesTable.value = []
    allowancesTableTotal.value = 0
    allowancesExport.value = []
  }

  // Actions
  async function getAllowances() {
    const { data } = await supabase
      .from('allowances')
      .select(selectQuery)
      .order('trip_at', { ascending: false })

    allowances.value = data as Allowance[]
  }

  async function getAllowancesExport(
    tableOptions: TableOptions,
    tableFilters: AllowanceTableFilter,
  ) {
    const { column, order } = tablePagination(tableOptions, 'trip_at', false)

    let query = supabase.from('allowances').select(selectQuery).order(column, { ascending: order })

    query = getTripsFilter(query, tableFilters)

    const { data } = await query

    allowancesExport.value = data as Allowance[]
  }

  async function getAllowancesTable(
    tableOptions: TableOptions,
    tableFilters: AllowanceTableFilter,
  ) {
    const { rangeStart, rangeEnd, column, order } = tablePagination(tableOptions, 'trip_at', false)

    let query = supabase
      .from('allowances')
      .select(selectQuery)
      .order(column, { ascending: order })
      .range(rangeStart, rangeEnd)

    query = getTripsFilter(query, tableFilters)

    const { data } = await query

    const { count } = await getAllowancesCount(tableFilters)

    allowancesTable.value = data as Allowance[]
    allowancesTableTotal.value = count as number
  }

  async function getAllowancesCount(tableFilters: AllowanceTableFilter) {
    let query = supabase.from('allowances').select('*', { count: 'exact', head: true })

    query = getTripsFilter(query, tableFilters)

    return await query
  }

  function getTripsFilter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query: PostgrestFilterBuilder<any, any, any, any>,
    { employee_id, trip_at }: AllowanceTableFilter,
  ) {
    if (employee_id) query = query.eq('employee_id', employee_id)

    if (trip_at) {
      const { startDate, endDate } = prepareDateRange(trip_at, trip_at.length > 1)

      if (startDate && endDate) query = query.gte('trip_at', startDate).lt('trip_at', endDate)
    }

    return query
  }

  async function addAllowance(formData: Partial<AllowanceForm>) {
    const dates =
      formData.trip_range_at && formData.trip_range_at[0] !== formData.trip_range_at[1]
        ? formData.trip_range_at
        : [formData.trip_range_at?.[0]]

    const allowancesData = dates.map((date) => {
      const { trip_range_at, ...cleanFormData } = formData

      return prepareFormDates({ ...cleanFormData, trip_at: date }, ['trip_at'])
    })

    return await supabase.from('allowances').insert(allowancesData).select()
  }

  async function updateAllowance(formData: Partial<AllowanceForm>) {
    const preparedData = { ...formData, trip_at: formData.trip_range_at?.[0] }

    const { employee, trip_location, trip_range_at, ...updatedData } = prepareFormDates(
      preparedData,
      ['trip_at'],
    )

    return await supabase.from('allowances').update(updatedData).eq('id', formData.id).select()
  }

  async function deleteAllowance(id: number) {
    return await supabase.from('allowances').delete().eq('id', id).select()
  }

  // Expose States and Actions
  return {
    allowances,
    allowancesTable,
    allowancesTableTotal,
    allowancesExport,
    $reset,
    getAllowances,
    getAllowancesExport,
    getAllowancesTable,
    addAllowance,
    updateAllowance,
    deleteAllowance,
  }
})
