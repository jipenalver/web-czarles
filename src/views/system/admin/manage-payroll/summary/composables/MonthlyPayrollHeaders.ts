import { type TableHeader } from '@/utils/helpers/tables'

export const tableHeaders: TableHeader[] = [
  {
    title: 'Employee',
    key: 'employee_name',
    align: 'start',
    sortable: true,
  },
  {
    title: 'Daily Rate',
    key: 'daily_rate',
    align: 'end',
    sortable: true,
  },
  {
    title: 'Days Worked',
    key: 'days_worked',
    align: 'center',
    sortable: true,
  },
  {
    title: 'Basic Pay',
    key: 'basic_pay',
    align: 'end',
    sortable: true,
  },
  {
    title: 'Overtime',
    key: 'overtime_pay',
    align: 'end',
    sortable: true,
  },
  {
    title: 'Trips',
    key: 'trips_pay',
    align: 'end',
    sortable: true,
  },
  {
    title: 'Holidays',
    key: 'holidays_pay',
    align: 'end',
    sortable: true,
  },
  {
    title: 'Gross Pay',
    key: 'gross_pay',
    align: 'end',
    sortable: true,
  },
  {
    title: 'Deductions',
    key: 'deductions',
    align: 'end',
    sortable: false,
  },
  {
    title: 'Net Pay',
    key: 'net_pay',
    align: 'end',
    sortable: true,
  },
]
