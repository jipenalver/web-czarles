import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/utils/supabase'

export type TripLocation = {
  id: number
  created_at: string
  location: string 
  description: string 
}

export type TripLocationTableFilter = {
  search: string
  location?: string
  description?: string
}

export type TripLocationTableOptions = {
  page: number
  itemsPerPage: number
  sortBy: { key: string; order: 'asc' | 'desc' }[]
}

export const useTripLocationsStore = defineStore('tripLocations', () => {
  const tripLocations = ref<TripLocation[]>([])
  const tripLocationsTable = ref<TripLocation[]>([])
  const tripLocationsTableTotal = ref(0)
  const isLoading = ref(false)

  // Get all (no filter)
  async function fetchTripLocations() {
    isLoading.value = true
    const { data } = await supabase.from('trip_locations').select('*').order('location', { ascending: true })
    tripLocations.value = data as TripLocation[]
    isLoading.value = false
  }

  // Server-side search and pagination for table
  async function getTripLocationsTable(tableOptions: TripLocationTableOptions, filters: TripLocationTableFilter) {
    isLoading.value = true
    const { page, itemsPerPage, sortBy } = tableOptions
    const sort = sortBy && sortBy.length > 0 ? sortBy[0] : { key: 'location', order: 'asc' }
    const from = (page - 1) * itemsPerPage
    const to = from + itemsPerPage - 1

    let query = supabase
      .from('trip_locations')
      .select('*', { count: 'exact' })
      .order(sort.key, { ascending: sort.order === 'asc' })
      .range(from, to)

    if (filters.search) {
      // search by location or description
      query = query.or(`location.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    const { data, count } = await query
    tripLocationsTable.value = data as TripLocation[]
    tripLocationsTableTotal.value = count || 0
    isLoading.value = false
  }

  // Post
  async function addTripLocation(formData: Partial<TripLocation>) {
    return await supabase.from('trip_locations').insert(formData).select()
  }

  // Put
  async function updateTripLocation(formData: Partial<TripLocation>) {
    return await supabase.from('trip_locations').update(formData).eq('id', formData.id).select()
  }

  // Delete
  async function deleteTripLocation(id: number) {
    return await supabase.from('trip_locations').delete().eq('id', id).select()
  }

  return {
    tripLocations,
    tripLocationsTable,
    tripLocationsTableTotal,
    isLoading,
    fetchTripLocations,
    getTripLocationsTable,
    addTripLocation,
    updateTripLocation,
    deleteTripLocation,
  }
})
