import jsPDF from "jspdf"
import { format } from "date-fns"

interface PayslipData {
  period: string
  grossEarnings: number
  deductions: Array<{ name: string; amount: number }>
  netEarnings: number
  hoursBreakdown: {
    normal: number
    sunday: number
    holiday: number
    total: number
  }
  earningsBreakdown: {
    normal: number
    sunday: number
    holiday: number
  }
  workDays: number
  employeeName?: string
  employeeId?: string
  companyName?: string
}

export class PayslipPDFGenerator {
  private doc: jsPDF
  private pageWidth: number
  private pageHeight: number
  private margin: number

  constructor() {
    this.doc = new jsPDF("portrait", "mm", "a4")
    this.pageWidth = this.doc.internal.pageSize.getWidth()
    this.pageHeight = this.doc.internal.pageSize.getHeight()
    this.margin = 20
  }

  private drawGradientHeader() {
    // Create gradient effect using multiple rectangles with varying opacity
    const headerHeight = 40
    const steps = 20

    for (let i = 0; i < steps; i++) {
      const y = i * (headerHeight / steps)
      const opacity = 1 - (i / steps) * 0.7 // Fade from full opacity to 30%

      // Red to black gradient
      const red = Math.round(220 - (i / steps) * 220) // From 220 to 0
      const green = Math.round(20 - (i / steps) * 20) // From 20 to 0
      const blue = Math.round(60 - (i / steps) * 60) // From 60 to 0

      this.doc.setFillColor(red, green, blue)
      this.doc.setGState(this.doc.GState({ opacity }))
      this.doc.rect(0, y, this.pageWidth, headerHeight / steps, "F")
    }

    // Reset opacity
    this.doc.setGState(this.doc.GState({ opacity: 1 }))
  }

  private addCompanyHeader(companyName = "WhatIEarn") {
    this.drawGradientHeader()

    // Company name in white
    this.doc.setTextColor(255, 255, 255)
    this.doc.setFontSize(24)
    this.doc.setFont("helvetica", "bold")
    this.doc.text(companyName, this.margin, 25)

    // Payslip title
    this.doc.setFontSize(16)
    this.doc.setFont("helvetica", "normal")
    this.doc.text("PAYSLIP", this.pageWidth - this.margin - 30, 25)

    // Decorative line
    this.doc.setDrawColor(255, 255, 255)
    this.doc.setLineWidth(0.5)
    this.doc.line(this.margin, 32, this.pageWidth - this.margin, 32)
  }

  private addEmployeeInfo(data: PayslipData) {
    let yPos = 55

    // Reset text color to black
    this.doc.setTextColor(0, 0, 0)
    this.doc.setFontSize(12)
    this.doc.setFont("helvetica", "bold")

    // Employee section header with red accent
    this.doc.setFillColor(220, 20, 60)
    this.doc.rect(this.margin, yPos - 5, this.pageWidth - 2 * this.margin, 8, "F")
    this.doc.setTextColor(255, 255, 255)
    this.doc.text("EMPLOYEE INFORMATION", this.margin + 5, yPos)

    yPos += 15
    this.doc.setTextColor(0, 0, 0)
    this.doc.setFont("helvetica", "normal")

    // Employee details
    this.doc.text(`Employee Name: ${data.employeeName || "N/A"}`, this.margin, yPos)
    this.doc.text(`Employee ID: ${data.employeeId || "N/A"}`, this.pageWidth / 2, yPos)

    yPos += 8
    this.doc.text(`Pay Period: ${data.period}`, this.margin, yPos)
    this.doc.text(`Generated: ${format(new Date(), "dd MMM yyyy HH:mm")}`, this.pageWidth / 2, yPos)

    return yPos + 15
  }

  private addHoursSection(data: PayslipData, startY: number) {
    let yPos = startY

    // Hours section header
    this.doc.setFontSize(12)
    this.doc.setFont("helvetica", "bold")
    this.doc.setFillColor(180, 180, 180)
    this.doc.rect(this.margin, yPos - 5, this.pageWidth - 2 * this.margin, 8, "F")
    this.doc.setTextColor(0, 0, 0)
    this.doc.text("HOURS WORKED", this.margin + 5, yPos)

    yPos += 15
    this.doc.setFont("helvetica", "normal")
    this.doc.setFontSize(10)

    // Table headers
    const col1 = this.margin
    const col2 = this.margin + 60
    const col3 = this.margin + 120

    this.doc.setFont("helvetica", "bold")
    this.doc.text("Work Type", col1, yPos)
    this.doc.text("Hours", col2, yPos)
    this.doc.text("Rate Type", col3, yPos)

    // Underline headers
    this.doc.setDrawColor(0, 0, 0)
    this.doc.line(col1, yPos + 2, this.pageWidth - this.margin, yPos + 2)

    yPos += 10
    this.doc.setFont("helvetica", "normal")

    // Hours data
    const hoursData = [
      { type: "Normal Hours", hours: data.hoursBreakdown.normal, rate: "Standard Rate" },
      { type: "Sunday Hours", hours: data.hoursBreakdown.sunday, rate: "Premium Rate" },
      { type: "Holiday Hours", hours: data.hoursBreakdown.holiday, rate: "Holiday Rate" },
    ]

    hoursData.forEach((item) => {
      this.doc.text(item.type, col1, yPos)
      this.doc.text(`${item.hours.toFixed(2)}h`, col2, yPos)
      this.doc.text(item.rate, col3, yPos)
      yPos += 8
    })

    // Total hours
    yPos += 5
    this.doc.setFont("helvetica", "bold")
    this.doc.text("Total Hours:", col1, yPos)
    this.doc.text(`${data.hoursBreakdown.total.toFixed(2)}h`, col2, yPos)
    this.doc.text(`Work Days: ${data.workDays}`, col3, yPos)

    return yPos + 15
  }

  private addEarningsSection(data: PayslipData, startY: number) {
    let yPos = startY

    // Earnings section header with gradient accent
    this.doc.setFontSize(12)
    this.doc.setFont("helvetica", "bold")
    this.doc.setFillColor(220, 20, 60)
    this.doc.rect(this.margin, yPos - 5, this.pageWidth - 2 * this.margin, 8, "F")
    this.doc.setTextColor(255, 255, 255)
    this.doc.text("EARNINGS BREAKDOWN", this.margin + 5, yPos)

    yPos += 15
    this.doc.setTextColor(0, 0, 0)
    this.doc.setFont("helvetica", "normal")
    this.doc.setFontSize(10)

    // Table setup
    const col1 = this.margin
    const col2 = this.margin + 80
    const col3 = this.margin + 130

    this.doc.setFont("helvetica", "bold")
    this.doc.text("Earnings Type", col1, yPos)
    this.doc.text("Amount", col2, yPos)
    this.doc.text("Percentage", col3, yPos)

    this.doc.line(col1, yPos + 2, this.pageWidth - this.margin, yPos + 2)

    yPos += 10
    this.doc.setFont("helvetica", "normal")

    // Earnings data
    const totalEarnings = data.grossEarnings
    const earningsData = [
      { type: "Normal Pay", amount: data.earningsBreakdown.normal },
      { type: "Sunday Pay", amount: data.earningsBreakdown.sunday },
      { type: "Holiday Pay", amount: data.earningsBreakdown.holiday },
    ]

    earningsData.forEach((item) => {
      const percentage = totalEarnings > 0 ? ((item.amount / totalEarnings) * 100).toFixed(1) : "0.0"
      this.doc.text(item.type, col1, yPos)
      this.doc.text(`R${item.amount.toFixed(2)}`, col2, yPos)
      this.doc.text(`${percentage}%`, col3, yPos)
      yPos += 8
    })

    // Gross total
    yPos += 5
    this.doc.setFont("helvetica", "bold")
    this.doc.setFillColor(240, 240, 240)
    this.doc.rect(this.margin, yPos - 3, this.pageWidth - 2 * this.margin, 10, "F")
    this.doc.text("Gross Earnings:", col1, yPos + 3)
    this.doc.text(`R${data.grossEarnings.toFixed(2)}`, col2, yPos + 3)
    this.doc.text("100.0%", col3, yPos + 3)

    return yPos + 20
  }

  private addDeductionsSection(data: PayslipData, startY: number) {
    if (data.deductions.length === 0) return startY

    let yPos = startY

    // Deductions header
    this.doc.setFontSize(12)
    this.doc.setFont("helvetica", "bold")
    this.doc.setFillColor(100, 100, 100)
    this.doc.rect(this.margin, yPos - 5, this.pageWidth - 2 * this.margin, 8, "F")
    this.doc.setTextColor(255, 255, 255)
    this.doc.text("DEDUCTIONS", this.margin + 5, yPos)

    yPos += 15
    this.doc.setTextColor(0, 0, 0)
    this.doc.setFont("helvetica", "normal")
    this.doc.setFontSize(10)

    const col1 = this.margin
    const col2 = this.margin + 100

    data.deductions.forEach((deduction) => {
      this.doc.text(deduction.name, col1, yPos)
      this.doc.text(`-R${deduction.amount.toFixed(2)}`, col2, yPos)
      yPos += 8
    })

    // Total deductions
    const totalDeductions = data.deductions.reduce((sum, d) => sum + d.amount, 0)
    yPos += 5
    this.doc.setFont("helvetica", "bold")
    this.doc.text("Total Deductions:", col1, yPos)
    this.doc.text(`-R${totalDeductions.toFixed(2)}`, col2, yPos)

    return yPos + 15
  }

  private addNetEarnings(data: PayslipData, startY: number) {
    const yPos = startY

    // Net earnings with prominent styling
    this.doc.setFillColor(0, 0, 0)
    this.doc.rect(this.margin, yPos - 5, this.pageWidth - 2 * this.margin, 15, "F")

    this.doc.setTextColor(255, 255, 255)
    this.doc.setFontSize(16)
    this.doc.setFont("helvetica", "bold")
    this.doc.text("NET EARNINGS:", this.margin + 5, yPos + 5)
    this.doc.text(`R${data.netEarnings.toFixed(2)}`, this.pageWidth - this.margin - 50, yPos + 5)

    return yPos + 25
  }

  private addFooter() {
    const footerY = this.pageHeight - 30

    // Decorative footer line with gradient effect
    this.doc.setDrawColor(220, 20, 60)
    this.doc.setLineWidth(2)
    this.doc.line(this.margin, footerY, this.pageWidth - this.margin, footerY)

    this.doc.setTextColor(100, 100, 100)
    this.doc.setFontSize(8)
    this.doc.setFont("helvetica", "italic")
    this.doc.text("This is a computer-generated payslip. No signature required.", this.margin, footerY + 10)
    this.doc.text(`Generated by WhatIEarn App - ${format(new Date(), "dd/MM/yyyy HH:mm")}`, this.margin, footerY + 15)
  }

  public generatePayslip(data: PayslipData): void {
    // Add company header
    this.addCompanyHeader(data.companyName)

    // Add employee information
    let currentY = this.addEmployeeInfo(data)

    // Add hours section
    currentY = this.addHoursSection(data, currentY)

    // Add earnings section
    currentY = this.addEarningsSection(data, currentY)

    // Add deductions section
    currentY = this.addDeductionsSection(data, currentY)

    // Add net earnings
    currentY = this.addNetEarnings(data, currentY)

    // Add footer
    this.addFooter()

    // Save the PDF
    const fileName = `payslip-${data.period.replace(/[^a-zA-Z0-9]/g, "-")}-${format(new Date(), "yyyy-MM-dd")}.pdf`
    this.doc.save(fileName)
  }
}
