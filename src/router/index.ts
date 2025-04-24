import { createRouter, createWebHistory } from 'vue-router'
import { useAuthUserStore } from '@/stores/authUser'
import { routes } from './routes'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach(async (to) => {
  // Use Pinia Store
  const authUserStore = useAuthUserStore()
  // Load if user is logged in
  const isLoggedIn = await authUserStore.isAuthenticated()

  // If logged in, prevent access to login or register pages
  if (isLoggedIn && (to.name === 'home' || to.name === 'login' || to.name === 'register')) {
    // redirect the user to the dashboard page
    return { name: 'dashboard' }
  }

  // If not logged in, prevent access to system pages
  if (!isLoggedIn && to.meta.requiresAuth) {
    // redirect the user to the login page
    return { name: 'login' }
  }

  // Check if the user is logged in
  if (isLoggedIn) {
    const isSuperAdmin = authUserStore.userRole === 'Super Administrator'

    // Check if user role is not Super Administrator
    if (!isSuperAdmin) {
      if (authUserStore.authPages.length === 0)
        await authUserStore.getAuthPages(authUserStore.userRole as string)

      // Check page that is going to if it is in role pages
      const isAccessible = authUserStore.authPages.includes(to.path)

      // Forbid access if not in role pages and if page is not default page
      if (!isAccessible && !to.meta.isDefault) return { name: 'forbidden' }
    }
  }
})

export default router
