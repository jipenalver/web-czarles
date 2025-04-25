import { type UserRole, useUserRolesStore } from '@/stores/userRoles'
import { formActionDefault } from '@/utils/helpers/constants'
import { onMounted, ref } from 'vue'
// import axios from 'axios'

export function useUserRolesList() {
  const userRolesStore = useUserRolesStore()

  // States
  const isDialogVisible = ref(false)
  const isConfirmDeleteDialog = ref(false)
  const deleteId = ref<number>(0)
  const itemData = ref<UserRole | null>(null)
  const formAction = ref({ ...formActionDefault })

  // Actions
  const onAdd = () => {
    itemData.value = null
    isDialogVisible.value = true
  }

  const onUpdate = (item: UserRole) => {
    itemData.value = item
    isDialogVisible.value = true
  }

  const onDelete = (id: number) => {
    deleteId.value = id
    isConfirmDeleteDialog.value = true
  }

  const onConfirmDelete = async () => {
    formAction.value = { ...formActionDefault, formProcess: true }

    // try {
    //   await axios.delete('/api/v1/user-roles/' + deleteId.value)

    //   formAction.value.formMessage = 'Successfully Deleted User Role.'

    //   await userRolesStore.getUserRoles()
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

  onMounted(async () => {
    if (userRolesStore.userRolesList.length === 0) await userRolesStore.getUserRoles()
  })

  // Expose State and Actions
  return {
    isDialogVisible,
    isConfirmDeleteDialog,
    itemData,
    formAction,
    onAdd,
    onUpdate,
    onDelete,
    onConfirmDelete,
    userRolesStore,
  }
}
