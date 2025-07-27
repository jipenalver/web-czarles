// 👉 Get total work hours (AM + PM sessions combined)
export const getWorkHoursString = (
  amTimeIn: string | Date | null,
  amTimeOut: string | Date | null,
  pmTimeIn: string | Date | null,
  pmTimeOut: string | Date | null,
) => {
  const getMinutes = (startTime: string | Date | null, endTime: string | Date | null) => {
    if (!startTime || !endTime) return 0

    const start = new Date(startTime)
    const end = new Date(endTime)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0

    const diffMs = end.getTime() - start.getTime()
    return diffMs < 0 ? 0 : Math.floor(diffMs / (1000 * 60))
  }

  const amMinutes = getMinutes(amTimeIn, amTimeOut)
  const pmMinutes = getMinutes(pmTimeIn, pmTimeOut)
  const totalMinutes = amMinutes + pmMinutes

  if (totalMinutes === 0) return '0 minutes'

  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  const hourText = hours === 1 ? 'hour' : 'hours'
  const minuteText = minutes === 1 ? 'minute' : 'minutes'

  if (hours === 0) return `${minutes} ${minuteText}`
  if (minutes === 0) return `${hours} ${hourText}`
  return `${hours} ${hourText} ${minutes} ${minuteText}`
}
