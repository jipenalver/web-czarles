// 👉 Navigation Types
export type MainNavigation = [string, string]
export type SubNavigation = [string, string, string, string]

// 👉 ADMINISTRATOR; Main Navigation; Title, Icon
export const adminNav: MainNavigation[] = [
  ['Users Management', 'mdi-account-box-multiple'],
  // ['Subscribers', 'mdi-account-star'],
  // ['Management', 'mdi-cog'],
]

// 👉 ADMINISTRATOR; Sub Navigation; Title, Icon, Subtitle, Redirect Path;
export const adminItemsNav1: SubNavigation[] = [
  ['User Roles', 'mdi-tag-multiple', 'Add and Manage Roles', '/admin/users/roles'],
  ['List of Users', 'mdi-list-box', 'Add and Manage Users', '/admin/users/list'],
]
// export const adminItemsNav2: SubNavigation[] = [
//   ['Subscribers Status', 'mdi-account-multiple', '', '/admin/subscribers/status'],
//   ['Deleted Status', 'mdi-account-alert', '', '/admin/subscribers/deleted'],
// ]
// export const adminItemsNav3: SubNavigation[] = [
//   ['Announcement', 'mdi-bullhorn', '', '/admin/management/announcement'],
//   ['Terms & Conditions', 'mdi-file-edit', '', '/admin/management/terms-conditions'],
//   ['Privacy Policy', 'mdi-file-edit', '', '/admin/management/privacy-policy'],
//   ['Media Copyright', 'mdi-file-edit', '', '/admin/management/media-copyright'],
//   ['Footer Copyright', 'mdi-file-edit', '', '/admin/management/footer-copyright'],
// ]

// 👉 USER; Main Navigation; Title, Icon, Subtitle, Redirect Path;
// export const userNav: SubNavigation[] = [
//   ['Journal', 'mdi-calendar', '', '/journal'],
//   ['Groups', 'mdi-account-group', '', '/groups'],
// ]

// 👉 Settings Navigation; Title, Icon, Subtitle, Redirect Path
export const settingsItemsNav: SubNavigation[] = [
  ['Account', 'mdi-account', '', '/settings/account'],
  ['Security', 'mdi-lock', '', '/settings/security'],
]
