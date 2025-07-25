
import { type TableOptions, tablePagination} from '@/utils/helpers/tables'
import { type PostgrestFilterBuilder } from '@supabase/postgrest-js'
import { prepareDate } from '@/utils/helpers/others'
import type { TripLocation } from './tripLocation'
import { supabase } from '@/utils/supabase'
import type { Employee } from './employees'
import { defineStore } from 'pinia'
import type { Unit } from './units'
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
  employees?: Employee
  employee_fullname?: string
}

export type TripTableFilter = {
  search: string
  unit_id: number | undefined
  trip_location_id: number | undefined
  employee_id: number | undefined
  trip_at: string[]
}

// Make sure this has the 'export' keyword
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
    try {
      const { data, error } = await supabase.from('trips').select('*')
      if (error) {
        console.error('[getTrips] Error:', error)
        return
      }
      trips.value = data as Trip[]
    } catch (err) {
      console.error('[getTrips] Exception:', err)
    }
  }
  async function fetchFilteredTrips(dateString: string, employeeId: number | undefined): Promise<Trip[]> {
    if (!employeeId) return []
    // Extract YYYY-MM for filtering
    const yearMonth = dateString.slice(0, 7)
    // Compute next month for range filtering
    const [year, month] = yearMonth.split('-').map(Number)
    let nextYear = year
    let nextMonth = month + 1
    if (nextMonth > 12) {
      nextMonth = 1
      nextYear += 1
    }
    const nextMonthStr = `${nextYear}-${nextMonth.toString().padStart(2, '0')}`
    // Use join/alias as in store for trip_location and employees
    const { data, error } = await supabase
      .from('trips')
      .select('*, units:unit_id(name, created_at), trip_location:trip_location_id(*), employees:employee_id(firstname,middlename,lastname)')
      .eq('employee_id', employeeId)
      .gte('date', `${yearMonth}-01`)
      .lt('date', `${nextMonthStr}-01`)
      .order('date', { ascending: true })

    if (error) {
      //error pag fetch sa trips para payroll filter
      console.error('[fetchFilteredTrips] error:', error)
      return []
    }
    // Update the trips store (optional: replace or merge)
    trips.value = data as Trip[]
    // Debug log
    console.log('[fetchFilteredTrips] fetched trips from supabase:', data)
    return data as Trip[]
  }


  async function getTripsTable(tableOptions: TableOptions, filters: TripTableFilter) {
    // Fetching trips table with search ug pagination
    const { rangeStart, rangeEnd, column, order } = tablePagination(tableOptions, 'trip_no')
    // Copy search logic from designations
    const search = filters.search ? filters.search.trim() : ''

    let query = supabase
      .from('trips')
      .select('*, units:unit_id(name, created_at), trip_location:trip_location_id(*), employees:employee_id(firstname,middlename,lastname)')
      .order(column, { ascending: order })
      .range(rangeStart, rangeEnd)

    query = getTripsFilter(query, { ...filters, search })

    const { data: tripsData, error } = await query
    if (error) {
      console.error('[getTripsTable] Error:', error)
      return
    }

    const { count } = await getTripsCount({ ...filters, search })

    // Merge employee fullname into each trip
    const tripsWithFullname = (tripsData as Trip[]).map(trip => ({
      ...trip,
      employee_fullname: trip.employees
        ? `${trip.employees.firstname} ${trip.employees.middlename} ${trip.employees.lastname}`.replace(/\s+/g, ' ').trim()
        : ''
    }))

    tripsTable.value = tripsWithFullname
    tripsTableTotal.value = count as number
  }

  async function getTripsCount(filters: TripTableFilter) {
    //Counting trips for pagination
    let query = supabase
      .from('trips')
      .select('*', { count: 'exact', head: true })

    query = getTripsFilter(query, filters)

    const { count } = await query
    return { count }
  }

  function getTripsFilter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query: PostgrestFilterBuilder<any, any, any>,
    filters: TripTableFilter,
  ) {
    // Filtering trips for search ug filters
    const { search, unit_id, trip_location_id, employee_id, trip_at } = filters

    if (search) {
      // Search sa string fields ra, dili apil ang trip_no kay number
      query = query.or(`materials.ilike.%${search}%,description.ilike.%${search}%`)
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
    // Add Trip - always return actual Supabase error
    try {
      const { data, error } = await supabase.from('trips').insert(formData).select()
      // Ibalik gyud ang error gikan sa Supabase, dili null
      return { data, error }
    } catch (err) {
      // Exception handling, para klaro unsay nahitabo
      console.error('[addTrip] Exception:', err)
      return { data: null, error: err }
    }
  }

  async function updateTrip(formData: Partial<Trip>) {
    // Update Trip - always return actual Supabase error
    try {
      const { data, error } = await supabase.from('trips').update(formData).eq('id', formData.id).select()
      // Ibalik gyud ang error gikan sa Supabase, dili null
      return { data, error }
    } catch (err) {
      // Exception handling, para klaro unsay nahitabo
      console.error('[updateTrip] Exception:', err)
      return { data: null, error: err }
    }
  }

  async function deleteTrip(id: number) {
    // Delete Trip - always return actual Supabase error
    try {
      const { data, error } = await supabase.from('trips').delete().eq('id', id).select()
      // Ibalik gyud ang error gikan sa Supabase, dili null
      return { data, error }
    } catch (err) {
      // Exception handling, para klaro unsay nahitabo
      console.error('[deleteTrip] Exception:', err)
      return { data: null, error: err }
    }
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
    fetchFilteredTrips,
  }
})