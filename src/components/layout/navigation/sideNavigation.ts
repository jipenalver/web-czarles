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
  ['Employee Memos', 'mdi-file-account', '', '/hrms/employees/memos'],
]
export const adminItemsNav3: SubNavigation[] = [
  ['Attendance', 'mdi-clock-in', '', '/hrms/attendance/list'],
  ['Leave Requests', 'mdi-account-arrow-left-outline', '', '/hrms/attendance/leave-requests'],
  ['Leave Application', 'mdi-account-arrow-left', '', '/hrms/attendance/leave'],
  ['Overtime Requests', 'mdi-clock-plus-outline', '', '/hrms/attendance/overtime-requests'],
  ['Overtime Application', 'mdi-clock-plus', '', '/hrms/attendance/overtime'],
]
export const adminItemsNav4: SubNavigation[] = [
  ['Supplemental', 'mdi-cash-multiple', '', '/hrms/payroll/supplemental'],
  ['Cash Advance Requests', 'mdi-cash-sync', '', '/hrms/payroll/advance-requests'],
  ['Cash Advance', 'mdi-cash-refund', '', '/hrms/payroll/advance'],
  ['Payroll', 'mdi-account-cash', '', '/hrms/payroll/list'],
]

// 👉 Settings Navigation; Title, Icon, Subtitle, Redirect Path
export const settingsItemsNav: SubNavigation[] = [
  ['Account', 'mdi-account', '', '/settings/account'],
  ['Security', 'mdi-lock', '', '/settings/security'],
]
