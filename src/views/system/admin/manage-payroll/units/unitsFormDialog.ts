import { type Unit, type UnitTableFilter, useUnitsStore } from '@/stores/units'
import { formActionDefault } from '@/utils/helpers/constants'
import { type TableOptions } from '@/utils/helpers/tables'
import { ref, watch } from 'vue'

export function useUnitsFormDialog(
  props: {
    isDialogVisible: boolean
    itemData: Unit | null
    tableOptions: TableOptions
    tableFilters: UnitTableFilter
  },
  emit: (event: 'update:isDialogVisible', value: boolean) => void,
) {
  const unitsStore = useUnitsStore()

  // States
  const formDataDefault = {
    name: '',
    description: '',
  }
  const formData = ref<Partial<Unit>>({ ...formDataDefault })
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
      ? await unitsStore.updateUnit(formData.value)
      : await unitsStore.addUnit(formData.value)

    if (error) {
      formAction.value = {
        ...formActionDefault,
        formMessage: error.message,
        formStatus: 400,
        formProcess: false,
      }
    } else if (data) {
      formAction.value.formMessage = `Successfully ${isUpdate.value ? 'Updated' : 'Added'} Unit.`

      await unitsStore.getUnitsTable(props.tableOptions, props.tableFilters)
      await unitsStore.getUnits()

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
