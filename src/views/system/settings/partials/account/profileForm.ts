import { formActionDefault } from '@/utils/helpers/constants'
import { useAuthUserStore } from '@/stores/authUser'
import { ref } from 'vue'

export function useProfileForm() {
  const authUserStore = useAuthUserStore()

  // States
  const formDataDefault = {
    firstname: authUserStore.userData?.firstname,
    middlename: authUserStore.userData?.middlename,
    lastname: authUserStore.userData?.lastname,
    email: authUserStore.userData?.email,
    phone: authUserStore.userData?.phone,
  }
  const formData = ref({ ...formDataDefault })
  const formAction = ref({ ...formActionDefault })
  const refVForm = ref()

  // Actions
  const onSubmit = async () => {
    formAction.value = { ...formActionDefault, formProcess: true }

    const { data, error } = await authUserStore.updateUserInformation(formData.value)

    if (error) {
      formAction.value = {
        ...formActionDefault,
        formMessage: error.message,
        formStatus: 400,
        formAlert: true,
      }
    } else if (data) {
      formAction.value = {
        ...formActionDefault,
        formMessage: 'Successfully Updated Profile Information.',
        formAlert: true,
      }
    }
  }

  // Trigger Validators
  const onFormSubmit = async () => {
    const { valid } = await refVForm.value.validate()
    if (valid) onSubmit()
  }

  // Expose State and Actions
  return { formData, formAction, refVForm, onFormSubmit }
}
