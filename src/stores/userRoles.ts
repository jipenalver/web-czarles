import { supabase } from '@/utils/supabase'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export type UserRole = {
  id: number
  user_role: string
  user_role_pages: { page: string }[]
}

export const useUserRolesStore = defineStore('userRoles', () => {
  // States
  const userRoles = ref<UserRole[]>([])

  // Actions
  async function getUserRoles() {
    const { data } = await supabase
      .from('user_roles')
      .select('*, pages: user_role_pages (page)')
      .order('user_role', { ascending: true })

    userRoles.value = data as UserRole[]
  }

  // Expose States and Actions
  return { userRoles, getUserRoles }
})
