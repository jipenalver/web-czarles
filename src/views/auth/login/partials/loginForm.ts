import { formActionDefault } from '@/utils/helpers/constants'
import { supabase } from '@/utils/supabase'
import { useRouter } from 'vue-router'
import { ref } from 'vue'

export function useLoginForm() {
  const router = useRouter()

  // States
  const formDataDefault = {
    email: '',
    password: '',
  }
  const formData = ref({ ...formDataDefault })
  const formAction = ref({ ...formActionDefault })
  const refVForm = ref()

  // Actions
  const onSubmit = async () => {
    formAction.value = { ...formActionDefault, formProcess: true }

    const { data, error } = await supabase.auth.signInWithPassword(formData.value)

    if (error) {
      formAction.value = {
        ...formActionDefault,
        formMessage: error.message,
        formStatus: error.status as number,
        formAlert: true,
      }
    } else if (data) {
      formAction.value = {
        ...formActionDefault,
        formMessage: 'Successfully Logged Account.',
        formAlert: true,
      }

      router.replace('/dashboard')
    }

    refVForm.value?.reset()
  }

  // Trigger Validators
  const onFormSubmit = async () => {
    const { valid } = await refVForm.value.validate()
    if (valid) onSubmit()
  }

  // Expose State and Actions
  return { formData, formAction, refVForm, onFormSubmit }
}
