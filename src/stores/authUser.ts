import { supabase } from '@/utils/supabase'
import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

type AuthUser = {
  id: string
  email: string
  firstname: string
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

  // Reset State Action
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

  // Retrieve User Information
  async function getUserInformation() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const { id, email, user_metadata } = user
      userData.value = { id, email, ...user_metadata }
    }
  }

  // Update User Information
  async function updateUserInformation(updatedData: Partial<AuthUser>) {
    const {
      data: { user },
      error,
    } = await supabase.auth.updateUser({
      data: updatedData,
    })

    if (error) return { error }
    else if (user) {
      const { id, email, user_metadata } = user
      userData.value = { id, email, ...user_metadata }

      return { data: userData.value }
    }
  }

  // Update User Profile Image
  async function updateUserImage(file: File) {
    const { data, error } = await supabase.storage
      .from('czarles')
      .upload('avatars/' + userData.value?.id + '-avatar.png', file, {
        cacheControl: '3600',
        upsert: true,
      })

    if (error) return { error }
    else if (data) {
      const { data: imageData } = supabase.storage.from('shirlix').getPublicUrl(data.path)

      return await updateUserInformation({ ...userData.value, avatar: imageData.publicUrl })
    }
  }

  // Retrieve User Roles Pages
  async function getAuthPages(name: string) {
    const { data } = await supabase
      .from('user_roles')
      .select('*, pages: user_role_pages (page)')
      .eq('user_role', name)

    if (data && data.length > 0)
      authPages.value = data[0].pages.map((p: { page: string }) => p.page)
  }

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
