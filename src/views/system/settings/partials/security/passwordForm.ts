import { formActionDefault } from '@/utils/helpers/constants'
import { useAuthUserStore } from '@/stores/authUser'
import { supabase } from '@/utils/supabase'
import { ref } from 'vue'

export function usePasswordForm() {
  const authUserStore = useAuthUserStore()

  // States
  const formDataDefault = {
    password: '',
    password_confirmation: '',
  }
  const formData = ref({ ...formDataDefault })
  const formAction = ref({ ...formActionDefault })
  const refVForm = ref()

  // Actions
  const onSubmit = async () => {
    formAction.value = { ...formActionDefault, formProcess: true }

    const { data, error } = await supabase.auth.updateUser({ password: formData.value.password })

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
        formMessage: 'Successfully Updated Password.',
        formAlert: true,
      }

      if (!authUserStore.userData?.is_admin)
        await supabase.auth.updateUser({ data: { password: formData.value.password } })
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
