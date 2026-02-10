"use client"

import { Github, Heart } from "lucide-react"
import Link from "next/link"

const GITHUB_REPO = "https://github.com/aj4200/whatiearn"
const GITHUB_DEV = "https://github.com/aj4200"

export function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-border/50 bg-background/60 backdrop-blur-sm mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p className="text-center sm:text-left order-2 sm:order-1">
            © {new Date().getFullYear()} WhatIEarn. Salary calculator & time tracker.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 order-1 sm:order-2">
            <span className="inline-flex items-center gap-1.5 text-foreground/80">
              Made with <Heart className="h-3.5 w-3.5 text-primary fill-primary" aria-hidden /> by{" "}
              <Link
                href={GITHUB_DEV}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-foreground hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
                aria-label="aj4200 on GitHub"
              >
                <Github className="h-4 w-4" aria-hidden />
                aj4200
              </Link>
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
