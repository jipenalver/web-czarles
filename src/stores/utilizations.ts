/* eslint-disable @typescript-eslint/no-unused-vars */
import { type TableOptions, tablePagination } from '@/utils/helpers/tables'
import { prepareDateRange, prepareFormDates } from '@/utils/helpers/dates'
import { type PostgrestFilterBuilder } from '@supabase/postgrest-js'
import { type TripLocation } from './tripLocations'
import { supabase } from '@/utils/supabase'
import { type Employee } from './employees'
import { defineStore } from 'pinia'
import { type Unit } from './units'
import { ref } from 'vue'

export type Utilization = {
  id: number
  created_at: string
  unit_id: number | null
  unit: Unit
  trip_location_id: number | null
  trip_location: TripLocation
  utilization_at: string | Date
  am_time_in: string | null
  am_time_out: string | null
  pm_time_in: string | null
  pm_time_out: string | null
  overtime_in: string | null
  overtime_out: string | null
  hours: number
  per_hour: number
  employee_id: number | null
  employee: Employee
}

export type UtilizationTableFilter = {
  employee_id: number | null
  utilization_at: Date[] | null
}

export const useUtilizationsStore = defineStore('utilizations', () => {
  const selectQuery =
    '*, employee:employee_id (id, firstname, lastname, middlename), unit:unit_id (*), trip_location:trip_location_id (*)'

  // States
  const utilizations = ref<Utilization[]>([])
  const utilizationsTable = ref<Utilization[]>([])
  const utilizationsTableTotal = ref(0)
  const utilizationsExport = ref<Utilization[]>([])

  // Reset State
  function $reset() {
    utilizations.value = []
    utilizationsTable.value = []
    utilizationsTableTotal.value = 0
    utilizationsExport.value = []
  }

  // Actions
  async function getUtilizations() {
    const { data } = await supabase
      .from('utilizations')
      .select(selectQuery)
      .order('utilization_at', { ascending: false })

    utilizations.value = data as Utilization[]
  }

  async function getUtilizationsExport(
    tableOptions: TableOptions,
    tableFilters: UtilizationTableFilter,
  ) {
    const { column, order } = tablePagination(tableOptions, 'utilization_at', false)

    let query = supabase
      .from('utilizations')
      .select(selectQuery)
      .order(column, { ascending: order })

    query = getUtilizationsFilter(query, tableFilters)

    const { data } = await query

    utilizationsExport.value = data as Utilization[]
  }

  async function getUtilizationsTable(
    tableOptions: TableOptions,
    tableFilters: UtilizationTableFilter,
  ) {
    const { rangeStart, rangeEnd, column, order } = tablePagination(
      tableOptions,
      'utilization_at',
      false,
    )

    let query = supabase
      .from('utilizations')
      .select(selectQuery)
      .order(column, { ascending: order })
      .range(rangeStart, rangeEnd)

    query = getUtilizationsFilter(query, tableFilters)

    const { data } = await query

    const { count } = await getUtilizationsCount(tableFilters)

    utilizationsTable.value = data as Utilization[]
    utilizationsTableTotal.value = count as number
  }

  async function getUtilizationsCount(tableFilters: UtilizationTableFilter) {
    let query = supabase.from('utilizations').select('*', { count: 'exact', head: true })

    query = getUtilizationsFilter(query, tableFilters)

    return await query
  }

  function getUtilizationsFilter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query: PostgrestFilterBuilder<any, any, any>,
    { employee_id, utilization_at }: UtilizationTableFilter,
  ) {
    if (employee_id) query = query.eq('employee_id', employee_id)

    if (utilization_at) {
      const { startDate, endDate } = prepareDateRange(utilization_at, utilization_at.length > 1)

      if (startDate && endDate)
        query = query.gte('utilization_at', startDate).lt('utilization_at', endDate)
    }

    return query
  }

  async function addUtilization(formData: Partial<Utilization>) {
    const preparedData = prepareFormDates(formData, ['utilization_at'])

    return await supabase.from('trips').insert(preparedData).select()
  }

  async function updateUtilization(formData: Partial<Utilization>) {
    const { employee, unit, trip_location, ...updatedData } = prepareFormDates(formData, [
      'utilization_at',
    ])

    return await supabase.from('utilizations').update(updatedData).eq('id', formData.id).select()
  }

  async function deleteUtilization(id: number) {
    return await supabase.from('utilizations').delete().eq('id', id).select()
  }

  // Expose States and Actions
  return {
    utilizations,
    utilizationsTable,
    utilizationsTableTotal,
    utilizationsExport,
    $reset,
    getUtilizations,
    getUtilizationsExport,
    getUtilizationsTable,
    addUtilization,
    updateUtilization,
    deleteUtilization,
  }
})
