/* eslint-disable @typescript-eslint/no-unused-vars */
import { supabase } from '@/utils/supabase'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export type UserRolePage = {
  id: number
  page: string
}

export type UserRole = {
  id: number
  user_role: string
  description: string
  user_role_pages: UserRolePage[]
  pages: string[]
}

export const useUserRolesStore = defineStore('userRoles', () => {
  // States
  const userRoles = ref<UserRole[]>([])

  // Actions
  async function getUserRoles() {
    const { data } = await supabase
      .from('user_roles')
      .select('*, user_role_pages (*)')
      .order('user_role', { ascending: true })

    userRoles.value = data as UserRole[]
  }

  async function addUserRole(formData: Partial<UserRole>) {
    const { pages, ...roleData } = formData

    const { data, error } = await supabase.from('user_roles').insert(roleData).select()

    if (data) await addUserRolePages(data[0].id, pages as string[])

    return { data, error }
  }

  async function updateUserRole(formData: Partial<UserRole>) {
    const { user_role_pages, pages, ...roleData } = formData

    const { data, error } = await supabase
      .from('user_roles')
      .update(roleData)
      .eq('id', roleData.id)
      .select()

    await updateUserRolePages(roleData.id as number, pages as string[])

    return { data, error }
  }

  async function deleteUserRole(id: number) {
    const { data, error: deleteError } = await deleteUserRolePages(id)

    if (deleteError) return { data, error: deleteError }

    return await supabase.from('user_roles').delete().eq('id', id).select()
  }

  async function addUserRolePages(id: number, pages: string[]) {
    const pageData = pages.map((page) => ({ page, user_role_id: id }))

    return await supabase.from('user_role_pages').insert(pageData).select()
  }

  async function updateUserRolePages(id: number, pages: string[]) {
    const { data, error: deleteError } = await deleteUserRolePages(id)

    if (deleteError) return { data, error: deleteError }

    return await addUserRolePages(id, pages)
  }

  async function deleteUserRolePages(id: number) {
    return await supabase.from('user_role_pages').delete().eq('user_role_id', id).select()
  }

  // Expose States and Actions
  return { userRoles, getUserRoles, addUserRole, updateUserRole, deleteUserRole }
})
