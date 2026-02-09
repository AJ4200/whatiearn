"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Calendar, TrendingUp, Clock, DollarSign, ChevronLeft, ChevronRight, Download } from "lucide-react"
import { dbManager, type WorkRecord } from "@/lib/database"
import { PayslipPDFGenerator } from "@/lib/pdf-generator"
import { format } from "date-fns"
import { formatCurrency, formatHours, getPayPeriod } from "@/lib/utils/work-utils"

interface MonthlyStats {
  totalHours: number
  totalEarnings: number
  normalHours: number
  sundayHours: number
  holidayHours: number
  normalEarnings: number
  sundayEarnings: number
  holidayEarnings: number
  workDays: number
  avgHoursPerDay: number
  records: WorkRecord[]
}

interface PayPeriod {
  start: Date
  end: Date
  label: string
}

export default function MonthlyEarnings() {
  const [currentPeriod, setCurrentPeriod] = useState<PayPeriod>(getPayPeriod())
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [deductions, setDeductions] = useState<Array<{ name: string; amount: number }>>([])
  const [employeeInfo, setEmployeeInfo] = useState({ name: "", id: "", company: "WhatIEarn" })

  const loadData = useCallback(async () => {
    setIsLoading(true)
    const startDate = format(currentPeriod.start, "yyyy-MM-dd")
    const endDate = format(currentPeriod.end, "yyyy-MM-dd")

    const [records, settings] = await Promise.all([
      dbManager.getWorkRecords(startDate, endDate),
      dbManager.getSettings(),
    ])

    setDeductions(settings.deductions || [])
    setEmployeeInfo({
      name: settings.employeeName || "",
      id: settings.employeeId || "",
      company: settings.companyName || "WhatIEarn",
    })

    const completedRecords = records.filter((r) => !r.isActive)
    const workDates = new Set<string>()

    const stats: MonthlyStats = {
      totalHours: 0,
      totalEarnings: 0,
      normalHours: 0,
      sundayHours: 0,
      holidayHours: 0,
      normalEarnings: 0,
      sundayEarnings: 0,
      holidayEarnings: 0,
      workDays: 0,
      avgHoursPerDay: 0,
      records: completedRecords,
    }

    completedRecords.forEach((r) => {
      stats.totalHours += r.totalHours
      stats.totalEarnings += r.earnings
      workDates.add(r.date)

      if (r.workType === "normal") {
        stats.normalHours += r.totalHours
        stats.normalEarnings += r.earnings
      } else if (r.workType === "sunday") {
        stats.sundayHours += r.totalHours
        stats.sundayEarnings += r.earnings
      } else {
        stats.holidayHours += r.totalHours
        stats.holidayEarnings += r.earnings
      }
    })

    stats.workDays = workDates.size
    stats.avgHoursPerDay = stats.workDays > 0 ? stats.totalHours / stats.workDays : 0

    setMonthlyStats(stats)
    setIsLoading(false)
  }, [currentPeriod])

  useEffect(() => {
    loadData()
  }, [loadData])

  const navigatePeriod = (direction: "prev" | "next" | "current") => {
    if (direction === "current") {
      setCurrentPeriod(getPayPeriod())
    } else {
      const newDate = new Date(currentPeriod.start)
      newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1))
      setCurrentPeriod(getPayPeriod(newDate))
    }
  }

  const calculateNetEarnings = () => {
    if (!monthlyStats) return 0
    return monthlyStats.totalEarnings - deductions.reduce((sum, d) => sum + d.amount, 0)
  }

  const generatePayslip = () => {
    if (!monthlyStats) return
    const pdfGenerator = new PayslipPDFGenerator()
    pdfGenerator.generatePayslip({
      period: currentPeriod.label,
      grossEarnings: monthlyStats.totalEarnings,
      deductions,
      netEarnings: calculateNetEarnings(),
      hoursBreakdown: {
        normal: monthlyStats.normalHours,
        sunday: monthlyStats.sundayHours,
        holiday: monthlyStats.holidayHours,
        total: monthlyStats.totalHours,
      },
      earningsBreakdown: {
        normal: monthlyStats.normalEarnings,
        sunday: monthlyStats.sundayEarnings,
        holiday: monthlyStats.holidayEarnings,
      },
      workDays: monthlyStats.workDays,
      employeeName: employeeInfo.name,
      employeeId: employeeInfo.id,
      companyName: employeeInfo.company,
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">Loading monthly data...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Pay Period
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigatePeriod("prev")} className="liquid-button">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigatePeriod("next")} className="liquid-button">
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigatePeriod("current")} className="liquid-button">
                Current
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-2xl font-bold">{currentPeriod.label}</div>
            <div className="text-sm text-muted-foreground mt-1">Pay period runs from 21st to 20th of each month</div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-primary" />
              <div>
                <div className="text-2xl font-bold">{formatHours(monthlyStats?.totalHours || 0)}</div>
                <div className="text-sm text-muted-foreground">Total Hours</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-primary" />
              <div>
                <div className="text-2xl font-bold">{formatCurrency(monthlyStats?.totalEarnings || 0)}</div>
                <div className="text-sm text-muted-foreground">Gross Earnings</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-primary" />
              <div>
                <div className="text-2xl font-bold">{monthlyStats?.workDays || 0}</div>
                <div className="text-sm text-muted-foreground">Work Days</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <div>
                <div className="text-2xl font-bold">{formatHours(monthlyStats?.avgHoursPerDay || 0)}</div>
                <div className="text-sm text-muted-foreground">Avg Hours/Day</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Hours Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Badge variant="default">Normal</Badge>
                  <span className="text-sm text-muted-foreground">Weekdays</span>
                </div>
                <span className="font-medium">{formatHours(monthlyStats?.normalHours || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Sunday</Badge>
                  <span className="text-sm text-muted-foreground">Sundays</span>
                </div>
                <span className="font-medium">{formatHours(monthlyStats?.sundayHours || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">Holiday</Badge>
                  <span className="text-sm text-muted-foreground">Public Holidays</span>
                </div>
                <span className="font-medium">{formatHours(monthlyStats?.holidayHours || 0)}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total Hours</span>
                <span>{formatHours(monthlyStats?.totalHours || 0)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Earnings Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Badge variant="default">Normal</Badge>
                  <span className="text-sm text-muted-foreground">Regular Rate</span>
                </div>
                <span className="font-medium">{formatCurrency(monthlyStats?.normalEarnings || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Sunday</Badge>
                  <span className="text-sm text-muted-foreground">Premium Rate</span>
                </div>
                <span className="font-medium">{formatCurrency(monthlyStats?.sundayEarnings || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">Holiday</Badge>
                  <span className="text-sm text-muted-foreground">Holiday Rate</span>
                </div>
                <span className="font-medium">{formatCurrency(monthlyStats?.holidayEarnings || 0)}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Gross Earnings</span>
                <span>{formatCurrency(monthlyStats?.totalEarnings || 0)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Net Earnings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between text-lg">
              <span className="font-medium">Gross Earnings:</span>
              <span className="font-bold">{formatCurrency(monthlyStats?.totalEarnings || 0)}</span>
            </div>

            {deductions.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Deductions:</div>
                  {deductions.map((d, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span>{d.name}</span>
                      <span className="text-destructive">-{formatCurrency(d.amount)}</span>
                    </div>
                  ))}
                </div>
                <Separator />
              </>
            )}

            <div className="flex justify-between text-xl">
              <span className="font-bold">Net Earnings:</span>
              <span className="font-bold text-primary">{formatCurrency(calculateNetEarnings())}</span>
            </div>
          </div>

          <div className="pt-4">
            <Button onClick={generatePayslip} className="w-full liquid-button liquid-gradient text-white">
              <Download className="h-4 w-4 mr-2" />
              Generate Professional Payslip (PDF)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
