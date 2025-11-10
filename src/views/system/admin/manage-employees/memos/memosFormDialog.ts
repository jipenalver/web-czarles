import { type Memo, type MemoForm, type MemoTableFilter, useMemosStore } from '@/stores/memos'
import { formActionDefault } from '@/utils/helpers/constants'
import { type TableOptions } from '@/utils/helpers/tables'
import { useEmployeesStore } from '@/stores/employees'
import { fileExtract } from '@/utils/helpers/others'
import { onMounted, ref, watch } from 'vue'

export function useMemosFormDialog(
  props: {
    isDialogVisible: boolean
    itemData: Memo | null
    tableOptions: TableOptions
    tableFilters: MemoTableFilter
  },
  emit: (event: 'update:isDialogVisible', value: boolean) => void,
) {
  const memosStore = useMemosStore()
  const employeesStore = useEmployeesStore()

  // States
  const formDataDefault = {
    name: '',
    description: '',
    is_everybody: false,
    file: null as File | null,
    employee_ids: [] as number[],
  }
  const formData = ref<Partial<MemoForm>>({ ...formDataDefault })
  const formAction = ref({ ...formActionDefault })
  const refVForm = ref()
  const isUpdate = ref(false)

  watch(
    () => props.isDialogVisible,
    () => {
      isUpdate.value = props.itemData ? true : false
      formData.value = props.itemData
        ? {
            ...props.itemData,
            employee_ids: props.itemData.employee_memos.map(({ employee_id }) => employee_id),
          }
        : { ...formDataDefault }
    },
  )

  // Actions
  const onFile = async (event: Event) => {
    const { fileObject } = await fileExtract(event)
    formData.value.file = fileObject
  }

  const onFileReset = () => {
    formData.value.file = null
  }

  const onSubmit = async () => {
    formAction.value = { ...formActionDefault, formProcess: true }

    const { data, error } = isUpdate.value
      ? await memosStore.updateMemo(formData.value)
      : await memosStore.addMemo(formData.value)

    if (error) {
      formAction.value = {
        ...formActionDefault,
        formMessage: error.message,
        formStatus: 400,
        formProcess: false,
      }
    } else if (data) {
      formAction.value.formMessage = `Successfully ${isUpdate.value ? 'Updated' : 'Added'} Memo.`

      await memosStore.getMemosTable(props.tableOptions, props.tableFilters)

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
    if (employeesStore.employees.length === 0) await employeesStore.getEmployees()
  })

  // Expose State and Actions
  return {
    formData,
    formAction,
    refVForm,
    isUpdate,
    onFile,
    onFileReset,
    onFormSubmit,
    onFormReset,
    employeesStore,
  }
}
