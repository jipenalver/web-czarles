import LoginView from '@/views/auth/login/LoginView.vue'
// import RegisterView from '@/views/auth/register/RegisterView.vue'
import ForbiddenView from '@/views/errors/ForbiddenView.vue'
import NotFoundView from '@/views/errors/NotFoundView.vue'
import UserRolesView from '@/views/system/admin/manage-users/UserRolesView.vue'
import UsersView from '@/views/system/admin/manage-users/UsersView.vue'
import DashboardView from '@/views/system/dashboard/DashboardView.vue'
import EmployeesView from '@/views/system/admin/manage-employees/EmployeesView.vue'
import BenefitsRatesView from '@/views/system/admin/manage-employees/BenefitsRatesView.vue'
import SettingsView from '@/views/system/settings/SettingsView.vue'

export const routes = [
  // Landing
  {
    path: '/',
    name: 'login',
    component: LoginView,
    meta: { requiresAuth: false },
  },
  // {
  //   path: '/register',
  //   name: 'register',
  //   component: RegisterView,
  //   meta: { requiresAuth: false },
  // },

  // System
  {
    path: '/dashboard',
    name: 'dashboard',
    component: DashboardView,
    meta: { requiresAuth: true, isDefault: true },
  },
  {
    path: '/settings/:tab?',
    name: 'settings',
    component: SettingsView,
    meta: { requiresAuth: true, isDefault: true },
  },

  // Users
  {
    path: '/admin/users/roles',
    name: 'admin-users-roles',
    component: UserRolesView,
    meta: { requiresAuth: true },
  },
  {
    path: '/admin/users/list',
    name: 'admin-users-list',
    component: UsersView,
    meta: { requiresAuth: true },
  },

  // Employees
  {
    path: '/hrms/employees/list',
    name: 'hrms-employees-list',
    component: EmployeesView,
    meta: { requiresAuth: true },
  },
  {
    path: '/hrms/employees/benefits',
    name: 'hrms-employees-benefits',
    component: BenefitsRatesView,
    meta: { requiresAuth: true },
  },

  // Errors Pages
  {
    path: '/forbidden',
    name: 'forbidden',
    component: ForbiddenView,
    meta: { isDefault: true },
  },
  {
    path: '/:catchAll(.*)',
    name: 'not-found',
    component: NotFoundView,
    meta: { isDefault: true },
  },
]
