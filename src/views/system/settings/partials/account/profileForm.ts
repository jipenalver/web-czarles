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

    // try {
    //   formData.value = {
    //     ...formData.value,
    //     postal_zip: preparePostalZip(formData.value.postal_zip, formData.value.country),
    //   }
    //   const { data } = await axios.put('/api/v1/user', formData.value)

    //   formAction.value.formMessage = 'Successfully Updated Profile Information.'

    //   authUserStore.setAuthUserData(data)
    // } catch (error) {
    //   const { message, status } = handleFormError(error)
    //   formAction.value = {
    //     ...formActionDefault,
    //     formMessage: message,
    //     formStatus: status,
    //   }
    // } finally {
    //   formAction.value.formAlert = true
    //   formAction.value.formProcess = false
    // }
  }

  // Trigger Validators
  const onFormSubmit = async () => {
    const { valid } = await refVForm.value.validate()
    if (valid) onSubmit()
  }

  // Expose State and Actions
  return { formData, formAction, refVForm, onFormSubmit }
}
