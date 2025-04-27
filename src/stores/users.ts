/* eslint-disable @typescript-eslint/no-unused-vars */
import { type TableOptions } from '@/utils/helpers/tables'
import { type User } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/utils/supabase'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export type AdminUser = {
  id: string
  user_role: string
  firstname: string
  middlename: string
  lastname: string
  email: string
  phone: string
  password: string
  created_at: string
}

export const useUsersStore = defineStore('users', () => {
  // States
  const usersTable = ref<AdminUser[]>([])
  const usersTableTotal = ref(0)

  // Reset State
  function $reset() {
    usersTable.value = []
    usersTableTotal.value = 0
  }

  // Actions
  async function getUsersTable({ page, itemsPerPage }: TableOptions) {
    const { data } = await supabaseAdmin.auth.admin.listUsers({
      page: page,
      perPage: itemsPerPage,
    })

    const { users, total } = data as { users: User[]; total: number }

    usersTable.value = users.map((user) => {
      const { id, email, user_metadata, created_at } = user

      return {
        id,
        user_role: user_metadata.user_role,
        firstname: user_metadata.firstname,
        middlename: user_metadata.middlename,
        lastname: user_metadata.lastname,
        email: email as string,
        phone: user_metadata.phone,
        password: user_metadata.password,
        created_at,
      }
    })
    usersTableTotal.value = total
  }

  async function addUser(formData: AdminUser) {
    const { password, ...userMetadata } = formData

    return await supabaseAdmin.auth.admin.createUser({
      email: formData.email,
      email_confirm: true,
      password: formData.password,
      user_metadata: { ...userMetadata, password },
    })
  }

  async function updateUser(formData: AdminUser) {
    const { id, email, password, ...userMetadata } = formData

    return await supabaseAdmin.auth.admin.updateUserById(id, {
      user_metadata: { ...userMetadata, password },
    })
  }

  async function deleteUser(id: string) {
    return await supabaseAdmin.auth.admin.deleteUser(id)
  }

  return { usersTable, usersTableTotal, $reset, getUsersTable, addUser, updateUser, deleteUser }
})
