import { supabase } from '@/utils/supabase'
import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

type UserData = {
  id: string
  email: string
  firstname: string
  lastname: string
  is_admin: boolean
  user_role: string
  image_url: string
}

export const useAuthUserStore = defineStore('authUser', () => {
  // States
  const userData = ref<Partial<UserData> | null>(null)
  const authPages = ref<string[]>([])

  // Getters
  // Computed Properties; Use for getting the state but not modifying its reactive state
  const userRole = computed(() => {
    return userData.value?.is_admin ? 'Super Administrator' : userData.value?.user_role
  })

  // Reset State Action
  function $reset() {
    userData.value = null
    authPages.value = []
  }

  // Actions
  // Retrieve User Session if Logged
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

    // Set the retrieved information to state
    if (user) {
      const { id, email, user_metadata } = user
      userData.value = { id, email, ...user_metadata }
    }
  }

  // Update User Information
  async function updateUserInformation(updatedData: Partial<UserData>) {
    const {
      data: { user },
      error,
    } = await supabase.auth.updateUser({
      data: {
        ...updatedData,
      },
    })

    // Check if it has error
    if (error) {
      return { error }
    }
    // If no error set updatedData to userData state
    else if (user) {
      const { id, email, user_metadata } = user
      userData.value = { id, email, ...user_metadata }

      return { data: userData.value }
    }
  }

  // Update User Profile Image
  async function updateUserImage(file: File) {
    // Upload the file with the user ID and file extension
    const { data, error } = await supabase.storage
      .from('czarles')
      .upload('avatars/' + userData.value?.id + '-avatar.png', file, {
        cacheControl: '3600',
        upsert: true,
      })

    // Check if it has error
    if (error) {
      return { error }
    }
    // If no error set data to userData state with the image_url
    else if (data) {
      // Retrieve Image Public Url
      const { data: imageData } = supabase.storage.from('shirlix').getPublicUrl(data.path)

      // Update the user information with the new image_url
      return await updateUserInformation({ ...userData.value, image_url: imageData.publicUrl })
    }
  }

  // Retrieve User Roles Pages
  async function getAuthPages(name: string) {
    const { data } = await supabase
      .from('user_roles')
      .select('*, pages: user_role_pages (page)')
      .eq('user_role', name)

    console.log('Auth Pages:', data)

    // Set the retrieved data to state
    // if (data && data.length > 0) authPages.value = data[0].pages.map((p) => p.page)
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
