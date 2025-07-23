import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/utils/supabase'

export type TripLocation = {
  id: number
  created_at: string
  location: string 
  description: string 
}

export const useTripLocationsStore = defineStore('tripLocations', () => {
  const tripLocations = ref<TripLocation[]>([])
  const isLoading = ref(false)

  // Get
  async function fetchTripLocations() {
    isLoading.value = true
    const { data } = await supabase.from('trip_locations').select('*').order('location', { ascending: true })
    tripLocations.value = data as TripLocation[]
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
    isLoading,
    fetchTripLocations,
    addTripLocation,
    updateTripLocation,
    deleteTripLocation,
  }
})
