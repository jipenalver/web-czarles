import { type TableOptions, tablePagination, tableSearch } from '@/utils/helpers/tables'
import { type PostgrestFilterBuilder } from '@supabase/postgrest-js'
import { supabase } from '@/utils/supabase'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export type Trip = {
  id: number
  created_at: string
  unit_id: number | null
  trip_location_id: number | null
  date: string | null
  materials: string | null
  km: number | null
  trip_no: number | null
  per_trip: number | null
  employee_id: number | null
  user_id: string | null
  description: string | null
  // Join fields para sa display sa table
  units?: {
    id: number
    name: string
  }
}

export type TripTableFilter = {
  search: string | null
  unit_id: number | null
  trip_location_id: number | null
  employee_id: number | null
  date_from: string | null
  date_to: string | null
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
    const search = tableSearch(filters.search)

    // First fetch: get trips data
    let tripsQuery = supabase
      .from('trips')
      .select('*')
      .order(column, { ascending: order })
      .range(rangeStart, rangeEnd)

    tripsQuery = getTripsFilter(tripsQuery, filters)

    const { data: tripsData } = await tripsQuery

    // Extract unique unit IDs para sa second fetch
    const unitIds = [...new Set(tripsData?.map(trip => trip.unit_id).filter(Boolean))] as number[]

    // Second fetch: get units data based sa unit IDs from trips
    let unitsData: { id: number; name: string }[] = []
    if (unitIds.length > 0) {
      const { data: fetchedUnits } = await supabase
        .from('units')
        .select('id, name')
        .in('id', unitIds)
      
      unitsData = fetchedUnits || []
    }

    // Combine ang data - map units sa trips
    const combinedData = tripsData?.map(trip => ({
      ...trip,
      units: trip.unit_id ? unitsData.find(unit => unit.id === trip.unit_id) : undefined
    })) || []

    const { count } = await getTripsCount(filters)

    tripsTable.value = combinedData as Trip[]
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

    if (date_from && date_to) {
      query = query.gte('date', date_from).lte('date', date_to)
    } else if (date_from) {
      query = query.gte('date', date_from)
    } else if (date_to) {
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
