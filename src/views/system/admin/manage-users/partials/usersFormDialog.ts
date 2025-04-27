import { type AdminUser, useUsersStore } from '@/stores/users'
import { formActionDefault } from '@/utils/helpers/constants'
import { type TableOptions } from '@/utils/helpers/tables'
import { useUserRolesStore } from '@/stores/userRoles'
import { onMounted, ref, watch } from 'vue'

export function useUsersFormDialog(
  props: {
    isDialogVisible: boolean
    itemData: AdminUser | null
    tableOptions: TableOptions
  },
  emit: (event: 'update:isDialogVisible', value: boolean) => void,
) {
  const userRolesStore = useUserRolesStore()
  const usersStore = useUsersStore()

  // States
  const formDataDefault = {
    email: '',
    password: '',
    firstname: '',
    middlename: '',
    lastname: '',
    phone: '',
    user_role: null,
  }
  const formData = ref<Partial<AdminUser>>({ ...formDataDefault })
  const formAction = ref({ ...formActionDefault })
  const refVForm = ref()
  const isUpdate = ref(false)

  watch(
    () => props.isDialogVisible,
    () => {
      isUpdate.value = props.itemData ? true : false
      formData.value = props.itemData ? { ...props.itemData } : { ...formDataDefault }
    },
  )

  // Actions
  const onSubmit = async () => {
    formAction.value = { ...formActionDefault, formProcess: true }

    // try {
    //   if (isUpdate.value) await axios.put('/api/v1/users/' + formData.value.id, formData.value)
    //   else await axios.post('/api/v1/users', formData.value)

    //   formAction.value.formMessage = `Successfully ${isUpdate.value ? 'Updated' : 'Added'} Users.`

    //   await usersStore.getUsersTable(props.tableOptions)
    //   await userRolesStore.getUserRoles()

    //   setTimeout(() => {
    //     onFormReset()
    //   }, 1500)
    // } catch (error) {
    //   const { message, status } = handleFormError(error)
    //   formAction.value = {
    //     ...formActionDefault,
    //     formMessage: message,
    //     formStatus: status,
    //   }
    // } finally {
    //   formAction.value.formAlert = true
    // }
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

  onMounted(async () => {
    if (userRolesStore.userRoles.length === 0) await userRolesStore.getUserRoles()
  })

  // Expose State and Actions
  return {
    formData,
    formAction,
    refVForm,
    isUpdate,
    onFormSubmit,
    onFormReset,
    userRolesStore,
  }
}
