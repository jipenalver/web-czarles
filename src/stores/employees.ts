import { type TableOptions, tablePagination, tableSearch } from '@/utils/helpers/tables'
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
  is_field_staff: boolean
  hired_at: string
  birthdate: string
  tin_no: string
  sss_no: string
  pagibig_no: string
  philhealth_no: string
  id_no: string
  address: string
  designation_id: null | number
  designations: {
    designation: string
  }
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
    { search }: { search: string | null },
  ) {
    const { rangeStart, rangeEnd, column, order } = tablePagination(tableOptions, 'lastname')
    search = tableSearch(search)

    const query = supabase
      .from('employees')
      .select('*, designations ( designation )')
      .or(`firstname.ilike.%${search}%, lastname.ilike.%${search}%, email.ilike.%${search}%`)
      .order(column, { ascending: order })
      .range(rangeStart, rangeEnd)

    const { data } = await query

    const { count } = await getEmployeesCount({ search })

    employeesTable.value = data as Employee[]
    employeesTableTotal.value = count as number
  }

  async function getEmployeesCount({ search }: { search: string | null }) {
    return await supabase
      .from('employees')
      .select('*', { count: 'exact', head: true })
      .or(`firstname.ilike.%${search}%, lastname.ilike.%${search}%, email.ilike.%${search}%`)
  }

  async function addEmployee(formData: Partial<Employee>) {
    return await supabase.from('employees').insert(formData).select()
  }

  async function updateEmployee(formData: Partial<Employee>) {
    return await supabase.from('employees').update(formData).eq('id', formData.id).select()
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
