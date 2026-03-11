import { type TableOptions, tablePagination, tableSearch } from '@/utils/helpers/tables'
import { type PostgrestFilterBuilder } from '@supabase/postgrest-js'
import { supabase } from '@/utils/supabase'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export type TripLocation = {
  id: number
  created_at: string
  location: string
  description: string
}

export type TripLocationTableFilter = {
  search: string | null
}

export const useTripLocationsStore = defineStore('tripLocations', () => {
  // States
  const tripLocations = ref<TripLocation[]>([])
  const tripLocationsTable = ref<TripLocation[]>([])
  const tripLocationsTableTotal = ref(0)

  // Reset State
  function $reset() {
    tripLocations.value = []
    tripLocationsTable.value = []
    tripLocationsTableTotal.value = 0
  }

  // Actions
  async function getTripLocations() {
    const { data } = await supabase.from('trip_locations').select()

    tripLocations.value = data as TripLocation[]
  }

  async function getTripLocationsTable(
    tableOptions: TableOptions,
    { search }: TripLocationTableFilter,
  ) {
    const { rangeStart, rangeEnd, column, order } = tablePagination(tableOptions, 'location')
    search = tableSearch(search)

    let query = supabase
      .from('trip_locations')
      .select()
      .order(column, { ascending: order })
      .range(rangeStart, rangeEnd)

    query = getTripLocationsFilter(query, { search })

    const { data } = await query

    const { count } = await getTripLocationsCount({ search })

    tripLocationsTable.value = data as TripLocation[]
    tripLocationsTableTotal.value = count as number
  }

  async function getTripLocationsCount({ search }: TripLocationTableFilter) {
    let query = supabase.from('trip_locations').select('*', { count: 'exact', head: true })

    query = getTripLocationsFilter(query, { search })

    return await query
  }

  function getTripLocationsFilter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query: PostgrestFilterBuilder<any, any, any, any>,
    { search }: TripLocationTableFilter,
  ) {
    if (search) query = query.or(`location.ilike.%${search}%, description.ilike.%${search}%`)

    return query
  }

  async function addTripLocation(formData: Partial<TripLocation>) {
    return await supabase.from('trip_locations').insert(formData).select()
  }

  async function updateTripLocation(formData: Partial<TripLocation>) {
    return await supabase.from('trip_locations').update(formData).eq('id', formData.id).select()
  }

  async function deleteTripLocation(id: number) {
    return await supabase.from('trip_locations').delete().eq('id', id).select()
  }

  // Expose States and Actions
  return {
    tripLocations,
    tripLocationsTable,
    tripLocationsTableTotal,
    $reset,
    getTripLocations,
    getTripLocationsTable,
    addTripLocation,
    updateTripLocation,
    deleteTripLocation,
  }
})
