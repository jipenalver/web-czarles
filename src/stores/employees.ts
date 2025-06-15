/* eslint-disable @typescript-eslint/no-unused-vars */
import { type TableOptions, tablePagination, tableSearch } from '@/utils/helpers/tables'
import { type PostgrestFilterBuilder } from '@supabase/postgrest-js'
import { supabase } from '@/utils/supabase'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export type Employee = {
  id: number
  created_at: string
  firstname: string
  middlename: string
  lastname: string
  email: string
  phone: string
  hired_at: string
  birthdate: string
  address: string
  tin_no: string
  sss_no: string
  pagibig_no: string
  philhealth_no: string
  is_field_staff: boolean
  is_permanent: boolean
  is_insured: boolean
  designation_id: null | number
  designation: {
    designation: string
  }
  area_origin_id: null | number
  area_origin: {
    area: string
  }
  area_assignment_id: null | number
  area_assignment: {
    area: string
  }
  daily_rate: number
}

export type EmployeeTableFilter = {
  search: string | null
  designation_id: number | null
}

export const useEmployeesStore = defineStore('employees', () => {
  // States
  const employeesTable = ref<Employee[]>([])
  const employeesTableTotal = ref(0)

  // Reset State
  function $reset() {
    employeesTable.value = []
    employeesTableTotal.value = 0
  }

  // Actions
  async function getEmployeesTable(
    tableOptions: TableOptions,
    { search, designation_id }: EmployeeTableFilter,
  ) {
    const { rangeStart, rangeEnd, column, order } = tablePagination(tableOptions, 'lastname')
    search = tableSearch(search)

    let query = supabase
      .from('employees')
      .select(
        '*, designation:designation_id (designation), area_origin:area_origin_id (area), area_assignment:area_assignment_id (area)',
      )
      .order(column, { ascending: order })
      .range(rangeStart, rangeEnd)

    query = getEmployeesFilter(query, { search, designation_id })

    const { data } = await query

    const { count } = await getEmployeesCount({ search, designation_id })

    employeesTable.value = data as Employee[]
    employeesTableTotal.value = count as number
  }

  async function getEmployeesCount({ search, designation_id }: EmployeeTableFilter) {
    let query = supabase.from('employees').select('*', { count: 'exact', head: true })

    query = getEmployeesFilter(query, { search, designation_id })

    return await query
  }

  function getEmployeesFilter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query: PostgrestFilterBuilder<any, any, any>,
    { search, designation_id }: EmployeeTableFilter,
  ) {
    if (search)
      query = query.or(
        `firstname.ilike.%${search}%, lastname.ilike.%${search}%, email.ilike.%${search}%`,
      )

    if (designation_id) query = query.eq('designation_id', designation_id)

    return query
  }

  async function addEmployee(formData: Partial<Employee>) {
    return await supabase.from('employees').insert(formData).select()
  }

  async function updateEmployee(formData: Partial<Employee>) {
    const { designation, area_origin, area_assignment, ...updateData } = formData

    return await supabase.from('employees').update(updateData).eq('id', formData.id).select()
  }

  async function deleteEmployee(id: number) {
    return await supabase.from('employees').delete().eq('id', id).select()
  }

  // Expose States and Actions
  return {
    employeesTable,
    employeesTableTotal,
    $reset,
    getEmployeesTable,
    addEmployee,
    updateEmployee,
    deleteEmployee,
  }
})
