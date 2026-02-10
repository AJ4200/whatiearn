"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Play, Pause, Square, Coffee, Calendar, AlertCircle } from "lucide-react"
import { dbManager, type WorkRecord } from "@/lib/database"
import {
  getDayTypeInfo,
  getRateForWorkType,
  calculateDuration,
  formatCurrency,
  formatHours,
  getWorkTypeBadgeVariant,
  type WorkType,
  type RateSettings,
} from "@/lib/utils/work-utils"

export default function TimeTracker() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [activeRecord, setActiveRecord] = useState<WorkRecord | null>(null)
  const [isOnBreak, setIsOnBreak] = useState(false)
  const [todayRecords, setTodayRecords] = useState<WorkRecord[]>([])
  const [settings, setSettings] = useState<RateSettings>({
    normalRate: 0,
    sundayRate: 0,
    holidayRate: 0,
  })
  const [todayWorkType, setTodayWorkType] = useState<WorkType>("normal")
  const [hasRates, setHasRates] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const loadInitialData = useCallback(async () => {
    const [savedSettings, dayInfo, active] = await Promise.all([
      dbManager.getSettings(),
      getDayTypeInfo(new Date()),
      dbManager.getActiveWorkRecord(),
    ])

    setSettings({
      normalRate: savedSettings.normalRate,
      sundayRate: savedSettings.sundayRate,
      holidayRate: savedSettings.holidayRate,
    })
    setHasRates(savedSettings.normalRate > 0 || savedSettings.sundayRate > 0 || savedSettings.holidayRate > 0)
    setTodayWorkType(dayInfo.workType)
    setActiveRecord(active || null)
    if (active?.breakStart && !active?.breakEnd) {
      setIsOnBreak(true)
    }
  }, [])

  const loadTodayRecords = useCallback(async () => {
    const today = new Date().toISOString().split("T")[0]
    const records = await dbManager.getWorkRecords(today, today)
    setTodayRecords(records)
  }, [])

  useEffect(() => {
    loadInitialData()
    loadTodayRecords()
  }, [loadInitialData, loadTodayRecords])

  const clockIn = async () => {
    const now = new Date()
    const rate = getRateForWorkType(todayWorkType, settings)

    const newRecord: Omit<WorkRecord, "id"> = {
      date: now.toISOString().split("T")[0],
      clockIn: now.toISOString(),
      totalHours: 0,
      workType: todayWorkType,
      rate,
      earnings: 0,
      isActive: true,
    }

    const id = await dbManager.addWorkRecord(newRecord)
    setActiveRecord({ ...newRecord, id: id as number })
    loadTodayRecords()
  }

  const clockOut = async () => {
    if (!activeRecord) return

    const now = new Date()
    const totalHours = calculateDuration(
      activeRecord.clockIn,
      now.toISOString(),
      activeRecord.breakStart,
      activeRecord.breakEnd,
    )
    const earnings = totalHours * activeRecord.rate

    await dbManager.updateWorkRecord(activeRecord.id!, {
      clockOut: now.toISOString(),
      totalHours,
      earnings,
      isActive: false,
    })

    setActiveRecord(null)
    setIsOnBreak(false)
    loadTodayRecords()
  }

  const startBreak = async () => {
    if (!activeRecord) return
    const now = new Date().toISOString()
    await dbManager.updateWorkRecord(activeRecord.id!, { breakStart: now })
    setIsOnBreak(true)
    setActiveRecord((prev) => (prev ? { ...prev, breakStart: now } : null))
  }

  const endBreak = async () => {
    if (!activeRecord) return
    const now = new Date().toISOString()
    await dbManager.updateWorkRecord(activeRecord.id!, { breakEnd: now })
    setIsOnBreak(false)
    setActiveRecord((prev) => (prev ? { ...prev, breakEnd: now } : null))
  }

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit", second: "2-digit" })

  const formatDuration = (startTime: string, endTime?: string) => {
    const hours = calculateDuration(startTime, endTime)
    const totalMins = Math.floor(hours * 60)
    return `${Math.floor(totalMins / 60)}h ${totalMins % 60}m`
  }

  const getTodayEarnings = () => todayRecords.reduce((total, r) => total + r.earnings, 0)
  const getTodayHours = () => todayRecords.reduce((total, r) => total + r.totalHours, 0)
  const currentRate = getRateForWorkType(todayWorkType, settings)

  return (
    <div className="space-y-6">
      {!hasRates && (
        <Card className="glass-card border-primary/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-primary">
              <AlertCircle className="h-5 w-5" />
              <div>
                <p className="font-medium">No rates configured</p>
                <p className="text-sm text-muted-foreground">
                  Go to the Settings tab to set your hourly rates before tracking time.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <div className="text-4xl font-mono font-bold text-primary float-animation">{formatTime(currentTime)}</div>
            <div className="text-sm text-muted-foreground">
              {currentTime.toLocaleDateString("en-ZA", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
            <div className="flex items-center justify-center gap-2 mt-2">
              <Badge variant={getWorkTypeBadgeVariant(todayWorkType)}>
                {todayWorkType.charAt(0).toUpperCase() + todayWorkType.slice(1)} Day
              </Badge>
              <Badge variant="outline">{formatCurrency(currentRate)}/hr</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Time Tracking
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!activeRecord ? (
            <Button
              onClick={clockIn}
              className="w-full liquid-button liquid-gradient text-white"
              size="lg"
              disabled={!hasRates}
            >
              <Play className="h-4 w-4 mr-2" />
              Clock In ({formatCurrency(currentRate)}/hr)
            </Button>
            
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Clocked in at {formatTime(new Date(activeRecord.clockIn))}</div>
                  <div className="text-sm text-muted-foreground">Duration: {formatDuration(activeRecord.clockIn)}</div>
                </div>
                <Badge variant={getWorkTypeBadgeVariant(activeRecord.workType)}>{activeRecord.workType}</Badge>
              </div>

              <div className="flex gap-2 w-full justify-center">
                {!isOnBreak ? (
                  <Button onClick={startBreak} variant="outline" className="liquid-button bg-transparent rounded-full w-[45%] h-40">
                    <Coffee className="h-4 w-4 mr-2" />
                    Start Break
                  </Button>
                ) : (
                  <Button onClick={endBreak} variant="outline" className="liquid-button bg-transparent rounded-full w-[45%] h-40">
                    <Pause className="h-4 w-4 mr-2" />
                    End Break
                  </Button>
                )}
                <Button onClick={clockOut} variant="destructive" className="liquid-button rounded-full w-[45%] h-40">
                  <Square className="h-4 w-4 mr-2" />
                  Clock Out
                </Button>
              </div>

              {isOnBreak && activeRecord.breakStart && (
                <div className="p-3 rounded-lg liquid-gradient-subtle">
                  <div className="text-sm font-medium text-center">
                    On Break - {formatDuration(activeRecord.breakStart)}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Today's Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 rounded-lg liquid-gradient-subtle">
              <div className="text-2xl font-bold text-primary">{formatHours(getTodayHours())}</div>
              <div className="text-sm text-muted-foreground">Hours Worked</div>
            </div>
            <div className="text-center p-4 rounded-lg liquid-gradient-subtle">
              <div className="text-2xl font-bold text-primary">{formatCurrency(getTodayEarnings())}</div>
              <div className="text-sm text-muted-foreground">Earnings</div>
            </div>
          </div>

          {todayRecords.length > 0 && (
            <div className="mt-4 space-y-2">
              <div className="text-sm font-medium">Today's Sessions:</div>
              {todayRecords.map((record) => (
                <div key={record.id} className="bg-muted/50 p-3 rounded-lg text-sm">
                  <div className="flex justify-between">
                    <span>
                      {formatTime(new Date(record.clockIn))} -{" "}
                      {record.clockOut ? formatTime(new Date(record.clockOut)) : "Active"}
                    </span>
                    <Badge variant={getWorkTypeBadgeVariant(record.workType)} className="text-xs">
                      {record.workType}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-muted-foreground mt-1">
                    <span>{formatHours(record.totalHours)}</span>
                    <span>{formatCurrency(record.earnings)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
