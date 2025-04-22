import { formActionDefault } from '@/utils/helpers/constants'
import { useAuthUserStore } from '@/stores/authUser'
import { useRouter } from 'vue-router'
import { ref } from 'vue'

export function useLoginForm() {
  const router = useRouter()

  // const authUserStore = useAuthUserStore()

  // States
  const formDataDefault = {
    email: '',
    password: '',
    remember: true,
  }
  const formData = ref({ ...formDataDefault })
  const formAction = ref({ ...formActionDefault })
  const refVForm = ref()

  // Actions
  const onSubmit = async () => {
    formAction.value = { ...formActionDefault, formProcess: true }

    // try {
    //   const { data } = await axios.post('/api/v1/auth/login', formData.value)

    //   formAction.value.formMessage = 'Successfully Logged Account.'

    //   authUserStore.setAuthData(data)

    //   if (data.userData.email_verified_at === null) router.replace('/verify/email')
    //   else router.replace('/dashboard')
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

  // Trigger Validators
  const onFormSubmit = async () => {
    const { valid } = await refVForm.value.validate()
    if (valid) onSubmit()
  }

  // Expose State and Actions
  return { formData, formAction, refVForm, onFormSubmit }
}
