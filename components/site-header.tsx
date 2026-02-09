"use client"

import { Calculator } from "lucide-react"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          aria-label="WhatIEarn home"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg liquid-gradient float-animation">
            <Calculator className="h-5 w-5 text-white" aria-hidden />
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
            WhatIEarn
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground hidden sm:inline">
            Salary & time tracking
          </span>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
