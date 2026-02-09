import { dbManager } from "@/lib/database"
import { format, getDay } from "date-fns"

// South African Public Holidays (can be extended per year)
const SA_PUBLIC_HOLIDAYS: Record<number, string[]> = {
  2024: [
    "2024-01-01", // New Year's Day
    "2024-03-21", // Human Rights Day
    "2024-03-29", // Good Friday
    "2024-04-01", // Family Day
    "2024-04-27", // Freedom Day
    "2024-05-01", // Workers' Day
    "2024-06-16", // Youth Day
    "2024-06-17", // Youth Day observed
    "2024-08-09", // National Women's Day
    "2024-09-24", // Heritage Day
    "2024-12-16", // Day of Reconciliation
    "2024-12-25", // Christmas Day
    "2024-12-26", // Day of Goodwill
  ],
  2025: [
    "2025-01-01", // New Year's Day
    "2025-03-21", // Human Rights Day
    "2025-04-18", // Good Friday
    "2025-04-21", // Family Day
    "2025-04-27", // Freedom Day
    "2025-04-28", // Freedom Day observed
    "2025-05-01", // Workers' Day
    "2025-06-16", // Youth Day
    "2025-08-09", // National Women's Day
    "2025-09-24", // Heritage Day
    "2025-12-16", // Day of Reconciliation
    "2025-12-25", // Christmas Day
    "2025-12-26", // Day of Goodwill
  ],
}

export type WorkType = "normal" | "sunday" | "holiday"

export interface RateSettings {
  normalRate: number
  sundayRate: number
  holidayRate: number
}

export interface DayTypeInfo {
  workType: WorkType
  isPublicHoliday: boolean
  isCustomHoliday: boolean
  isSunday: boolean
  holidayName?: string
}

// Check if a date is a South African public holiday
export function isPublicHoliday(date: Date | string): boolean {
  const dateStr = typeof date === "string" ? date : format(date, "yyyy-MM-dd")
  const year = new Date(dateStr).getFullYear()
  const holidays = SA_PUBLIC_HOLIDAYS[year] || []
  return holidays.includes(dateStr)
}

// Check if a date is a Sunday
export function isSunday(date: Date | string): boolean {
  const d = typeof date === "string" ? new Date(date) : date
  return getDay(d) === 0
}

// Get work type for a given date (checks custom holidays from DB)
export async function getDayTypeInfo(date: Date | string): Promise<DayTypeInfo> {
  const dateStr = typeof date === "string" ? date : format(date, "yyyy-MM-dd")
  const d = typeof date === "string" ? new Date(date) : date

  const customHoliday = await dbManager.getCustomHolidayByDate(dateStr)
  const sundayCheck = isSunday(d)
  const publicHolidayCheck = isPublicHoliday(dateStr)

  let workType: WorkType = "normal"
  if (sundayCheck) {
    workType = "sunday"
  }
  if (publicHolidayCheck || customHoliday) {
    workType = "holiday"
  }

  return {
    workType,
    isPublicHoliday: publicHolidayCheck,
    isCustomHoliday: !!customHoliday,
    isSunday: sundayCheck,
    holidayName: customHoliday?.name,
  }
}

// Get work type synchronously (without custom holiday check - for quick UI rendering)
export function getQuickWorkType(date: Date | string): WorkType {
  const d = typeof date === "string" ? new Date(date) : date
  const dateStr = typeof date === "string" ? date : format(date, "yyyy-MM-dd")

  if (isSunday(d)) return "sunday"
  if (isPublicHoliday(dateStr)) return "holiday"
  return "normal"
}

// Get rate for a work type from settings
export function getRateForWorkType(workType: WorkType, settings: RateSettings): number {
  switch (workType) {
    case "sunday":
      return settings.sundayRate
    case "holiday":
      return settings.holidayRate
    default:
      return settings.normalRate
  }
}

// Calculate earnings from hours and rate
export function calculateEarnings(hours: number, rate: number): number {
  return Math.max(0, hours * rate)
}

// Format currency in South African Rands
export function formatCurrency(amount: number): string {
  return `R${amount.toFixed(2)}`
}

// Format hours with suffix
export function formatHours(hours: number): string {
  return `${hours.toFixed(1)}h`
}

// Format time from date string
export function formatTimeFromString(dateString: string): string {
  return format(new Date(dateString), "HH:mm")
}

// Calculate duration between two times
export function calculateDuration(startTime: string, endTime?: string, breakStart?: string, breakEnd?: string): number {
  const start = new Date(startTime)
  const end = endTime ? new Date(endTime) : new Date()
  let totalMinutes = (end.getTime() - start.getTime()) / (1000 * 60)

  // Subtract break time if both start and end are defined
  if (breakStart && breakEnd) {
    const bStart = new Date(breakStart)
    const bEnd = new Date(breakEnd)
    const breakMinutes = (bEnd.getTime() - bStart.getTime()) / (1000 * 60)
    totalMinutes -= breakMinutes
  }

  return Math.max(0, totalMinutes / 60)
}

// Get work type badge styling
export function getWorkTypeBadgeVariant(workType: WorkType): "default" | "secondary" | "destructive" {
  switch (workType) {
    case "sunday":
      return "secondary"
    case "holiday":
      return "destructive"
    default:
      return "default"
  }
}

// Get pay period boundaries (21st to 20th)
export function getPayPeriod(date: Date = new Date()): { start: Date; end: Date; label: string } {
  const currentMonth = date.getMonth()
  const currentYear = date.getFullYear()

  let startMonth: number, startYear: number, endMonth: number, endYear: number

  if (date.getDate() < 21) {
    startMonth = currentMonth - 1
    startYear = currentYear
    if (startMonth < 0) {
      startMonth = 11
      startYear = currentYear - 1
    }
    endMonth = currentMonth
    endYear = currentYear
  } else {
    startMonth = currentMonth
    startYear = currentYear
    endMonth = currentMonth + 1
    endYear = currentYear
    if (endMonth > 11) {
      endMonth = 0
      endYear = currentYear + 1
    }
  }

  const start = new Date(startYear, startMonth, 21)
  const end = new Date(endYear, endMonth, 20)

  return {
    start,
    end,
    label: `${format(start, "MMM dd")} - ${format(end, "MMM dd, yyyy")}`,
  }
}
