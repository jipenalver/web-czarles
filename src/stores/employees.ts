/* eslint-disable @typescript-eslint/no-unused-vars */
import { type TableOptions, tablePagination, tableSearch } from '@/utils/helpers/tables'
import { type PostgrestFilterBuilder } from '@supabase/postgrest-js'
import { type Benefit, type EmployeeDeduction } from './benefits'
import { prepareFormDates } from '@/utils/helpers/others'
import { type Designation } from './designations'
import { supabase } from '@/utils/supabase'
import { defineStore } from 'pinia'
import { type Area } from './areas'
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
  designation_id: number | null
  designation: Designation
  area_origin_id: number | null
  area_origin: Area
  area_assignment_id: number | null
  area_assignment: Area
  daily_rate: number
  employee_deductions: (EmployeeDeduction & {
    employee_benefit: Benefit
  })[]
}

export type EmployeeTableFilter = {
  search: string | null
  designation_id: number | null
}

export const useEmployeesStore = defineStore('employees', () => {
  // States
  const employees = ref<Employee[]>([])
  const employeesTable = ref<Employee[]>([])
  const employeesTableTotal = ref(0)

  // Reset State
  function $reset() {
    employees.value = []
    employeesTable.value = []
    employeesTableTotal.value = 0
  }

  // Actions
  async function getEmployees() {
    const { data } = await supabase.from('employees').select()

    employees.value = data?.map((item) => ({
      ...item,
      label: `${item.firstname} ${item.middlename ? item.middlename + ' ' : ''}${item.lastname}`,
      value: item.id,
    })) as Employee[]
  }
  // Get employee by ID using Supabase query
  async function getEmployeeById(id: number): Promise<Employee | undefined> {
    // kuhaon ang employee with related designation, area, and deductions gamit join
    const { data, error } = await supabase
      .from('employees')
      .select(
        `
      *,
      employee_deductions (
        *,
        employee_benefit:benefit_id (*)
      ),
      cash_advances (*)
    `,
      )
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching employee:', error)
      return undefined
    }

    console.log('getEmployeeById result:', data) // display ang result sa query para sa debugging
    return data as Employee | undefined
  }
  async function getEmployeesTable(
    tableOptions: TableOptions,
    { search, designation_id }: EmployeeTableFilter,
  ) {
    const { rangeStart, rangeEnd, column, order } = tablePagination(tableOptions, 'lastname')
    search = tableSearch(search)

    let query = supabase
      .from('employees')
      .select(
        '*, designation:designation_id (*), area_origin:area_origin_id (*), area_assignment:area_assignment_id (*), employee_deductions (*, employee_benefit:benefit_id (*))',
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
    const preparedData = prepareFormDates(formData, ['birthdate', 'hired_at'])

    return await supabase.from('employees').insert(preparedData).select()
  }

  async function updateEmployee(formData: Partial<Employee>) {
    const { designation, area_origin, area_assignment, employee_deductions, ...updateData } =
      prepareFormDates(formData, ['birthdate', 'hired_at'])

    return await supabase.from('employees').update(updateData).eq('id', formData.id).select()
  }

  async function deleteEmployee(id: number) {
    return await supabase.from('employees').delete().eq('id', id).select()
  }

  function getEmployeeByIdemp(id: number): Employee | undefined {
    return employees.value.find((emp) => emp.id === id)
  }
  // Expose States and Actions
  return {
    employees,
    employeesTable,
    employeesTableTotal,
    $reset,
    getEmployees,
    getEmployeesTable,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    getEmployeeByIdemp,
    getEmployeeById,
  }
})
