"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { History, Edit, Trash2, CalendarIcon, Filter, Download, Clock, DollarSign } from "lucide-react"
import { dbManager, type WorkRecord } from "@/lib/database"
import { format } from "date-fns"
import {
  formatCurrency,
  formatHours,
  getWorkTypeBadgeVariant,
  calculateEarnings,
  type WorkType,
} from "@/lib/utils/work-utils"

export default function WorkRecords() {
  const [records, setRecords] = useState<WorkRecord[]>([])
  const [filteredRecords, setFilteredRecords] = useState<WorkRecord[]>([])
  const [selectedRecord, setSelectedRecord] = useState<WorkRecord | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({})
  const [workTypeFilter, setWorkTypeFilter] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadRecords()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [records, dateRange, workTypeFilter])

  const loadRecords = async () => {
    setIsLoading(true)
    const allRecords = await dbManager.getWorkRecords()
    setRecords(allRecords)
    setIsLoading(false)
  }

  const applyFilters = () => {
    let filtered = [...records]
    if (dateRange.from) {
      filtered = filtered.filter((r) => r.date >= format(dateRange.from!, "yyyy-MM-dd"))
    }
    if (dateRange.to) {
      filtered = filtered.filter((r) => r.date <= format(dateRange.to!, "yyyy-MM-dd"))
    }
    if (workTypeFilter !== "all") {
      filtered = filtered.filter((r) => r.workType === workTypeFilter)
    }
    setFilteredRecords(filtered)
  }

  const deleteRecord = async (id: number) => {
    await dbManager.deleteWorkRecord(id)
    await loadRecords()
  }

  const updateRecord = async (updatedRecord: WorkRecord) => {
    const earnings = calculateEarnings(updatedRecord.totalHours, updatedRecord.rate)
    await dbManager.updateWorkRecord(updatedRecord.id!, { ...updatedRecord, earnings })
    setIsEditDialogOpen(false)
    setSelectedRecord(null)
    await loadRecords()
  }

  const exportToCSV = () => {
    const headers = ["Date", "Clock In", "Clock Out", "Work Type", "Hours", "Rate", "Earnings"]
    const csvData = filteredRecords.map((r) => [
      r.date,
      r.clockIn ? format(new Date(r.clockIn), "HH:mm:ss") : "",
      r.clockOut ? format(new Date(r.clockOut), "HH:mm:ss") : "",
      r.workType,
      r.totalHours.toFixed(2),
      r.rate.toFixed(2),
      r.earnings.toFixed(2),
    ])
    const csvContent = [headers, ...csvData].map((row) => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `work-records-${format(new Date(), "yyyy-MM-dd")}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const stats = {
    totalHours: filteredRecords.reduce((sum, r) => sum + r.totalHours, 0),
    totalEarnings: filteredRecords.reduce((sum, r) => sum + r.earnings, 0),
    avgHoursPerDay:
      filteredRecords.length > 0
        ? filteredRecords.reduce((sum, r) => sum + r.totalHours, 0) / filteredRecords.length
        : 0,
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-primary" />
              <div>
                <div className="text-2xl font-bold">{formatHours(stats.totalHours)}</div>
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
                <div className="text-2xl font-bold">{formatCurrency(stats.totalEarnings)}</div>
                <div className="text-sm text-muted-foreground">Total Earnings</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <History className="h-4 w-4 text-primary" />
              <div>
                <div className="text-2xl font-bold">{formatHours(stats.avgHoursPerDay)}</div>
                <div className="text-sm text-muted-foreground">Avg Hours/Day</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            Filters & Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <Label>Date Range</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-[240px] justify-start text-left font-normal liquid-button bg-transparent"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Work Type</Label>
              <Select value={workTypeFilter} onValueChange={setWorkTypeFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="sunday">Sunday</SelectItem>
                  <SelectItem value="holiday">Holiday</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setDateRange({})}
                disabled={!dateRange.from && !dateRange.to}
                className="liquid-button"
              >
                Clear Filters
              </Button>
              <Button
                variant="outline"
                onClick={exportToCSV}
                disabled={filteredRecords.length === 0}
                className="liquid-button bg-transparent"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Work Records ({filteredRecords.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading records...</div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No records found for the selected filters.</div>
          ) : (
            <div className="space-y-3">
              {filteredRecords.map((record) => (
                <div key={record.id} className="border rounded-lg p-4 space-y-2 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="font-medium">{format(new Date(record.date), "dd MMM yyyy")}</div>
                      <Badge variant={getWorkTypeBadgeVariant(record.workType)}>{record.workType}</Badge>
                      {record.isActive && (
                        <Badge variant="outline" className="text-green-600">
                          Active
                        </Badge>
                      )}
                      {record.isManualEntry && (
                        <Badge variant="outline" className="text-blue-600">
                          Manual
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Dialog
                        open={isEditDialogOpen && selectedRecord?.id === record.id}
                        onOpenChange={setIsEditDialogOpen}
                      >
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={() => setSelectedRecord(record)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="glass-card">
                          <DialogHeader>
                            <DialogTitle>Edit Work Record</DialogTitle>
                          </DialogHeader>
                          {selectedRecord && (
                            <EditRecordForm
                              record={selectedRecord}
                              onSave={updateRecord}
                              onCancel={() => {
                                setIsEditDialogOpen(false)
                                setSelectedRecord(null)
                              }}
                            />
                          )}
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteRecord(record.id!)}
                        disabled={record.isActive}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Clock In</div>
                      <div className="font-medium">{format(new Date(record.clockIn), "HH:mm")}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Clock Out</div>
                      <div className="font-medium">
                        {record.clockOut ? format(new Date(record.clockOut), "HH:mm") : "Active"}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Hours</div>
                      <div className="font-medium">{formatHours(record.totalHours)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Earnings</div>
                      <div className="font-medium">{formatCurrency(record.earnings)}</div>
                    </div>
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

function EditRecordForm({
  record,
  onSave,
  onCancel,
}: {
  record: WorkRecord
  onSave: (record: WorkRecord) => void
  onCancel: () => void
}) {
  const [editedRecord, setEditedRecord] = useState<WorkRecord>({ ...record })

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="totalHours">Total Hours</Label>
          <Input
            id="totalHours"
            type="number"
            step="0.1"
            value={editedRecord.totalHours}
            onChange={(e) =>
              setEditedRecord((prev) => ({ ...prev, totalHours: Number.parseFloat(e.target.value) || 0 }))
            }
          />
        </div>
        <div>
          <Label htmlFor="rate">Rate (R/hour)</Label>
          <Input
            id="rate"
            type="number"
            step="0.01"
            value={editedRecord.rate}
            onChange={(e) => setEditedRecord((prev) => ({ ...prev, rate: Number.parseFloat(e.target.value) || 0 }))}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="workType">Work Type</Label>
        <Select
          value={editedRecord.workType}
          onValueChange={(value: WorkType) => setEditedRecord((prev) => ({ ...prev, workType: value }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="sunday">Sunday</SelectItem>
            <SelectItem value="holiday">Holiday</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} className="liquid-button bg-transparent">
          Cancel
        </Button>
        <Button onClick={() => onSave(editedRecord)} className="liquid-button liquid-gradient text-white">
          Save Changes
        </Button>
      </div>
    </div>
  )
}
