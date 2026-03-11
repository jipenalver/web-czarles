import { type TableOptions, tablePagination } from '@/utils/helpers/tables'
import { supabase } from '@/utils/supabase'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export type Benefit = {
  id: number
  created_at: string
  benefit: string
  description: string
  is_deduction: boolean
}

export type EmployeeDeduction = {
  id: number
  employee_id: number
  benefit_id: number
  amount: number
  is_quincena: boolean
  created_at: string
  benefit: Benefit
}

export type EmployeeDeductionForm = {
  amount: number[]
  is_quincena: boolean[]
}

export const useBenefitsStore = defineStore('benefits', () => {
  // States
  const addons = ref<Benefit[]>([])
  const deductions = ref<Benefit[]>([])
  const benefitsTable = ref<Benefit[]>([])
  const benefitsTableTotal = ref(0)

  // Reset State
  function $reset() {
    addons.value = []
    deductions.value = []
    benefitsTable.value = []
    benefitsTableTotal.value = 0
  }

  // Actions
  async function getBenefits() {
    const { data } = await supabase
      .from('employee_benefits')
      .select()
      .order('benefit', { ascending: true })

    const benefits = data as Benefit[]

    addons.value = benefits.filter((b) => !b.is_deduction)
    deductions.value = benefits.filter((b) => b.is_deduction)
  }

  async function getBenefitsTable(tableOptions: TableOptions) {
    const { rangeStart, rangeEnd, column, order } = tablePagination(tableOptions, 'benefit')

    const query = supabase
      .from('employee_benefits')
      .select()
      .order(column, { ascending: order })
      .range(rangeStart, rangeEnd)

    const { data } = await query

    const { count } = await getBenefitsCount()

    benefitsTable.value = data as Benefit[]
    benefitsTableTotal.value = count as number
  }

  async function getBenefitsCount() {
    return await supabase.from('employee_benefits').select('*', { count: 'exact', head: true })
  }

  async function addBenefit(formData: Partial<Benefit>) {
    return await supabase.from('employee_benefits').insert(formData).select()
  }

  async function updateBenefit(formData: Partial<Benefit>) {
    return await supabase.from('employee_benefits').update(formData).eq('id', formData.id).select()
  }

  async function deleteBenefit(id: number) {
    return await supabase.from('employee_benefits').delete().eq('id', id).select()
  }

  async function getDeductionsById(employeeId: number) {
    const { data } = await supabase
      .from('employee_deductions')
      .select('*, benefit:benefit_id (benefit, is_deduction)')
      .eq('employee_id', employeeId)

    return data as EmployeeDeduction[]
  }

  async function updateDeductionsById(formData: Partial<EmployeeDeduction>[]) {
    const { error: deleteError } = await supabase
      .from('employee_deductions')
      .delete()
      .eq('employee_id', formData[0].employee_id)

    if (deleteError) return { data: null, error: deleteError }

    return await supabase.from('employee_deductions').upsert(formData).select()
  }

  // Expose States and Actions
  return {
    deductions,
    addons,
    benefitsTable,
    benefitsTableTotal,
    $reset,
    getBenefits,
    getBenefitsTable,
    addBenefit,
    updateBenefit,
    deleteBenefit,
    getDeductionsById,
    updateDeductionsById,
  }
})
