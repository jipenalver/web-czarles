// 👉 Form Action Utils
type FormAction = {
  formProcess: boolean
  formAlert: boolean
  formStatus: number
  formMessage: string
}
export const formActionDefault: FormAction = {
  formProcess: false,
  formAlert: false,
  formStatus: 200,
  formMessage: '',
}
