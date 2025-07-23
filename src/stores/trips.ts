import { type TableOptions, tablePagination, tableSearch } from '@/utils/helpers/tables'
import { type PostgrestFilterBuilder } from '@supabase/postgrest-js'
import { supabase } from '@/utils/supabase'
import { defineStore } from 'pinia'
import type { Unit } from './units'
import type { TripLocation } from './tripLocation'
import { ref } from 'vue'


export type Trip = {
  id: number
  created_at: string
  unit_id: number | undefined
  trip_location_id: number | undefined
  date: string 
  materials: string 
  km: number | undefined
  trip_no: number | undefined
  per_trip: number | undefined
  employee_id: number | undefined
  user_id: string 
  description: string 
  units?: Unit
  trips_location?: TripLocation
}

export type TripTableFilter = {
  search: string 
  unit_id: number | undefined
  trip_location_id: number | undefined
  employee_id: number | undefined
  date_from: string
  date_to: string 
}

export const useTripsStore = defineStore('trips', () => {
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
    const { data } = await supabase.from('trips').select()

    trips.value = data as Trip[]
  }

  async function getTripsTable(tableOptions: TableOptions, filters: TripTableFilter) {
    const { rangeStart, rangeEnd, column, order } = tablePagination(tableOptions, 'trip_no')
    // query sa trips with join sa units ug trips_location table, C7 style
    let tripsQuery = supabase
      .from('trips')
      .select('*, units:unit_id(name, created_at), trip_location:trip_location_id(location)') // join units and trips_location tables
      .order(column, { ascending: order })
      .range(rangeStart, rangeEnd)

    tripsQuery = getTripsFilter(tripsQuery, filters)

    // log the query object for debugging
    console.log('tripsQuery:', tripsQuery)
    const { data: tripsData } = await tripsQuery

    // direct na ang units ug trips_location field gikan sa join, no need for second fetch
    const { count } = await getTripsCount(filters)

    // ensure trips_location is available for the table
    tripsTable.value = tripsData as Trip[]
    tripsTableTotal.value = count as number
  }

  async function getTripsCount(filters: TripTableFilter) {
    let query = supabase.from('trips').select('*', { count: 'exact', head: true })

    query = getTripsFilter(query, filters)

    return await query
  }

  function getTripsFilter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query: PostgrestFilterBuilder<any, any, any>,
    filters: TripTableFilter,
  ) {
    const { search, unit_id, trip_location_id, employee_id, date_from, date_to } = filters

    if (search) {
      query = query.or(`trip_no.eq.${search}, materials.ilike.%${search}%, description.ilike.%${search}%`)
    }

    if (unit_id) {
      query = query.eq('unit_id', unit_id)
    }

    if (trip_location_id) {
      query = query.eq('trip_location_id', trip_location_id)
    }

    if (employee_id) {
      query = query.eq('employee_id', employee_id)
    }

    if (date_from && date_to && date_from !== '' && date_to !== '') {
      query = query.gte('date', date_from).lte('date', date_to)
    } else if (date_from && date_from !== '') {
      query = query.gte('date', date_from)
    } else if (date_to && date_to !== '') {
      query = query.lte('date', date_to)
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
