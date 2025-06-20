import { type Area, type AreaTableFilter, useAreasStore } from '@/stores/areas'
import { formActionDefault } from '@/utils/helpers/constants'
import { type TableOptions } from '@/utils/helpers/tables'
import { ref, watch } from 'vue'

export function useAreasFormDialog(
  props: {
    isDialogVisible: boolean
    itemData: Area | null
    tableOptions: TableOptions
    tableFilters: AreaTableFilter
  },
  emit: (event: 'update:isDialogVisible', value: boolean) => void,
) {
  const areasStore = useAreasStore()

  // States
  const formDataDefault = {
    area: '',
    description: '',
  }
  const formData = ref<Partial<Area>>({ ...formDataDefault })
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
      ? await areasStore.updateArea(formData.value)
      : await areasStore.addArea(formData.value)

    if (error) {
      formAction.value = {
        ...formActionDefault,
        formMessage: error.message,
        formStatus: 400,
        formProcess: false,
      }
    } else if (data) {
      formAction.value.formMessage = `Successfully ${isUpdate.value ? 'Updated' : 'Added'} Area.`

      await areasStore.getAreasTable(props.tableOptions, props.tableFilters)
      await areasStore.getAreas()

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

  // Expose State and Actions
  return {
    formData,
    formAction,
    refVForm,
    isUpdate,
    onFormSubmit,
    onFormReset,
  }
}
