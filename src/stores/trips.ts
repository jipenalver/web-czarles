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

export type Trip = {
  id: number
  created_at: string
  unit_id: number | null
  unit: Unit
  trip_location_id: number | null
  trip_location: TripLocation
  trip_at: string | Date
  materials: string
  km: number
  trip_no: number
  per_trip: number
  employee_id: number | null
  employee: Employee
}

export type TripTableFilter = {
  employee_id: number | null
  trip_at: Date[] | null
}

export const useTripsStore = defineStore('trips', () => {
  const selectQuery =
    '*, employee:employee_id (id, firstname, lastname, middlename), unit:unit_id (*), trip_location:trip_location_id (*)'

  // States
  const trips = ref<Trip[]>([])
  const tripsTable = ref<Trip[]>([])
  const tripsTableTotal = ref(0)
  const tripsCSV = ref<Trip[]>([])

  // Reset State
  function $reset() {
    trips.value = []
    tripsTable.value = []
    tripsTableTotal.value = 0
    tripsCSV.value = []
  }

  // Actions
  async function getTrips() {
    const { data } = await supabase
      .from('trips')
      .select(selectQuery)
      .order('trip_at', { ascending: false })

    trips.value = data as Trip[]
  }

  async function getTripsCSV(tableOptions: TableOptions, tableFilters: TripTableFilter) {
    const { column, order } = tablePagination(tableOptions, 'trip_at', false)

    let query = supabase.from('trips').select(selectQuery).order(column, { ascending: order })

    query = getTripsFilter(query, tableFilters)

    const { data } = await query

    tripsCSV.value = data as Trip[]
  }

  async function getTripsTable(tableOptions: TableOptions, tableFilters: TripTableFilter) {
    const { rangeStart, rangeEnd, column, order } = tablePagination(tableOptions, 'trip_at', false)

    let query = supabase
      .from('trips')
      .select(selectQuery)
      .order(column, { ascending: order })
      .range(rangeStart, rangeEnd)

    query = getTripsFilter(query, tableFilters)

    const { data } = await query

    const { count } = await getTripsCount(tableFilters)

    tripsTable.value = data as Trip[]
    tripsTableTotal.value = count as number
  }

  async function getTripsCount(tableFilters: TripTableFilter) {
    let query = supabase.from('trips').select('*', { count: 'exact', head: true })

    query = getTripsFilter(query, tableFilters)

    return await query
  }

  function getTripsFilter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query: PostgrestFilterBuilder<any, any, any>,
    { employee_id, trip_at }: TripTableFilter,
  ) {
    if (employee_id) query = query.eq('employee_id', employee_id)

    if (trip_at) {
      const { startDate, endDate } = prepareDateRange(trip_at, trip_at.length > 1)

      if (startDate && endDate) query = query.gte('trip_at', startDate).lt('trip_at', endDate)
    }

    return query
  }

  async function addTrip(formData: Partial<Trip>) {
    const preparedData = prepareFormDates(formData, ['trip_at'])

    return await supabase.from('trips').insert(preparedData).select()
  }

  async function updateTrip(formData: Partial<Trip>) {
    const { employee, unit, trip_location, ...updatedData } = prepareFormDates(formData, [
      'trip_at',
    ])

    return await supabase.from('trips').update(updatedData).eq('id', formData.id).select()
  }

  async function deleteTrip(id: number) {
    return await supabase.from('trips').delete().eq('id', id).select()
  }

  // Expose States and Actions
  return {
    trips,
    tripsTable,
    tripsTableTotal,
    tripsCSV,
    $reset,
    getTrips,
    getTripsCSV,
    getTripsTable,
    addTrip,
    updateTrip,
    deleteTrip,
  }
})
