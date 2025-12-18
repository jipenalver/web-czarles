import {
  type Designation,
  type DesignationTableFilter,
  useDesignationsStore,
} from '@/stores/designations'
import { formActionDefault } from '@/utils/helpers/constants'
import { type TableOptions } from '@/utils/helpers/tables'
import { ref, watch } from 'vue'

export function useDesignationsFormDialog(
  props: {
    isDialogVisible: boolean
    itemData: Designation | null
    tableOptions: TableOptions
    tableFilters: DesignationTableFilter
  },
  emit: (event: 'update:isDialogVisible', value: boolean) => void,
) {
  const designationsStore = useDesignationsStore()

  // States
  const formDataDefault = {
    designation: '',
    description: '',
  }
  const formData = ref<Partial<Designation>>({ ...formDataDefault })
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
      ? await designationsStore.updateDesignation(formData.value)
      : await designationsStore.addDesignation(formData.value)

    if (error) {
      formAction.value = {
        ...formActionDefault,
        formMessage: error.message,
        formStatus: 400,
        formProcess: false,
      }
    } else if (data) {
      formAction.value.formMessage = `Successfully ${isUpdate.value ? 'Updated' : 'Added'} Designation.`

      await designationsStore.getDesignationsTable(props.tableOptions, props.tableFilters)
      await designationsStore.getDesignations()

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
