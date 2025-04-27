import { supabase } from '@/utils/supabase'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export type UserRole = {
  id: number
  user_role: string
  user_role_pages: { page: string }[]
  pages: string[]
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

  // Add User Roles
  async function addUserRole(formData: Partial<UserRole>) {
    const { pages, ...roleData } = formData

    const { data, error } = await supabase.from('user_roles').insert(roleData).select()

    if (data) await updateUserRolePages(data[0].id, pages as string[])

    return { data, error }
  }

  // Update User Roles
  async function updateUserRole(formData: Partial<UserRole>) {
    const { pages, ...roleData } = formData

    const { data, error } = await supabase
      .from('user_roles')
      .update(roleData)
      .eq('id', roleData.id)
      .select()

    await updateUserRolePages(formData.id as number, pages as string[])

    return { data, error }
  }

  // Update User Roles Pages
  async function updateUserRolePages(id: number, pages: string[]) {
    const { error: deleteError } = await supabase
      .from('user_role_pages')
      .delete()
      .eq('user_role_id', id)

    if (deleteError) return { error: deleteError }

    const pageData = pages.map((page) => ({ page, user_role_id: id }))

    const { data, error: insertError } = await supabase
      .from('user_role_pages')
      .insert(pageData)
      .select()

    return { data, error: insertError }
  }

  // Expose States and Actions
  return { userRoles, getUserRoles, addUserRole, updateUserRole }
})
