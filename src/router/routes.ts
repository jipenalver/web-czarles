// System
import LoginView from '@/views/auth/login/LoginView.vue'
// import RegisterView from '@/views/auth/register/RegisterView.vue'
import ForbiddenView from '@/views/errors/ForbiddenView.vue'
import NotFoundView from '@/views/errors/NotFoundView.vue'
import UserRolesView from '@/views/system/admin/manage-users/UserRolesView.vue'
import UsersView from '@/views/system/admin/manage-users/UsersView.vue'
import DashboardView from '@/views/system/dashboard/DashboardView.vue'
import EmployeesView from '@/views/system/admin/manage-employees/EmployeesView.vue'
import RatesBenefitsView from '@/views/system/admin/manage-employees/RatesBenefitsView.vue'
import AttendanceView from '@/views/system/admin/manage-attendance/AttendanceView.vue'
import LeaveView from '@/views/system/admin/manage-attendance/LeaveView.vue'
import OvertimeView from '@/views/system/admin/manage-attendance/OvertimeView.vue'
import AddonsView from '@/views/system/admin/manage-payroll/AddonsView.vue'
import CashAdvancesView from '@/views/system/admin/manage-payroll/CashAdvancesView.vue'
import PayrollView from '@/views/system/admin/manage-payroll/PayrollView.vue'
import SettingsView from '@/views/system/settings/SettingsView.vue'
// Website
import HomeView from '@/views/landing/HomeView.vue'
import PrivacyPolicyView from '@/views/landing/legal/PrivacyPolicyView.vue'
import TermsConditionsView from '@/views/landing/legal/TermsConditionsView.vue'
import AboutView from '@/views/landing/AboutView.vue'
import CompanyView from '@/views/landing/CompanyView.vue'
import ContactView from '@/views/landing/ContactView.vue'

export const routes = [
  // Landing
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: { requiresAuth: false },
  },
  {
    path: '/privacy-policy',
    name: 'privacy-policy',
    component: PrivacyPolicyView,
    meta: { requiresAuth: false },
  },
  {
    path: '/terms-and-conditions',
    name: 'terms-and-conditions',
    component: TermsConditionsView,
    meta: { requiresAuth: false },
  },
  {
    path: '/about',
    name: 'about',
    component: AboutView,
    meta: { requiresAuth: false },
  },
  {
    path: '/company',
    name: 'company',
    component: CompanyView,
    meta: { requiresAuth: false },
  },
  {
    path: '/contact',
    name: 'contact',
    component: ContactView,
    meta: { requiresAuth: false },
  },

  // Auth
  {
    path: '/login',
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
    component: RatesBenefitsView,
    meta: { requiresAuth: true },
  },

  // Attendance
  {
    path: '/hrms/attendance/list',
    name: 'hrms-attendance-list',
    component: AttendanceView,
    meta: { requiresAuth: true },
  },
  {
    path: '/hrms/attendance/leave',
    name: 'hrms-attendance-leave',
    component: LeaveView,
    meta: { requiresAuth: true },
  },
  {
    path: '/hrms/attendance/overtime',
    name: 'hrms-attendance-overtime',
    component: OvertimeView,
    meta: { requiresAuth: true },
  },

  // Payroll
  {
    path: '/hrms/payroll/addons',
    name: 'hrms-payroll-addons',
    component: AddonsView,
    meta: { requiresAuth: true },
  },
  {
    path: '/hrms/payroll/advance',
    name: 'hrms-payroll-advance',
    component: CashAdvancesView,
    meta: { requiresAuth: true },
  },
  {
    path: '/hrms/payroll/list',
    name: 'hrms-payroll-list',
    component: PayrollView,
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
