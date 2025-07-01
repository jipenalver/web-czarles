import { useAuthUserStore } from './authUser'
import { supabase } from '@/utils/supabase'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export type Log = {
  id: number
  created_at: string
  description: string
  type: string
  user_id: string
  user_avatar: string | null
  user_fullname: string
  employee_id: number
}

export const useLogsStore = defineStore('logs', () => {
  const authUserStore = useAuthUserStore()

  // States
  const logs = ref<Log[]>([])
  const logsByEmployee = ref<Log[]>([])

  // Actions
  async function getLogs() {
    const { data } = await supabase.from('logs').select()

    logs.value = data as Log[]
  }

  async function getLogsById(employeeId: number, type: string | null = null) {
    const { data } = await supabase
      .from('logs')
      .select()
      .eq('employee_id', employeeId)
      .eq('type', type)

    logsByEmployee.value = data as Log[]
  }

  async function addLog(logData: Partial<Log>) {
    const preparedData = {
      ...logData,
      user_id: authUserStore.userData?.id as string,
      user_avatar: authUserStore.userData?.avatar || null,
      user_fullname: authUserStore.userData?.firstname + ' ' + authUserStore.userData?.lastname,
    }

    return await supabase.from('logs').insert(preparedData).select()
  }

  // Expose States and Actions
  return {
    logs,
    logsByEmployee,
    getLogs,
    getLogsById,
    addLog,
  }
})
