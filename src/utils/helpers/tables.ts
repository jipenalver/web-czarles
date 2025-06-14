// 👉 TableHeader
export type TableHeader = {
  title: string
  key: string
  sortable?: boolean
  align: 'start' | 'end' | 'center'
}

// 👉 TableOptions
export type TableOptions = {
  page: number
  itemsPerPage: number
  sortBy: SortBy[]
}

// 👉 SortBy
export type SortBy = {
  key: string
  order: boolean | 'asc' | 'desc'
}

// 👉 Table Pagination
export const tablePagination = (
  { page, itemsPerPage, sortBy }: TableOptions,
  defaultColumn = 'id',
  isAscending = true,
) => {
  const [column, order] =
    sortBy && sortBy[0] ? [sortBy[0].key, sortBy[0].order === 'asc'] : [defaultColumn, isAscending]

  if (itemsPerPage === -1) {
    const rangeStart = 0
    const rangeEnd = 999999999999999

    return { rangeStart, rangeEnd, column, order }
  }

  const rangeStart = (page - 1) * itemsPerPage
  const rangeEnd = rangeStart + itemsPerPage - 1

  return { rangeStart, rangeEnd, column, order }
}

// 👉 Handle Search if null turn to empty string
export const tableSearch = (search: string | null) => {
  return search || ''
}
