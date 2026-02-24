/* eslint-disable @typescript-eslint/no-unused-vars */
import { type EmailPayload, onEmailNotification, supabase, supabaseAdmin } from '@/utils/supabase'
import { type AdminUser, useUsersStore } from './users'
import { type User } from '@supabase/supabase-js'
import { type UserRole } from './userRoles'
import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

type AuthUser = {
  id: string
  email: string
  phone: string
  firstname: string
  middlename: string
  lastname: string
  is_admin: boolean
  user_role: string
  avatar: string
}

export const useAuthUserStore = defineStore('authUser', () => {
  const usersStore = useUsersStore()

  // States
  const userData = ref<Partial<AuthUser> | null>(null)
  const authPages = ref<string[]>([])
  const usersApprovers = ref<AdminUser[]>([])

  // Getters
  const userRole = computed(() => {
    return userData.value?.is_admin ? 'Super Administrator' : userData.value?.user_role
  })

  // Reset State
  function $reset() {
    userData.value = null
    authPages.value = []
    usersApprovers.value = []
  }

  // Actions
  async function isAuthenticated() {
    const { data } = await supabase.auth.getSession()

    if (data.session) {
      const { id, email, user_metadata } = data.session.user
      userData.value = { id, email, ...user_metadata }
    }

    return !!data.session
  }

  async function getUserInformation() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const { id, email, user_metadata } = user
      userData.value = { id, email, ...user_metadata }
    }
  }

  async function updateUserInformation(updatedData: Partial<AuthUser>) {
    const { id, email, ...otherData } = updatedData

    const {
      data: { user },
      error,
    } = await supabase.auth.updateUser({
      data: otherData,
    })

    if (user) {
      const { id, email, user_metadata } = user
      userData.value = { id, email, ...user_metadata }
    }

    return { data: user, error }
  }

  async function updateUserImage(file: File) {
    const { data, error } = await supabase.storage
      .from('czarles')
      .upload('avatars/' + userData.value?.id + '-avatar.' + file.name.split('.').pop(), file, {
        cacheControl: '3600',
        upsert: true,
      })

    if (error) return { data, error }

    const { data: imageData } = supabase.storage.from('czarles').getPublicUrl(data.path)

    return { data: imageData, error: null }
  }

  async function getAuthPages(name: string) {
    const { data } = await supabase
      .from('user_roles')
      .select('*, pages: user_role_pages (page)')
      .eq('user_role', name)

    if (data && data.length > 0)
      authPages.value = data[0].pages.map((p: { page: string }) => p.page)
  }

  async function getUserRole(name: string) {
    const { data } = await supabase.from('user_roles').select('*').eq('user_role', name).single()

    return data as Omit<UserRole, 'user_role_pages' | 'pages'>
  }

  async function getUsersApprovers() {
    const { data } = await supabaseAdmin.auth.admin.listUsers()

    const { users: usersData } = data as { users: User[] }

    const mappedUsers = usersData.map(usersStore.userMap)

    const filterUsers = await Promise.all(
      mappedUsers.map(async (user) => {
        if (!user.user_role) return null

        const userRole = await getUserRole(user.user_role as string)

        return userRole.is_approver ? user : null
      }),
    )

    usersApprovers.value = filterUsers.filter((user) => user !== null) as AdminUser[]
  }

  async function sendToApprovers(payload: Omit<EmailPayload, 'email'>) {
    for (const approver of usersApprovers.value) {
      await onEmailNotification({ ...payload, email: approver.email })

      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }

  // Expose States and Actions
  return {
    userData,
    userRole,
    authPages,
    usersApprovers,
    $reset,
    isAuthenticated,
    getUserInformation,
    updateUserInformation,
    updateUserImage,
    getAuthPages,
    getUserRole,
    getUsersApprovers,
    sendToApprovers,
  }
})
