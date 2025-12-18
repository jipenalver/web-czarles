import { ref } from 'vue'
import { generateCSV, getMoneyText, prepareCSV } from '@/utils/helpers/others'
import { getDateISO } from '@/utils/helpers/dates'
import { roundDecimal } from '@/views/system/admin/manage-payroll/payroll/helpers'
import type { MonthlyPayrollRow } from './types'

export function useMonthlyPayrollCSV() {
  const isExporting = ref(false)

  const generatePayrollCSV = (
    data: MonthlyPayrollRow[],
    selectedMonth: string,
    selectedYear: number,
    crossMonthEnabled?: boolean,
    dayFrom?: number | null,
    dayTo?: number | null,
  ) => {
    if (!data.length) {
      console.warn('No data to export')
      return
    }

    isExporting.value = true

    try {
      // Generate filename
      const dateString = crossMonthEnabled && dayFrom && dayTo
        ? `${selectedMonth}_${selectedYear}_${dayFrom}-${dayTo}`
        : `${selectedMonth}_${selectedYear}`
      const filename = `${getDateISO(new Date())}-monthly-payroll-${dateString.toLowerCase()}`

      // Define CSV headers to match the table structure exactly
      const csvHeaders = [
        'Employee Name',
        'No. of Days Work / Hours',
        'Sunday Rate - Days',
        'Sunday Rate - Amount',
        'Allowance',
        'Overtime - HRS',
        'Overtime - Amount',
        'Holiday Pay',
        'Monthly Tripping',
        'Utilization',
        'Others - Benefits',
        'Others - Adjustments',
        'Gross Pay',
        'Total C/A',
        'SSS',
        'PHIC',
        'Pag-IBIG',
        'SSS Loan',
        'Others - Late',
        'Others - Undertime',
        'Others - Savings',
        'Others - Adjustments',
        'Total Deductions',
        'Net Pay',
      ].join(',')

      // Generate CSV rows to match the table structure exactly
      const csvRows = data.map((item) => {
        // Use effective_days_worked similar to the table component
        const effectiveDaysWorked = (item.days_worked_calculated ?? item.days_worked) || 0

        const csvData = [
          prepareCSV(item.employee_name),
          prepareCSV(roundDecimal(effectiveDaysWorked, 2).toString()),
          prepareCSV((item.sunday_days || 0).toString()),
          prepareCSV(getMoneyText(item.sunday_amount || 0)),
          prepareCSV(getMoneyText(item.allowance || 0)),
          prepareCSV(roundDecimal(item.overtime_hrs || 0, 2).toString()),
          prepareCSV(getMoneyText(item.overtime_pay || 0)),
          prepareCSV(getMoneyText(item.holidays_pay || 0)),
          prepareCSV(getMoneyText(item.trips_pay || 0)),
          prepareCSV(getMoneyText(item.utilizations_pay || 0)),
          prepareCSV(getMoneyText(item.benefits_pay || 0)),
          prepareCSV(getMoneyText(item.cash_adjustment_addon || 0)),
          prepareCSV(getMoneyText(item.gross_pay || 0)),
          prepareCSV(getMoneyText(item.deductions.cash_advance || 0)),
          prepareCSV(getMoneyText(item.deductions.sss || 0)),
          prepareCSV(getMoneyText(item.deductions.phic || 0)),
          prepareCSV(getMoneyText(item.deductions.pagibig || 0)),
          prepareCSV(getMoneyText(item.deductions.sss_loan || 0)),
          prepareCSV(getMoneyText(item.deductions.late || 0)),
          prepareCSV(getMoneyText(item.deductions.undertime || 0)),
          prepareCSV(getMoneyText((item.deductions.savings || 0) + (item.deductions.salary_deposit || 0))),
          prepareCSV(getMoneyText(item.deductions.cash_adjustment || 0)),
          prepareCSV(getMoneyText(item.total_deductions || 0)),
          prepareCSV(getMoneyText(item.net_pay || 0)),
        ]

        return csvData.join(',')
      })

      // Calculate totals to match table structure
      const totals = data.reduce(
        (acc, item) => {
          // Use effective_days_worked for consistency with table
          const effectiveDaysWorked = (item.days_worked_calculated ?? item.days_worked) || 0

          return {
            days_worked: acc.days_worked + effectiveDaysWorked,
            sunday_days: acc.sunday_days + (item.sunday_days || 0),
            sunday_amount: acc.sunday_amount + (item.sunday_amount || 0),
            allowance: acc.allowance + (item.allowance || 0),
            overtime_hrs: acc.overtime_hrs + (item.overtime_hrs || 0),
            overtime_amount: acc.overtime_amount + (item.overtime_pay || 0),
            holidays_pay: acc.holidays_pay + (item.holidays_pay || 0),
            trips_pay: acc.trips_pay + (item.trips_pay || 0),
            utilizations_pay: acc.utilizations_pay + (item.utilizations_pay || 0),
            benefits_pay: acc.benefits_pay + (item.benefits_pay || 0),
            cash_adjustment_addon: acc.cash_adjustment_addon + (item.cash_adjustment_addon || 0),
            gross_pay: acc.gross_pay + (item.gross_pay || 0),
            cash_advance: acc.cash_advance + (item.deductions.cash_advance || 0),
            sss: acc.sss + (item.deductions.sss || 0),
            phic: acc.phic + (item.deductions.phic || 0),
            pagibig: acc.pagibig + (item.deductions.pagibig || 0),
            sss_loan: acc.sss_loan + (item.deductions.sss_loan || 0),
            savings: acc.savings + (item.deductions.savings || 0),
            salary_deposit: acc.salary_deposit + (item.deductions.salary_deposit || 0),
            late: acc.late + (item.deductions.late || 0),
            undertime: acc.undertime + (item.deductions.undertime || 0),
            cash_adjustment_deduction: acc.cash_adjustment_deduction + (item.deductions.cash_adjustment || 0),
            total_deductions: acc.total_deductions + (item.total_deductions || 0),
            net_pay: acc.net_pay + (item.net_pay || 0),
          }
        },
        {
          days_worked: 0,
          sunday_days: 0,
          sunday_amount: 0,
          allowance: 0,
          overtime_hrs: 0,
          overtime_amount: 0,
          holidays_pay: 0,
          trips_pay: 0,
          utilizations_pay: 0,
          benefits_pay: 0,
          cash_adjustment_addon: 0,
          gross_pay: 0,
          cash_advance: 0,
          sss: 0,
          phic: 0,
          pagibig: 0,
          sss_loan: 0,
          savings: 0,
          salary_deposit: 0,
          late: 0,
          undertime: 0,
          cash_adjustment_deduction: 0,
          total_deductions: 0,
          net_pay: 0,
        },
      )

      // Add totals row to match the new structure exactly
      const totalRow = [
        prepareCSV('TOTAL'),
        prepareCSV(roundDecimal(totals.days_worked, 2).toString()),
        prepareCSV(totals.sunday_days.toString()),
        prepareCSV(getMoneyText(totals.sunday_amount)),
        prepareCSV(getMoneyText(totals.allowance)),
        prepareCSV(roundDecimal(totals.overtime_hrs, 2).toString()),
        prepareCSV(getMoneyText(totals.overtime_amount)),
        prepareCSV(getMoneyText(totals.holidays_pay)),
        prepareCSV(getMoneyText(totals.trips_pay)),
        prepareCSV(getMoneyText(totals.utilizations_pay)),
        prepareCSV(getMoneyText(totals.benefits_pay)),
        prepareCSV(getMoneyText(totals.cash_adjustment_addon)),
        prepareCSV(getMoneyText(totals.gross_pay)),
        prepareCSV(getMoneyText(totals.cash_advance)),
        prepareCSV(getMoneyText(totals.sss)),
        prepareCSV(getMoneyText(totals.phic)),
        prepareCSV(getMoneyText(totals.pagibig)),
        prepareCSV(getMoneyText(totals.sss_loan)),
        prepareCSV(getMoneyText(totals.late)),
        prepareCSV(getMoneyText(totals.undertime)),
        prepareCSV(getMoneyText(totals.savings + totals.salary_deposit)),
        prepareCSV(getMoneyText(totals.cash_adjustment_deduction)),
        prepareCSV(getMoneyText(totals.total_deductions)),
        prepareCSV(getMoneyText(totals.net_pay)),
      ].join(',')

      // Generate final CSV data
      const csvData = [csvHeaders, ...csvRows, totalRow].join('\n')

      // Generate and download CSV
      generateCSV(filename, csvData)

      console.log(`CSV exported successfully: ${filename}.csv`)

    } catch (error) {
      console.error('Error generating CSV:', error)
    } finally {
      isExporting.value = false
    }
  }

  return {
    isExporting,
    generatePayrollCSV,
  }
}
