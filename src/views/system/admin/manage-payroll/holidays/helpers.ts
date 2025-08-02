// Mapping for holiday type label to code
export const holidayTypeMap: Record<string, string> = {
  'Regular Holiday': 'RH',
  'Special (Non-working) Holiday': 'SNH',
  'Special (Working) Holiday': 'SWH',
  'Sunday Rate': 'SR',
}

// Helper function para ma-convert ang holiday type code to label
export const getHolidayTypeLabel = (code: string): string => {
  const reverseMap = Object.entries(holidayTypeMap).find(([, value]) => value === code)
  return reverseMap ? reverseMap[0] : code
}

// Helper function para ma-convert ang holiday type label to code
export const getHolidayTypeCode = (label: string): string => {
  return holidayTypeMap[label] || label
}
