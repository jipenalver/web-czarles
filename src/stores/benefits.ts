import { type TableOptions, tablePagination } from '@/utils/helpers/tables'
import { supabase } from '@/utils/supabase'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export type Benefit = {
  id: number
  created_at: string
  benefit: string
  description: string
}

export const useBenefitsStore = defineStore('benefits', () => {
  // States
  const benefits = ref<Benefit[]>([])
  const benefitsTable = ref<Benefit[]>([])
  const benefitsTableTotal = ref(0)

  // Reset State
  function $reset() {
    benefits.value = []
    benefitsTable.value = []
    benefitsTableTotal.value = 0
  }

  // Actions
  async function getBenefits() {
    const { data } = await supabase.from('employee_benefits').select()

    benefits.value = data as Benefit[]
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

  // Expose States and Actions
  return {
    benefits,
    benefitsTable,
    benefitsTableTotal,
    $reset,
    getBenefits,
    getBenefitsTable,
    addBenefit,
    updateBenefit,
    deleteBenefit,
  }
})
