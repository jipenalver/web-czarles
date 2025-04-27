import { formActionDefault } from '@/utils/helpers/constants'
import { ref } from 'vue'

export function usePasswordForm() {
  const formDataDefault = {
    password_current: '',
    password: '',
    password_confirmation: '',
  }
  const formData = ref({ ...formDataDefault })
  const formAction = ref({ ...formActionDefault })
  const refVForm = ref()

  const onSubmit = async () => {
    formAction.value = { ...formActionDefault, formProcess: true }

    // try {
    //   await axios.put('/api/v1/user/password', formData.value)

    //   formAction.value.formMessage = 'Successfully Updated Password.'
    // } catch (error) {
    //   const { message, status } = handleFormError(error)
    //   formAction.value = {
    //     ...formActionDefault,
    //     formMessage: message,
    //     formStatus: status,
    //   }
    // } finally {
    //   refVForm.value?.reset()
    //   formAction.value.formAlert = true
    //   formAction.value.formProcess = false
    // }
  }

  const onFormSubmit = async () => {
    const { valid } = await refVForm.value.validate()
    if (valid) onSubmit()
  }

  // Expose State and Actions
  return { formData, formAction, refVForm, onFormSubmit }
}
