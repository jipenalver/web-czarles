import { type AdminUser, useUsersStore } from '@/stores/users'
import { formActionDefault } from '@/utils/helpers/constants'
import { type TableOptions } from '@/utils/helpers/tables'
import { useAuthUserStore } from '@/stores/authUser'
import { ref } from 'vue'

export function useUsersTable() {
  const authUserStore = useAuthUserStore()
  const usersStore = useUsersStore()

  // States
  const tableOptions = ref({
    page: 1,
    itemsPerPage: 10,
    sortBy: [],
    isLoading: false,
  })
  const isDialogVisible = ref(false)
  const isConfirmDeleteDialog = ref(false)
  const deleteId = ref<string>('')
  const itemData = ref<AdminUser | null>(null)
  const formAction = ref({ ...formActionDefault })

  // Actions
  const onAdd = () => {
    itemData.value = null
    isDialogVisible.value = true
  }

  const onUpdate = (item: AdminUser) => {
    itemData.value = item
    isDialogVisible.value = true
  }

  const onDelete = (id: string) => {
    deleteId.value = id
    isConfirmDeleteDialog.value = true
  }

  const onConfirmDelete = async () => {
    formAction.value = { ...formActionDefault, formProcess: true }

    const { data, error } = await usersStore.deleteUser(deleteId.value)

    if (error) {
      formAction.value.formMessage = error.message
      formAction.value.formStatus = 400
    } else if (data) {
      formAction.value.formMessage = 'Successfully Deleted User.'

      await onLoadItems(tableOptions.value)
    }

    formAction.value.formAlert = true
    formAction.value.formProcess = false
  }

  const onLoadItems = async ({ page, itemsPerPage, sortBy }: TableOptions) => {
    tableOptions.value.isLoading = true

    await usersStore.getUsersTable({ page, itemsPerPage, sortBy })

    tableOptions.value.isLoading = false
  }

  // Expose State and Actions
  return {
    tableOptions,
    isDialogVisible,
    isConfirmDeleteDialog,
    itemData,
    formAction,
    onAdd,
    onUpdate,
    onDelete,
    onConfirmDelete,
    onLoadItems,
    usersStore,
    authUserStore,
  }
}
