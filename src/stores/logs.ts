import { supabase } from '@/utils/supabase'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export type Log = {
  id: number
  created_at: string
  description: string
  db_table: string
  user_id: string
  employee_id: number
}

export const useLogsStore = defineStore('logs', () => {
  // States
  const logs = ref<Log[]>([])
  const logsByEmployee = ref<Log[]>([])

  // Actions
  async function getLogs() {
    const { data } = await supabase.from('logs').select()

    logs.value = data as Log[]
  }

  async function getLogsById(employeeId: number) {
    const { data } = await supabase.from('logs').select().eq('employee_id', employeeId)

    logsByEmployee.value = data as Log[]
  }

  // Expose States and Actions
  return {
    logs,
    logsByEmployee,
    getLogs,
    getLogsById,
  }
})
