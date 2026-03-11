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

    const { data, error } = isUpdate.value
      ? await usersStore.updateUser(formData.value)
      : await usersStore.addUser(formData.value)

    if (error) {
      formAction.value = {
        ...formActionDefault,
        formMessage: error.message,
        formStatus: 400,
        formProcess: false,
      }
    } else if (data) {
      formAction.value.formMessage = `Successfully ${isUpdate.value ? 'Updated' : 'Added'} User.`

      await usersStore.getUsersTable(props.tableOptions)

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
