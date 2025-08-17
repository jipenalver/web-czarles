/* eslint-disable @typescript-eslint/no-unused-vars */
import { type TableOptions } from '@/utils/helpers/tables'
import { type User } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/utils/supabase'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export type AdminUser = {
  id: string
  created_at: string
  user_role: string | null
  firstname: string
  middlename: string
  lastname: string
  email: string
  phone: string
  password: string
  is_admin: boolean
  avatar: string
}

export const useUsersStore = defineStore('users', () => {
  // States
  const users = ref<AdminUser[]>([])
  const usersTable = ref<AdminUser[]>([])
  const usersTableTotal = ref(0)

  // Reset State
  function $reset() {
    users.value = []
    usersTable.value = []
    usersTableTotal.value = 0
  }

  // Actions
  function userMap(user: User) {
    const { id, email, user_metadata, created_at } = user

    return {
      id,
      created_at,
      user_role: user_metadata.user_role,
      firstname: user_metadata.firstname,
      middlename: user_metadata.middlename,
      lastname: user_metadata.lastname,
      email: email as string,
      phone: user_metadata.phone,
      password: user_metadata.password,
      is_admin: user_metadata.is_admin,
      avatar: user_metadata.avatar,
    }
  }

  async function getUsers() {
    const { data } = await supabaseAdmin.auth.admin.listUsers()

    const { users: usersData } = data as { users: User[] }

    users.value = usersData.map(userMap)
  }

  async function getUsersTable({ page, itemsPerPage }: TableOptions) {
    const { data } = await supabaseAdmin.auth.admin.listUsers({
      page: page,
      perPage: itemsPerPage,
    })

    const { users, total } = data as { users: User[]; total: number }

    usersTable.value = users.map(userMap)
    usersTableTotal.value = total
  }

  // Fetch a single user by id, map it and add to the users state if not present
  async function getUsersId(id: string) {
    if (!id) return null
    try {
      const { data } = await supabaseAdmin.auth.admin.getUserById(id)
      // data may contain a `user` property
      const user = (data as { user?: User })?.user
      if (!user) return null

      const mapped = userMap(user)
      // avoid duplicates
      if (!users.value.find((u) => u.id === mapped.id)) {
        users.value.push(mapped)
      }

      return mapped
    } catch (e) {
      // swallow errors and return null so callers can fallback
      return null
    }
  }

  async function addUser(formData: Partial<AdminUser>) {
    const { email, password, ...userMetadata } = formData

    return await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { ...userMetadata, password },
    })
  }

  async function updateUser(formData: Partial<AdminUser>) {
    const { id, email, created_at, ...userMetadata } = formData

    return await supabaseAdmin.auth.admin.updateUserById(id as string, {
      user_metadata: { ...userMetadata },
    })
  }

  async function deleteUser(id: string) {
    return await supabaseAdmin.auth.admin.deleteUser(id)
  }

  // Expose States and Actions
  return {
    users,
    usersTable,
    usersTableTotal,
    $reset,
    getUsers,
    getUsersTable,
    getUsersId,
    addUser,
    updateUser,
    deleteUser,
  }
})
