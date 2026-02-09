"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Plus, Trash2, Clock, Calendar, Sun, AlertCircle } from "lucide-react"
import { dbManager } from "@/lib/database"
import { formatCurrency, formatHours, type RateSettings } from "@/lib/utils/work-utils"

interface Deduction {
  id: string
  name: string
  amount: number
}

interface SalaryData {
  normalHours: number
  sundayHours: number
  holidayHours: number
  deductions: Deduction[]
}

export default function SalaryCalculator() {
  const [rates, setRates] = useState<RateSettings>({
    normalRate: 0,
    sundayRate: 0,
    holidayRate: 0,
  })
  const [salaryData, setSalaryData] = useState<SalaryData>({
    normalHours: 0,
    sundayHours: 0,
    holidayHours: 0,
    deductions: [],
  })
  const [newDeduction, setNewDeduction] = useState({ name: "", amount: 0 })
  const [isOffline, setIsOffline] = useState(false)
  const [hasRates, setHasRates] = useState(false)

  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    setIsOffline(!navigator.onLine)
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const loadSettings = useCallback(async () => {
    const settings = await dbManager.getSettings()
    setRates({
      normalRate: settings.normalRate || 0,
      sundayRate: settings.sundayRate || 0,
      holidayRate: settings.holidayRate || 0,
    })
    setHasRates(settings.normalRate > 0 || settings.sundayRate > 0 || settings.holidayRate > 0)
    setSalaryData((prev) => ({
      ...prev,
      deductions: settings.deductions?.map((d, i) => ({ ...d, id: d.id || String(i) })) || [],
    }))
  }, [])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  useEffect(() => {
    const saveDeductions = async () => {
      await dbManager.saveSettings({ deductions: salaryData.deductions })
    }
    if (salaryData.deductions.length > 0) {
      saveDeductions()
    }
  }, [salaryData.deductions])

  const updateField = (field: keyof SalaryData, value: number) => {
    setSalaryData((prev) => ({ ...prev, [field]: value }))
  }

  const addDeduction = () => {
    if (newDeduction.name && newDeduction.amount > 0) {
      setSalaryData((prev) => ({
        ...prev,
        deductions: [...prev.deductions, { id: Date.now().toString(), ...newDeduction }],
      }))
      setNewDeduction({ name: "", amount: 0 })
    }
  }

  const removeDeduction = (id: string) => {
    setSalaryData((prev) => ({
      ...prev,
      deductions: prev.deductions.filter((d) => d.id !== id),
    }))
  }

  const calculateSalary = () => {
    const normalPay = salaryData.normalHours * rates.normalRate
    const sundayPay = salaryData.sundayHours * rates.sundayRate
    const holidayPay = salaryData.holidayHours * rates.holidayRate
    const grossSalary = normalPay + sundayPay + holidayPay
    const totalDeductions = salaryData.deductions.reduce((sum, d) => sum + d.amount, 0)
    return { normalPay, sundayPay, holidayPay, grossSalary, totalDeductions, netSalary: grossSalary - totalDeductions }
  }

  const salary = calculateSalary()
  const totalHours = salaryData.normalHours + salaryData.sundayHours + salaryData.holidayHours

  return (
    <div className="space-y-6">
      {isOffline && (
        <div className="text-center">
          <Badge variant="secondary" className="bg-muted">
            Offline Mode - Data saved locally
          </Badge>
        </div>
      )}

      {!hasRates && (
        <Card className="glass-card border-primary/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-primary">
              <AlertCircle className="h-5 w-5" />
              <div>
                <p className="font-medium">No rates configured</p>
                <p className="text-sm text-muted-foreground">
                  Go to the Settings tab to set your hourly rates for accurate calculations.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="max-w-4xl mx-auto grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5 text-primary" />
                Normal Hours
              </CardTitle>
              <CardDescription>Rate: {formatCurrency(rates.normalRate)}/hr</CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="normal-hours">Hours Worked</Label>
                <Input
                  id="normal-hours"
                  type="number"
                  placeholder="0"
                  value={salaryData.normalHours || ""}
                  onChange={(e) => updateField("normalHours", Number(e.target.value))}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sun className="h-5 w-5 text-secondary" />
                Sunday Hours
              </CardTitle>
              <CardDescription>Rate: {formatCurrency(rates.sundayRate)}/hr</CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="sunday-hours">Hours Worked</Label>
                <Input
                  id="sunday-hours"
                  type="number"
                  placeholder="0"
                  value={salaryData.sundayHours || ""}
                  onChange={(e) => updateField("sundayHours", Number(e.target.value))}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5 text-destructive" />
                Holiday Hours
              </CardTitle>
              <CardDescription>Rate: {formatCurrency(rates.holidayRate)}/hr</CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="holiday-hours">Hours Worked</Label>
                <Input
                  id="holiday-hours"
                  type="number"
                  placeholder="0"
                  value={salaryData.holidayHours || ""}
                  onChange={(e) => updateField("holidayHours", Number(e.target.value))}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Custom Deductions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Deduction name"
                  value={newDeduction.name}
                  onChange={(e) => setNewDeduction((prev) => ({ ...prev, name: e.target.value }))}
                />
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Amount (R)"
                    value={newDeduction.amount || ""}
                    onChange={(e) => setNewDeduction((prev) => ({ ...prev, amount: Number(e.target.value) }))}
                  />
                  <Button onClick={addDeduction} size="sm" className="liquid-button liquid-gradient text-white">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {salaryData.deductions.length > 0 && (
                <div className="space-y-2">
                  {salaryData.deductions.map((deduction) => (
                    <div key={deduction.id} className="flex items-center justify-between bg-muted/50 p-2 rounded-lg">
                      <span className="text-sm">{deduction.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{formatCurrency(deduction.amount)}</span>
                        <Button variant="ghost" size="sm" onClick={() => removeDeduction(deduction.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-xl">Salary Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Normal Pay:</span>
                  <span className="font-medium">{formatCurrency(salary.normalPay)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sunday Pay:</span>
                  <span className="font-medium">{formatCurrency(salary.sundayPay)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Holiday Pay:</span>
                  <span className="font-medium">{formatCurrency(salary.holidayPay)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg">
                  <span className="font-medium">Gross Salary:</span>
                  <span className="font-bold">{formatCurrency(salary.grossSalary)}</span>
                </div>
                <div className="flex justify-between text-destructive">
                  <span>Total Deductions:</span>
                  <span className="font-medium">-{formatCurrency(salary.totalDeductions)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-xl">
                  <span className="font-bold">Net Salary:</span>
                  <span className="font-bold text-primary">{formatCurrency(salary.netSalary)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Card className="glass-card">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{formatHours(totalHours)}</div>
                  <div className="text-sm text-muted-foreground">Total Hours</div>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{salaryData.deductions.length}</div>
                  <div className="text-sm text-muted-foreground">Deductions</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
