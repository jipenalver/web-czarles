/* eslint-disable @typescript-eslint/no-unused-vars */
import { supabase } from '@/utils/supabase'
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
  // States
  const userData = ref<Partial<AuthUser> | null>(null)
  const authPages = ref<string[]>([])

  // Getters
  const userRole = computed(() => {
    return userData.value?.is_admin ? 'Super Administrator' : userData.value?.user_role
  })

  // Reset State
  function $reset() {
    userData.value = null
    authPages.value = []
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
      .upload('avatars/' + userData.value?.id + '-avatar.png', file, {
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

  // Expose States and Actions
  return {
    userData,
    userRole,
    authPages,
    $reset,
    isAuthenticated,
    getUserInformation,
    updateUserInformation,
    updateUserImage,
    getAuthPages,
  }
})
