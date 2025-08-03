import { type TableOptions, tablePagination } from '@/utils/helpers/tables'
import { type PostgrestFilterBuilder } from '@supabase/postgrest-js'
import { prepareDateRange } from '@/utils/helpers/dates'
import { supabase } from '@/utils/supabase'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export type Trip = {
  id: number
  created_at: string
  location: string
  description: string
}

export type TripTableFilter = {
  employee_id: number | null
  date_at: Date[] | null
}

export const useTripsStore = defineStore('trips', () => {
  const selectQuery =
    '*, employee:employee_id (id, firstname, lastname, middlename), unit:unit_id (*), trip_location:trip_location_id (*)'

  // States
  const trips = ref<Trip[]>([])
  const tripsTable = ref<Trip[]>([])
  const tripsTableTotal = ref(0)

  // Reset State
  function $reset() {
    trips.value = []
    tripsTable.value = []
    tripsTableTotal.value = 0
  }

  // Actions
  async function getTrips() {
    const { data } = await supabase
      .from('trips')
      .select(selectQuery)
      .order('request_at', { ascending: false })

    trips.value = data as Trip[]
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
    { employee_id, date_at }: TripTableFilter,
  ) {
    if (employee_id) query = query.eq('employee_id', employee_id)

    if (date_at) {
      const { startDate, endDate } = prepareDateRange(date_at, date_at.length > 1)

      if (startDate && endDate) query = query.gte('date_at', startDate).lt('date_at', endDate)
    }

    return query
  }

  async function addTrip(formData: Partial<Trip>) {
    return await supabase.from('trips').insert(formData).select()
  }

  async function updateTrip(formData: Partial<Trip>) {
    return await supabase.from('trips').update(formData).eq('id', formData.id).select()
  }

  async function deleteTrip(id: number) {
    return await supabase.from('trips').delete().eq('id', id).select()
  }

  // Expose States and Actions
  return {
    trips,
    tripsTable,
    tripsTableTotal,
    $reset,
    getTrips,
    getTripsTable,
    addTrip,
    updateTrip,
    deleteTrip,
  }
})
