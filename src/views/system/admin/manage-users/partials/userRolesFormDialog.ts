import { type UserRole, useUserRolesStore } from '@/stores/userRoles'
import { formActionDefault } from '@/utils/helpers/constants'
import { ref, watch } from 'vue'

export function useUserRolesFormDialog(
  props: {
    isDialogVisible: boolean
    itemData: UserRole | null
  },
  emit: (event: 'update:isDialogVisible', value: boolean) => void,
) {
  const userRolesStore = useUserRolesStore()

  // States
  const formDataDefault = {
    user_role: '',
    description: '',
    pages: [],
  }
  const formData = ref<Partial<UserRole>>({ ...formDataDefault })
  const formAction = ref({ ...formActionDefault })
  const refVForm = ref()
  const isUpdate = ref(false)

  watch(
    () => props.isDialogVisible,
    () => {
      isUpdate.value = props.itemData ? true : false
      formData.value = props.itemData
        ? {
            ...props.itemData,
            pages: props.itemData.user_role_pages.map((item) => item.page),
          }
        : { ...formDataDefault }
    },
  )

  // Actions
  const onSubmit = async () => {
    formAction.value = { ...formActionDefault, formProcess: true }

    if (formData.value.pages?.length === 0) {
      formAction.value = {
        ...formActionDefault,
        formMessage: 'Please select at least 1 page.',
        formStatus: 400,
        formAlert: true,
      }
      return
    }

    const { data, error } = isUpdate.value
      ? await userRolesStore.updateUserRole(formData.value)
      : await userRolesStore.addUserRole(formData.value)

    if (error) {
      formAction.value = {
        ...formActionDefault,
        formMessage: error.message,
        formStatus: 400,
        formProcess: false,
      }
    } else if (data) {
      formAction.value.formMessage = `Successfully ${isUpdate.value ? 'Updated' : 'Added'} User Role and its Pages.`

      await userRolesStore.getUserRoles()

      setTimeout(() => {
        onFormReset()
      }, 1500)
    }

    formAction.value.formAlert = true
  }

  // Trigger Validators
  const onFormSubmit = async () => {
    const { valid } = await refVForm.value.validate()
    if (valid) onSubmit()
  }

  const onFormReset = () => {
    formAction.value = { ...formActionDefault }
    formData.value = { ...formDataDefault }
    emit('update:isDialogVisible', false)
  }

  // Expose State and Actions
  return {
    formData,
    formAction,
    refVForm,
    isUpdate,
    onFormSubmit,
    onFormReset,
  }
}
