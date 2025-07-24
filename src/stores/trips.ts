import { type TableOptions, tablePagination} from '@/utils/helpers/tables'
import { prepareDate } from '@/utils/helpers/others'
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
  trip_location?: TripLocation
}

export type TripTableFilter = {
  search: string
  unit_id: number | undefined
  trip_location_id: number | undefined
  employee_id: number | undefined
  trip_at: string[]
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
    const { data } = await supabase.from('trips').select('*')

    trips.value = data as Trip[]
  }

  async function getTripsTable(tableOptions: TableOptions, filters: TripTableFilter) {
    const { rangeStart, rangeEnd, column, order } = tablePagination(tableOptions, 'trip_no')
    // query sa trips with join sa units ug trips_location table, C7 style
    let tripsQuery = supabase
      .from('trips')
      .select('*, units:unit_id(name, created_at), trip_location:trip_location_id(location)') // join units and trip_location tables
      .order(column, { ascending: order })
      .range(rangeStart, rangeEnd)

    tripsQuery = getTripsFilter(tripsQuery, filters)

    // log the query object for debugging
    console.log('tripsQuery:', tripsQuery)
    const { data: tripsData } = await tripsQuery

    // direct na ang units ug trip_location field gikan sa join, no need for second fetch
    const { count } = await getTripsCount(filters)

    // ensure trip_location is available for the table
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
  const { search, unit_id, trip_location_id, employee_id, trip_at } = filters

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

  if (trip_at && Array.isArray(trip_at) && trip_at.length > 0) {
    const isValidDate = (d: string) => {
      const date = new Date(d)
      return !isNaN(date.getTime())
    }
    if (trip_at.length === 1 && isValidDate(trip_at[0])) {
      query = query.eq('date', prepareDate(trip_at[0]))
    } else if (trip_at.length > 1 && isValidDate(trip_at[0]) && isValidDate(trip_at[trip_at.length - 1])) {
      query = query
        .gte('date', prepareDate(trip_at[0])) // greater than or equal to `from` date
        .lte('date', prepareDate(trip_at[trip_at.length - 1])) // less than or equal to `to` date
    }
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
