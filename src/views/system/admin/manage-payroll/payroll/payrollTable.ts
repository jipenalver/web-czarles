import { type Holiday, useHolidaysStore } from '@/stores/holidays'
import { formActionDefault } from '@/utils/helpers/constants'
import { type TableOptions } from '@/utils/helpers/tables'
import { ref, watch } from 'vue'

export function usePayrollTable(props: { isDialogVisible: boolean; itemId?: number }) {
  const holidaysStore = useHolidaysStore()

  // States
  const tableOptions = ref({
    page: 1,
    itemsPerPage: -1,
    sortBy: [],
    isLoading: false,
  })
  const tableFilters = ref({
    year: new Date().getFullYear().toString(),
  })
  const isDialogVisible = ref(false)
  const itemData = ref<Holiday | null>(null)
  const formAction = ref({ ...formActionDefault })

  watch(
    () => props.isDialogVisible,
    () => {},
  )

  // Actions
  const onView = () => {
    itemData.value = null
    isDialogVisible.value = true
  }

  const onFilterItems = () => {
    onLoadItems(tableOptions.value)
  }

  const onLoadItems = async ({ page, itemsPerPage, sortBy }: TableOptions) => {
    tableOptions.value.isLoading = true

    await holidaysStore.getHolidaysTable({ page, itemsPerPage, sortBy }, tableFilters.value)

    tableOptions.value.isLoading = false
  }

  // Expose State and Actions
  return {
    tableOptions,
    tableFilters,
    isDialogVisible,
    itemData,
    formAction,
    onView,
    onFilterItems,
    onLoadItems,
    holidaysStore,
  }
}
