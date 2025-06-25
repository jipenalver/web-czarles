import { useHolidaysStore, type Holiday, type HolidayTableFilter } from '@/stores/holidays'
import { formActionDefault } from '@/utils/helpers/constants'
import { type TableOptions } from '@/utils/helpers/tables'
import { ref, watch } from 'vue'

export function useDesignationsFormDialog(
  props: {
    isDialogVisible: boolean
    itemData: Holiday | null
    tableOptions: TableOptions
    tableFilters: HolidayTableFilter
  },
  emit: (event: 'update:isDialogVisible', value: boolean) => void,
) {
  const holidaysStore = useHolidaysStore()

  // States
  const formDataDefault = {
    name: '',
    type: '',
    description: '',
    holiday_at: '',
  }
  const formData = ref<Partial<Holiday>>({ ...formDataDefault })
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
      ? await holidaysStore.updateHoliday(formData.value)
      : await holidaysStore.addHoliday(formData.value)

    if (error) {
      formAction.value = {
        ...formActionDefault,
        formMessage: error.message,
        formStatus: 400,
        formProcess: false,
      }
    } else if (data) {
      formAction.value.formMessage = `Successfully ${isUpdate.value ? 'Updated' : 'Added'} Holiday.`

      await holidaysStore.getHolidaysTable(props.tableOptions, props.tableFilters)
      await holidaysStore.getHolidays()

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
