import LoginView from '@/views/auth/login/LoginView.vue'
import RegisterView from '@/views/auth/register/RegisterView.vue'

export const routes = [
  // Landing
  {
    path: '/',
    name: 'login',
    component: LoginView,
    meta: { requiresAuth: false },
  },
  {
    path: '/register',
    name: 'register',
    component: RegisterView,
    meta: { requiresAuth: false },
  },
  // {
  //   path: '/password/forgot',
  //   name: 'password-forgot',
  //   component: ForgotPasswordView,
  //   meta: { requiresAuth: false }
  // },
  // {
  //   path: '/password/reset/:token',
  //   name: 'password-reset',
  //   component: ResetPasswordView,
  //   meta: { requiresAuth: false }
  // },

  // System
  // {
  //   path: '/dashboard',
  //   name: 'dashboard',
  //   component: DashboardView,
  //   meta: { requiresAuth: true, isDefault: true }
  // },
  // {
  //   path: '/settings/:tab?',
  //   name: 'settings',
  //   component: SettingsView,
  //   meta: { requiresAuth: true, isDefault: true }
  // },

  // Users
  // {
  //   path: '/admin/users/roles',
  //   name: 'admin-users-roles',
  //   component: UserRolesView,
  //   meta: { requiresAuth: true }
  // },
  // {
  //   path: '/admin/users/list',
  //   name: 'admin-users-list',
  //   component: UsersView,
  //   meta: { requiresAuth: true }
  // },

  // Errors Pages
  // {
  //   path: '/forbidden',
  //   name: 'forbidden',
  //   component: ForbiddenView,
  //   meta: { isDefault: true },
  // },
  // {
  //   path: '/:catchAll(.*)',
  //   name: 'not-found',
  //   component: NotFoundView,
  //   meta: { isDefault: true },
  // },
]
