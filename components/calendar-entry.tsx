"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ChevronLeft, ChevronRight, Calendar, Plus, Clock, Star, Trash2 } from "lucide-react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, getDay, isToday } from "date-fns"
import { dbManager, type WorkRecord, type CustomHoliday } from "@/lib/database"
import {
  formatCurrency,
  getRateForWorkType,
  calculateEarnings,
  isPublicHoliday,
  type WorkType,
  type RateSettings,
} from "@/lib/utils/work-utils"

interface DayData {
  date: Date
  workRecord?: WorkRecord
  isHoliday: boolean
  isPublicHoliday: boolean
  holidayName?: string
  isSunday: boolean
}

export default function CalendarEntry() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showEntryDialog, setShowEntryDialog] = useState(false)
  const [showHolidayDialog, setShowHolidayDialog] = useState(false)
  const [dayDataMap, setDayDataMap] = useState<Map<string, DayData>>(new Map())
  const [settings, setSettings] = useState<RateSettings>({ normalRate: 0, sundayRate: 0, holidayRate: 0 })
  const [holidays, setHolidays] = useState<CustomHoliday[]>([])

  const [entryHours, setEntryHours] = useState("")
  const [entryWorkType, setEntryWorkType] = useState<WorkType>("normal")
  const [markAsHoliday, setMarkAsHoliday] = useState(false)
  const [holidayName, setHolidayName] = useState("")

  const loadData = useCallback(async () => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)

    const [records, savedSettings, customHolidays] = await Promise.all([
      dbManager.getWorkRecords(format(start, "yyyy-MM-dd"), format(end, "yyyy-MM-dd")),
      dbManager.getSettings(),
      dbManager.getCustomHolidays(),
    ])

    setSettings({
      normalRate: savedSettings.normalRate || 0,
      sundayRate: savedSettings.sundayRate || 0,
      holidayRate: savedSettings.holidayRate || 0,
    })
    setHolidays(customHolidays)

    const days = eachDayOfInterval({ start, end })
    const dataMap = new Map<string, DayData>()

    days.forEach((date) => {
      const dateStr = format(date, "yyyy-MM-dd")
      const record = records.find((r) => r.date === dateStr && !r.isActive)
      const customHoliday = customHolidays.find((h) => h.date === dateStr)
      const isSunday = getDay(date) === 0
      const isPubHoliday = isPublicHoliday(dateStr)

      dataMap.set(dateStr, {
        date,
        workRecord: record,
        isHoliday: !!customHoliday || isPubHoliday,
        isPublicHoliday: isPubHoliday,
        holidayName: customHoliday?.name,
        isSunday,
      })
    })

    setDayDataMap(dataMap)
  }, [currentMonth])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleDayClick = (date: Date) => {
    setSelectedDate(date)
    const dateStr = format(date, "yyyy-MM-dd")
    const dayData = dayDataMap.get(dateStr)
    const isSunday = getDay(date) === 0

    if (dayData?.workRecord) {
      setEntryHours(dayData.workRecord.totalHours.toString())
      setEntryWorkType(dayData.workRecord.workType)
    } else {
      setEntryHours("")
      if (dayData?.isHoliday) {
        setEntryWorkType("holiday")
      } else if (isSunday) {
        setEntryWorkType("sunday")
      } else {
        setEntryWorkType("normal")
      }
    }

    setMarkAsHoliday((dayData?.isHoliday && !dayData?.isPublicHoliday) || false)
    setHolidayName(dayData?.holidayName || "")
    setShowEntryDialog(true)
  }

  const handleSaveEntry = async () => {
    if (!selectedDate || !entryHours) return

    const dateStr = format(selectedDate, "yyyy-MM-dd")
    const hours = Number.parseFloat(entryHours)
    const rate = getRateForWorkType(entryWorkType, settings)
    const earnings = calculateEarnings(hours, rate)

    const existingRecord = dayDataMap.get(dateStr)?.workRecord

    if (existingRecord?.id) {
      await dbManager.updateWorkRecord(existingRecord.id, {
        totalHours: hours,
        workType: entryWorkType,
        rate,
        earnings,
        isManualEntry: true,
      })
    } else {
      await dbManager.addWorkRecord({
        date: dateStr,
        clockIn: `${dateStr}T09:00:00`,
        clockOut: `${dateStr}T${String(9 + Math.floor(hours)).padStart(2, "0")}:${String(Math.round((hours % 1) * 60)).padStart(2, "0")}:00`,
        totalHours: hours,
        workType: entryWorkType,
        rate,
        earnings,
        isActive: false,
        isManualEntry: true,
      })
    }

    const existingHoliday = holidays.find((h) => h.date === dateStr)
    if (markAsHoliday && !existingHoliday && holidayName) {
      await dbManager.addCustomHoliday({ date: dateStr, name: holidayName })
    } else if (!markAsHoliday && existingHoliday?.id) {
      await dbManager.deleteCustomHoliday(existingHoliday.id)
    }

    setShowEntryDialog(false)
    loadData()
  }

  const handleDeleteEntry = async () => {
    if (!selectedDate) return
    const dateStr = format(selectedDate, "yyyy-MM-dd")
    const record = dayDataMap.get(dateStr)?.workRecord

    if (record?.id) {
      await dbManager.deleteWorkRecord(record.id)
    }

    const holiday = holidays.find((h) => h.date === dateStr)
    if (holiday?.id) {
      await dbManager.deleteCustomHoliday(holiday.id)
    }

    setShowEntryDialog(false)
    loadData()
  }

  const renderCalendarDays = () => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    const days = eachDayOfInterval({ start, end })
    const startDayOfWeek = getDay(start)
    const emptyCells = Array(startDayOfWeek).fill(null)

    return (
      <div className="grid grid-cols-7 gap-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
            {day}
          </div>
        ))}

        {emptyCells.map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {days.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd")
          const dayData = dayDataMap.get(dateStr)
          const isSunday = getDay(day) === 0
          const hasWork = !!dayData?.workRecord
          const isHolidayDay = dayData?.isHoliday

          return (
            <button
              key={dateStr}
              onClick={() => handleDayClick(day)}
              className={`
                aspect-square p-1 rounded-full text-sm font-medium transition-all
                calendar-day relative flex flex-col items-center justify-center
                ${isToday(day) ? "ring-2 ring-primary ring-offset-2" : ""}
                ${isSunday ? "calendar-day-sunday" : ""}
                ${isHolidayDay && !isSunday ? "calendar-day-holiday" : ""}
                ${!isSunday && !isHolidayDay ? "hover:bg-muted" : "hover:opacity-90"}
                ${hasWork ? "calendar-day-worked" : ""}
              `}
            >
              <span>{format(day, "d")}</span>
              {hasWork && <span className="text-[10px] opacity-80">{dayData?.workRecord?.totalHours.toFixed(1)}h</span>}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Work Calendar
              </CardTitle>
              <CardDescription>Click any day to add or edit work hours manually</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="liquid-button"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-semibold min-w-[140px] text-center">{format(currentMonth, "MMMM yyyy")}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="liquid-button"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {renderCalendarDays()}

          <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-secondary" />
              <span className="text-sm text-muted-foreground">Sunday</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded liquid-gradient" />
              <span className="text-sm text-muted-foreground">Holiday</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-muted relative">
                <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
              </div>
              <span className="text-sm text-muted-foreground">Worked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded ring-2 ring-primary ring-offset-1" />
              <span className="text-sm text-muted-foreground">Today</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            Custom Holidays
          </CardTitle>
          <CardDescription>Mark non-Sunday days as holidays for special rate calculations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button
              onClick={() => setShowHolidayDialog(true)}
              className="w-full liquid-button liquid-gradient text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Holiday
            </Button>

            {holidays.length > 0 ? (
              <div className="space-y-2">
                {holidays.map((holiday) => (
                  <div key={holiday.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">{holiday.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(holiday.date), "EEEE, MMMM d, yyyy")}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={async () => {
                        if (holiday.id) {
                          await dbManager.deleteCustomHoliday(holiday.id)
                          loadData()
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No custom holidays added yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showEntryDialog} onOpenChange={setShowEntryDialog}>
        <DialogContent className="glass-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              {selectedDate && format(selectedDate, "EEEE, MMMM d, yyyy")}
            </DialogTitle>
            <DialogDescription>
              {selectedDate && getDay(selectedDate) === 0
                ? "Sunday - Higher rate applies"
                : dayDataMap.get(format(selectedDate || new Date(), "yyyy-MM-dd"))?.isHoliday
                  ? "Holiday - Special rate applies"
                  : "Normal working day"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Hours Worked</Label>
              <Input
                type="number"
                step="0.5"
                min="0"
                max="24"
                value={entryHours}
                onChange={(e) => setEntryHours(e.target.value)}
                placeholder="Enter hours worked"
              />
            </div>

            <div className="space-y-2">
              <Label>Day Type</Label>
              <Select value={entryWorkType} onValueChange={(v: WorkType) => setEntryWorkType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal ({formatCurrency(settings.normalRate)}/hr)</SelectItem>
                  <SelectItem value="sunday">Sunday ({formatCurrency(settings.sundayRate)}/hr)</SelectItem>
                  <SelectItem value="holiday">Holiday ({formatCurrency(settings.holidayRate)}/hr)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedDate &&
              getDay(selectedDate) !== 0 &&
              !dayDataMap.get(format(selectedDate, "yyyy-MM-dd"))?.isPublicHoliday && (
                <div className="space-y-3 p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between">
                    <Label>Mark as Holiday</Label>
                    <Switch
                      checked={markAsHoliday}
                      onCheckedChange={(checked) => {
                        setMarkAsHoliday(checked)
                        if (checked) setEntryWorkType("holiday")
                      }}
                    />
                  </div>
                  {markAsHoliday && (
                    <div className="space-y-2">
                      <Label>Holiday Name</Label>
                      <Input
                        value={holidayName}
                        onChange={(e) => setHolidayName(e.target.value)}
                        placeholder="e.g., Christmas Day"
                      />
                    </div>
                  )}
                </div>
              )}

            {entryHours && (
              <div className="p-3 rounded-lg liquid-gradient-subtle">
                <p className="text-sm text-muted-foreground">Estimated Earnings</p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(
                    calculateEarnings(Number.parseFloat(entryHours), getRateForWorkType(entryWorkType, settings)),
                  )}
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2">
            {dayDataMap.get(format(selectedDate || new Date(), "yyyy-MM-dd"))?.workRecord && (
              <Button variant="destructive" onClick={handleDeleteEntry}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
            <Button
              onClick={handleSaveEntry}
              disabled={!entryHours}
              className="liquid-button liquid-gradient text-white"
            >
              Save Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showHolidayDialog} onOpenChange={setShowHolidayDialog}>
        <DialogContent className="glass-card">
          <DialogHeader>
            <DialogTitle>Add Custom Holiday</DialogTitle>
            <DialogDescription>Mark a specific date as a holiday for special rate calculation</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" onChange={(e) => setSelectedDate(new Date(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Holiday Name</Label>
              <Input
                value={holidayName}
                onChange={(e) => setHolidayName(e.target.value)}
                placeholder="e.g., Christmas Day"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={async () => {
                if (selectedDate && holidayName) {
                  await dbManager.addCustomHoliday({ date: format(selectedDate, "yyyy-MM-dd"), name: holidayName })
                  setHolidayName("")
                  setShowHolidayDialog(false)
                  loadData()
                }
              }}
              disabled={!selectedDate || !holidayName}
              className="liquid-button liquid-gradient text-white"
            >
              Add Holiday
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
