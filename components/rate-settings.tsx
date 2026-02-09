"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Settings, Clock, Sun, Calendar, User, Building, Save, Check } from "lucide-react"
import { dbManager, type Settings as DBSettings } from "@/lib/database"
import { formatCurrency } from "@/lib/utils/work-utils"

export default function RateSettings() {
  const [settings, setSettings] = useState<DBSettings>({
    normalRate: 0,
    sundayRate: 0,
    holidayRate: 0,
    deductions: [],
    employeeName: "",
    employeeId: "",
    companyName: "WhatIEarn",
  })
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const loadSettings = useCallback(async () => {
    const savedSettings = await dbManager.getSettings()
    setSettings(savedSettings)
  }, [])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  const handleSave = async () => {
    setIsSaving(true)
    await dbManager.saveSettings(settings)
    setIsSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const updateRate = (field: keyof DBSettings, value: number | string) => {
    setSettings((prev) => ({ ...prev, [field]: value }))
  }

  // Calculate example earnings for 8 hours
  const exampleHours = 8
  const normalExample = exampleHours * settings.normalRate
  const sundayExample = exampleHours * settings.sundayRate
  const holidayExample = exampleHours * settings.holidayRate

  return (
    <div className="space-y-6">
      {/* Rate Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="glass-card overflow-hidden">
          <div className="h-1 liquid-gradient" />
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-primary" />
              Normal Rate
            </CardTitle>
            <CardDescription>Weekdays (Mon-Sat)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="normal-rate">Hourly Rate (R)</Label>
              <Input
                id="normal-rate"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={settings.normalRate || ""}
                onChange={(e) => updateRate("normalRate", Number(e.target.value))}
                className="text-lg font-medium"
              />
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Example: {exampleHours}h work day</p>
              <p className="text-lg font-bold text-primary">{formatCurrency(normalExample)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card overflow-hidden">
          <div className="h-1 bg-secondary" />
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sun className="h-5 w-5 text-secondary" />
              Sunday Rate
            </CardTitle>
            <CardDescription>Premium Sunday pay</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="sunday-rate">Hourly Rate (R)</Label>
              <Input
                id="sunday-rate"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={settings.sundayRate || ""}
                onChange={(e) => updateRate("sundayRate", Number(e.target.value))}
                className="text-lg font-medium"
              />
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Example: {exampleHours}h work day</p>
              <p className="text-lg font-bold text-secondary">{formatCurrency(sundayExample)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card overflow-hidden">
          <div className="h-1 bg-destructive" />
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-destructive" />
              Holiday Rate
            </CardTitle>
            <CardDescription>Public holidays & custom</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="holiday-rate">Hourly Rate (R)</Label>
              <Input
                id="holiday-rate"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={settings.holidayRate || ""}
                onChange={(e) => updateRate("holidayRate", Number(e.target.value))}
                className="text-lg font-medium"
              />
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Example: {exampleHours}h work day</p>
              <p className="text-lg font-bold text-destructive">{formatCurrency(holidayExample)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rate Comparison */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Rate Comparison
          </CardTitle>
          <CardDescription>Compare your earnings across different day types</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-4 text-sm font-medium text-muted-foreground">
              <div>Day Type</div>
              <div className="text-right">Hourly</div>
              <div className="text-right">8 Hours</div>
              <div className="text-right">vs Normal</div>
            </div>
            <Separator />
            <div className="grid grid-cols-4 gap-4 items-center">
              <div className="flex items-center gap-2">
                <Badge variant="default">Normal</Badge>
              </div>
              <div className="text-right font-medium">{formatCurrency(settings.normalRate)}</div>
              <div className="text-right font-medium">{formatCurrency(normalExample)}</div>
              <div className="text-right text-muted-foreground">-</div>
            </div>
            <div className="grid grid-cols-4 gap-4 items-center">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Sunday</Badge>
              </div>
              <div className="text-right font-medium">{formatCurrency(settings.sundayRate)}</div>
              <div className="text-right font-medium">{formatCurrency(sundayExample)}</div>
              <div className="text-right">
                {settings.normalRate > 0 ? (
                  <span className={sundayExample > normalExample ? "text-green-600" : "text-muted-foreground"}>
                    {sundayExample > normalExample ? "+" : ""}
                    {formatCurrency(sundayExample - normalExample)}
                  </span>
                ) : (
                  "-"
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4 items-center">
              <div className="flex items-center gap-2">
                <Badge variant="destructive">Holiday</Badge>
              </div>
              <div className="text-right font-medium">{formatCurrency(settings.holidayRate)}</div>
              <div className="text-right font-medium">{formatCurrency(holidayExample)}</div>
              <div className="text-right">
                {settings.normalRate > 0 ? (
                  <span className={holidayExample > normalExample ? "text-green-600" : "text-muted-foreground"}>
                    {holidayExample > normalExample ? "+" : ""}
                    {formatCurrency(holidayExample - normalExample)}
                  </span>
                ) : (
                  "-"
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employee Information */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Employee Information
          </CardTitle>
          <CardDescription>This information appears on your payslips</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="employee-name">Full Name</Label>
              <Input
                id="employee-name"
                value={settings.employeeName || ""}
                onChange={(e) => updateRate("employeeName", e.target.value)}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employee-id">Employee ID</Label>
              <Input
                id="employee-id"
                value={settings.employeeId || ""}
                onChange={(e) => updateRate("employeeId", e.target.value)}
                placeholder="EMP001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-name" className="flex items-center gap-1">
                <Building className="h-3 w-3" />
                Company Name
              </Label>
              <Input
                id="company-name"
                value={settings.companyName || ""}
                onChange={(e) => updateRate("companyName", e.target.value)}
                placeholder="Company Name"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="liquid-button liquid-gradient text-white min-w-[160px]"
        >
          {saved ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Saved!
            </>
          ) : isSaving ? (
            "Saving..."
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
