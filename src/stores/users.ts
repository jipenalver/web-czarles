/* eslint-disable @typescript-eslint/no-unused-vars */
import { type TableOptions } from '@/utils/helpers/tables'
import { type User } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/utils/supabase'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export type AdminUser = {
  id: string
  firstname: string
  lastname: string
  email: string
  password: string
  user_role: string
}

export const useUsersStore = defineStore('users', () => {
  // States
  const usersTable = ref<AdminUser[]>([])
  const usersTotal = ref(0)

  // Reset State Action
  function $reset() {
    usersTable.value = []
    usersTotal.value = 0
  }

  // Retrieve Users
  async function getUsersTable({ page, itemsPerPage }: TableOptions) {
    const { data } = await supabaseAdmin.auth.admin.listUsers({
      page: page,
      perPage: itemsPerPage,
    })

    const { users, total } = data as { users: User[]; total: number }
    usersTable.value = users.map((user) => {
      const { id, email, user_metadata } = user

      return {
        id,
        email: email as string,
        firstname: user_metadata.firstname,
        lastname: user_metadata.lastname,
        password: user_metadata.password,
        user_role: user_metadata.user_role,
      }
    })
    usersTotal.value = total
  }

  // Add User
  async function addUser(formData: AdminUser) {
    const { password, ...userMetadata } = formData

    return await supabaseAdmin.auth.admin.createUser({
      email: formData.email,
      email_confirm: true,
      password: formData.password,
      user_metadata: { ...userMetadata, password },
    })
  }

  // Update User
  async function updateUser(formData: AdminUser) {
    const { id, email, password, ...userMetadata } = formData

    return await supabaseAdmin.auth.admin.updateUserById(id, {
      user_metadata: { ...userMetadata, password },
    })
  }

  // Delete User
  async function deleteUser(id: string) {
    return await supabaseAdmin.auth.admin.deleteUser(id)
  }

  return { usersTable, usersTotal, $reset, getUsersTable, addUser, updateUser, deleteUser }
})
