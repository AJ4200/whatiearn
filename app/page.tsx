"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calculator, Clock, History, TrendingUp, CalendarDays, Settings } from "lucide-react"
import SalaryCalculator from "@/components/salary-calculator"
import TimeTracker from "@/components/time-tracker"
import WorkRecords from "@/components/work-records"
import MonthlyEarnings from "@/components/monthly-earnings"
import CalendarEntry from "@/components/calendar-entry"
import RateSettings from "@/components/rate-settings"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

export default function Home() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-[60%_40%_30%_70%_/_60%_30%_70%_40%] bg-blob-1 liquid-blob" />
        <div className="absolute top-1/2 -left-40 w-[400px] h-[400px] rounded-[60%_40%_30%_70%_/_60%_30%_70%_40%] bg-blob-2 liquid-blob-slow" />
        <div className="absolute -bottom-40 right-1/4 w-[450px] h-[450px] rounded-[60%_40%_30%_70%_/_60%_30%_70%_40%] bg-blob-3 liquid-blob-pulse" />
      </div>

      <SiteHeader />

      <main className="flex-1 container mx-auto p-4 relative z-10">
        <section className="text-center space-y-4 mb-8" aria-label="Welcome">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 rounded-2xl liquid-gradient float-animation shadow-lg">
              <Calculator className="h-10 w-10 text-white" aria-hidden />
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
              WhatIEarn
            </h2>
          </div>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Track hours, set rates for normal · Sunday · holiday, and see your earnings at a glance.
          </p>
        </section>

        <Tabs defaultValue="tracker" className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-6 glass-card">
       <TabsTrigger value="tracker" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Tracker</span>
            </TabsTrigger> 
                <TabsTrigger value="calculator" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              <span className="hidden sm:inline">Calculator</span>
            </TabsTrigger>       
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              <span className="hidden sm:inline">Calendar</span>
            </TabsTrigger>
            <TabsTrigger value="records" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">Records</span>
            </TabsTrigger>
            <TabsTrigger value="monthly" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Report</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calculator" className="space-y-6">
            <SalaryCalculator />
          </TabsContent>

          <TabsContent value="tracker" className="space-y-6">
            <TimeTracker />
          </TabsContent>

          <TabsContent value="calendar" className="space-y-6">
            <CalendarEntry />
          </TabsContent>

          <TabsContent value="records" className="space-y-6">
            <WorkRecords />
          </TabsContent>

          <TabsContent value="monthly" className="space-y-6">
            <MonthlyEarnings />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <RateSettings />
          </TabsContent>
        </Tabs>
      </main>

      <SiteFooter />
    </div>
  )
}
