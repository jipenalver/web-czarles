import profileDefault from '@/assets/misc/profile-default.jpg'
import { formActionDefault } from '@/utils/helpers/constants'
import { useAuthUserStore } from '@/stores/authUser'
import { fileExtract } from '@/utils/helpers/others'
import { ref } from 'vue'

export function usePictureForm() {
  const authUserStore = useAuthUserStore()

  // States
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

    const { data, error } = await authUserStore.updateUserImage(formData.value.avatar as File)

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
        formMessage: `Successfully Updated Profile Image. ${imgPreview.value !== profileDefault ? 'Image will be updated after 24 hours.' : ''}`,
        formAlert: true,
      }

      await authUserStore.updateUserInformation({
        ...authUserStore.userData,
        avatar: data.publicUrl,
      })
    }

    refVForm.value?.reset()
  }

  // Trigger Validators
  const onFormSubmit = async () => {
    const { valid } = await refVForm.value.validate()
    if (valid) onSubmit()
  }

  // Expose State and Actions
  return { formData, formAction, refVForm, imgPreview, onPreview, onPreviewReset, onFormSubmit }
}
