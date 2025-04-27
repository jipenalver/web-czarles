import profileDefault from '@/assets/misc/profile-default.jpg'
import { formActionDefault } from '@/utils/helpers/constants'
import { useAuthUserStore } from '@/stores/authUser'
import { fileExtract } from '@/utils/helpers/others'
import { ref } from 'vue'

export function usePictureForm() {
  const authUserStore = useAuthUserStore()

  const formDataDefault = {
    avatar: null as File | null,
  }
  const formData = ref({ ...formDataDefault })
  const formAction = ref({ ...formActionDefault })
  const imgPreview = ref(authUserStore.userData?.avatar ?? profileDefault)
  const refVForm = ref()

  // Actions
  const onPreview = async (event: Event) => {
    const { fileObject, fileUrl } = await fileExtract(event)
    formData.value.avatar = fileObject
    imgPreview.value = fileUrl
  }

  const onPreviewReset = () => {
    imgPreview.value = authUserStore.userData?.avatar ?? profileDefault
  }

  const onSubmit = async () => {
    formAction.value = { ...formActionDefault, formProcess: true }

    // try {
    //   const avatarData = new FormData()
    //   avatarData.append('avatar', formData.value.avatar as File)

    //   const { data } = await axios.post('/api/v1/user/avatar', avatarData)

    //   formAction.value.formMessage = 'Successfully Updated Profile Image.'

    //   authUserStore.setAuthUserData(data)
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
  return { formData, formAction, refVForm, imgPreview, onPreview, onPreviewReset, onFormSubmit }
}
