// 👉 Navigation Types
export type MainNavigation = [string, string]
export type SubNavigation = [string, string, string, string]

// 👉 ADMINISTRATOR; Main Navigation; Title, Icon
export const adminNav: MainNavigation[] = [
  ['Users Management', 'mdi-account-box-multiple'],
  ['Employee Management', 'mdi-account-star'],
  ['Attendance Management', 'mdi-clock'],
  ['Payroll Management', 'mdi-cash'],
]

// 👉 ADMINISTRATOR; Sub Navigation; Title, Icon, Subtitle, Redirect Path;
export const adminItemsNav1: SubNavigation[] = [
  ['User Roles', 'mdi-tag-multiple', 'Add and Manage Roles', '/admin/users/roles'],
  ['List of Users', 'mdi-list-box', 'Add and Manage Users', '/admin/users/list'],
]
export const adminItemsNav2: SubNavigation[] = [
  ['Employee Information', 'mdi-account-multiple', '', '/hrms/employees/list'],
  ['Rates & Benefits', 'mdi-cash-clock', '', '/hrms/employees/benefits'],
]
export const adminItemsNav3: SubNavigation[] = [
  ['Attendance', 'mdi-clock-in', '', '/hrms/attendance/list'],
  ['Leave Application', 'mdi-account-arrow-left', '', '/hrms/attendance/leave'],
  ['Overtime Application', 'mdi-clock-plus', '', '/hrms/attendance/overtime'],
]
export const adminItemsNav4: SubNavigation[] = [
  ['Payroll', 'mdi-account-cash', '', '/hrms/payroll/list'],
]

// 👉 Settings Navigation; Title, Icon, Subtitle, Redirect Path
export const settingsItemsNav: SubNavigation[] = [
  ['Account', 'mdi-account', '', '/settings/account'],
  ['Security', 'mdi-lock', '', '/settings/security'],
]
